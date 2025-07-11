import { tryDecodeBase64 } from './try-decode-base64';
import { tryParseJson } from './try-parse-json';

export function extractBody(body?: string | null): string | null {
  if (!body) return null;

  // First, check if the body is already readable JSON
  const trimmedBody = body.trim();
  if (trimmedBody.startsWith('{') || trimmedBody.startsWith('[')) {
    // It looks like JSON, try to parse and pretty-print it
    const prettified = tryParseJson(trimmedBody);
    // If parsing succeeded (prettified is different), return it
    if (prettified !== trimmedBody) {
      return prettified;
    }
  }

  // If not JSON, try to decode from base64
  const decodedBody = tryDecodeBase64(body);

  // If decoding changed the content, try to parse it as JSON
  if (decodedBody !== body) {
    return tryParseJson(decodedBody);
  }

  // Otherwise, return the original body
  return body;
}
