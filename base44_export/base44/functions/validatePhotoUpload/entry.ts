import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// SSRF protection: reject non-http(s) schemes, private/internal IP ranges,
// loopback, link-local, cloud metadata endpoints, and decimal/hex IP encodings.
function isPrivateOrInvalidUrl(urlStr) {
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    return true;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;

  // Reject URLs with credentials embedded
  if (parsed.username || parsed.password) return true;

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();

  // Block plain hostname overrides
  if (hostname === 'localhost' || hostname === '' ) return true;

  // Block IPv6 loopback, ULA (fc/fd), link-local (fe80)
  if (hostname.includes(':')) {
    if (hostname === '::1' || hostname === '::') return true;
    if (hostname.startsWith('fc') || hostname.startsWith('fd')) return true;
    if (hostname.startsWith('fe80')) return true;
  }

  // Block IPv4 private/reserved ranges, loopback, link-local, cloud metadata
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [a, b] = ipv4Match.slice(1).map(Number);
    if (a === 127 || a === 10) return true;           // loopback, private 10.x
    if (a === 172 && b >= 16 && b <= 31) return true;  // private 172.16-31
    if (a === 192 && b === 168) return true;            // private 192.168
    if (a === 169 && b === 254) return true;             // link-local + cloud metadata (169.254.169.254)
    if (a === 0) return true;                            // 0.0.0.0/8
    if (a >= 224) return true;                          // multicast / reserved
  }

  // Block hex-encoded dotted IP octets (e.g. 0x7f.0x00.0x00.0x01)
  if (/0x[0-9a-f]/i.test(hostname)) return true;

  // Block octal-encoded dotted IP octets (e.g. 0177.0.0.1)
  if (/\b0\d+\b/.test(hostname)) return true;

  // Block decimal/octal IP encodings (e.g. 2130706433, 0x7f000001)
  if (/^\d+$/.test(hostname)) return true;
  if (/^0x[0-9a-f]+/i.test(hostname)) return true;

  return false;
}

// Check a resolved IP address against the private/loopback/link-local blocklist
function isPrivateIp(ip) {
  const lower = ip.toLowerCase();
  // IPv6
  if (lower.includes(':')) {
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA
    if (lower.startsWith('fe80')) return true; // link-local
    return false;
  }
  // IPv4
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return true; // unknown format — block
  const [a, b] = m.slice(1).map(Number);
  if (a === 127 || a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0) return true;
  if (a >= 224) return true;
  return false;
}

// Resolve hostname via DNS-over-HTTPS (Google resolver), check all resolved IPs,
// and fetch with IP pinning to prevent TOCTOU DNS rebinding
async function safeFetch(urlStr) {
  const parsed = new URL(urlStr);
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const isHttps = parsed.protocol === 'https:';

  // If hostname is already a literal IP, isPrivateOrInvalidUrl already validated it — fetch directly
  const isIpv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  const isIpv6 = hostname.includes(':');
  if (isIpv4 || isIpv6) {
    return await fetch(urlStr);
  }

  // Resolve DNS via Google's DNS-over-HTTPS API (fixed, known-safe endpoint)
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

  // Block if ANY resolved IP is private/internal
  for (const ip of resolvedIps) {
    if (isPrivateIp(ip)) {
      throw new Error('Blocked: resolved IP ' + ip + ' is in a private/internal range');
    }
  }

  // For HTTPS, IP-pinning breaks TLS cert validation — instead perform a
  // second DNS resolution immediately before the fetch and reject if the
  // resolved IP has changed since the first check (closes DNS rebinding window)
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

  // For HTTP, pin fetch to the resolved IP and set Host header so the server routes correctly
  const resolvedIp = resolvedIps[0];
  const port = parsed.port ? ':' + parsed.port : '';
  const pinnedUrl = parsed.protocol + '//' + resolvedIp + port + parsed.pathname + parsed.search;
  return await fetch(pinnedUrl, {
    headers: { Host: hostname }
  });
}

function isImageMagicBytes(bytes) {
  if (bytes.length < 3) return false;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  // GIF: 47 49 46 38
  if (bytes.length >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true;
  // WebP: RIFF....WEBP
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;
  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    if (isPrivateOrInvalidUrl(file_url)) {
      return Response.json({ valid: false, reason: 'Blocked: URL points to a private/internal address or uses a non-http(s) scheme' });
    }

    const resp = await safeFetch(file_url);
    if (!resp.ok) {
      return Response.json({ valid: false, reason: 'File not accessible' });
    }

    const contentLength = parseInt(resp.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_FILE_SIZE) {
      return Response.json({ valid: false, reason: `File exceeds 10MB limit (${contentLength} bytes)` });
    }

    const reader = resp.body?.getReader();
    if (!reader) {
      return Response.json({ valid: false, reason: 'Unable to read file content' });
    }
    const { value: firstChunk } = await reader.read();
    await reader.cancel();

    if (!firstChunk) {
      return Response.json({ valid: false, reason: 'Empty file' });
    }

    if (!isImageMagicBytes(firstChunk)) {
      return Response.json({ valid: false, reason: 'File is not a valid image (JPEG, PNG, GIF, or WebP required)' });
    }

    return Response.json({ valid: true, size: contentLength });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});