import { authMe } from '../_shared/base44compat.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { isPrivateOrInvalidUrl, safeFetch, isImageMagicBytes } from '../_shared/ssrf.ts';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const user = await authMe(req);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400, headers: corsHeaders });

    if (isPrivateOrInvalidUrl(file_url)) {
      return Response.json({ valid: false, reason: 'Blocked: URL points to a private/internal address or uses a non-http(s) scheme' }, { headers: corsHeaders });
    }

    const resp = await safeFetch(file_url);
    if (!resp.ok) {
      return Response.json({ valid: false, reason: 'File not accessible' }, { headers: corsHeaders });
    }

    const contentLength = parseInt(resp.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_FILE_SIZE) {
      return Response.json({ valid: false, reason: `File exceeds 10MB limit (${contentLength} bytes)` }, { headers: corsHeaders });
    }

    const reader = resp.body?.getReader();
    if (!reader) {
      return Response.json({ valid: false, reason: 'Unable to read file content' }, { headers: corsHeaders });
    }
    const { value: firstChunk } = await reader.read();
    await reader.cancel();

    if (!firstChunk) {
      return Response.json({ valid: false, reason: 'Empty file' }, { headers: corsHeaders });
    }

    if (!isImageMagicBytes(firstChunk)) {
      return Response.json({ valid: false, reason: 'File is not a valid image (JPEG, PNG, GIF, or WebP required)' }, { headers: corsHeaders });
    }

    return Response.json({ valid: true, size: contentLength }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
