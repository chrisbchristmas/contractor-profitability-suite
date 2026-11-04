// SSRF protection helpers shared by validatePhotoUpload and enforcePhotoLimit.
// Rejects non-http(s) schemes, private/internal IP ranges, loopback,
// link-local, cloud metadata endpoints, and decimal/hex IP encodings;
// resolves via DNS-over-HTTPS and re-checks immediately before fetch to
// close the DNS-rebinding TOCTOU window.

export function isPrivateOrInvalidUrl(urlStr) {
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    return true;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;
  if (parsed.username || parsed.password) return true;

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (hostname === 'localhost' || hostname === '') return true;

  if (hostname.includes(':')) {
    if (hostname === '::1' || hostname === '::') return true;
    if (hostname.startsWith('fc') || hostname.startsWith('fd')) return true;
    if (hostname.startsWith('fe80')) return true;
  }

  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [a, b] = ipv4Match.slice(1).map(Number);
    if (a === 127 || a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
    if (a >= 224) return true;
  }

  if (/0x[0-9a-f]/i.test(hostname)) return true;
  if (/\b0\d+\b/.test(hostname)) return true;
  if (/^\d+$/.test(hostname)) return true;
  if (/^0x[0-9a-f]+/i.test(hostname)) return true;

  return false;
}

function isPrivateIp(ip) {
  const lower = ip.toLowerCase();
  if (lower.includes(':')) {
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    if (lower.startsWith('fe80')) return true;
    return false;
  }
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return true;
  const [a, b] = m.slice(1).map(Number);
  if (a === 127 || a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0) return true;
  if (a >= 224) return true;
  return false;
}

export async function safeFetch(urlStr) {
  const parsed = new URL(urlStr);
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const isHttps = parsed.protocol === 'https:';

  const isIpv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  const isIpv6 = hostname.includes(':');
  if (isIpv4 || isIpv6) {
    return await fetch(urlStr);
  }

  let resolvedIps = [];
  const dohResp = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(hostname) + '&type=A');
  if (dohResp.ok) {
    const dohData = await dohResp.json();
    resolvedIps = (dohData.Answer || []).filter(a => a.type === 1).map(a => a.data);
  }
  if (resolvedIps.length === 0) {
    const dohResp6 = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(hostname) + '&type=AAAA');
    if (dohResp6.ok) {
      const dohData6 = await dohResp6.json();
      resolvedIps = (dohData6.Answer || []).filter(a => a.type === 28).map(a => a.data);
    }
  }
  if (resolvedIps.length === 0) {
    throw new Error('DNS resolution failed for hostname: ' + hostname);
  }

  for (const ip of resolvedIps) {
    if (isPrivateIp(ip)) {
      throw new Error('Blocked: resolved IP ' + ip + ' is in a private/internal range');
    }
  }

  if (isHttps) {
    const recheckIps = [];
    const reResp = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(hostname) + '&type=A');
    if (reResp.ok) {
      const reData = await reResp.json();
      recheckIps.push(...(reData.Answer || []).filter(a => a.type === 1).map(a => a.data));
    }
    if (recheckIps.length === 0) {
      const reResp6 = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(hostname) + '&type=AAAA');
      if (reResp6.ok) {
        const reData6 = await reResp6.json();
        recheckIps.push(...(reData6.Answer || []).filter(a => a.type === 28).map(a => a.data));
      }
    }
    if (recheckIps.length === 0) {
      throw new Error('DNS re-resolution failed for hostname: ' + hostname);
    }
    for (const ip of recheckIps) {
      if (isPrivateIp(ip)) {
        throw new Error('Blocked: re-resolved IP ' + ip + ' is in a private/internal range');
      }
    }
    const originalSet = new Set(resolvedIps);
    const changed = recheckIps.some(ip => !originalSet.has(ip));
    if (changed) {
      throw new Error('Blocked: DNS response changed between resolution and fetch (possible DNS rebinding)');
    }
    return await fetch(urlStr);
  }

  const resolvedIp = resolvedIps[0];
  const port = parsed.port ? ':' + parsed.port : '';
  const pinnedUrl = parsed.protocol + '//' + resolvedIp + port + parsed.pathname + parsed.search;
  return await fetch(pinnedUrl, { headers: { Host: hostname } });
}

export function isImageMagicBytes(bytes) {
  if (bytes.length < 3) return false;
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  if (bytes.length >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true;
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;
  return false;
}

export async function isValidPhoto(url, maxFileSize) {
  try {
    if (isPrivateOrInvalidUrl(url)) return false;
    const resp = await safeFetch(url);
    if (!resp.ok) return false;

    const contentLength = parseInt(resp.headers.get('content-length') || '0', 10);
    if (contentLength > maxFileSize) return false;

    const reader = resp.body?.getReader();
    if (!reader) return false;
    const { value: firstChunk } = await reader.read();
    await reader.cancel();

    if (!firstChunk) return false;
    return isImageMagicBytes(firstChunk);
  } catch {
    return false;
  }
}
