import { tryDecodeBase64 } from './try-decode-base64';
import { tryParseJson } from './try-parse-json';

export function extractBody(body?: string | null): string | null {
  if (!body) return null;

  const trimmedBody = body.trim();

  // 1) JSON direct
  if (trimmedBody.startsWith('{') || trimmedBody.startsWith('[')) {
    const prettified = tryParseJson(trimmedBody);
    if (prettified !== trimmedBody) return prettified;
  }

  // 2) JWT: try to decode payload if looks like a JWT
  const jwtParts = trimmedBody.split('.');
  if (jwtParts.length === 3 && jwtParts.every((p) => p.length > 0)) {
    try {
      const payload = jwtParts[1]?.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = tryDecodeBase64(payload ?? '');
      const prettified = tryParseJson(decoded);
      if (prettified && prettified !== decoded) return prettified;
      if (decoded !== payload) return decoded;
    } catch {
      // ignore
    }
  }

  // 3) application/x-www-form-urlencoded
  if (trimmedBody.includes('=') && trimmedBody.includes('&')) {
    try {
      const params = new URLSearchParams(trimmedBody);
      const obj: Record<string, string> = {};
      for (const [k, v] of params.entries()) obj[k] = v;
      return JSON.stringify(obj, null, 2);
    } catch {
      // ignore
    }
  }

  // 4) Base64
  const decodedBody = tryDecodeBase64(body);
  if (decodedBody !== body) {
    const prettified = tryParseJson(decodedBody);
    if (prettified !== decodedBody) return prettified;
    return decodedBody;
  }

  return body;
}
