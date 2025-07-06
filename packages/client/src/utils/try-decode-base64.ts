export function tryDecodeBase64(str: string): string {
  try {
    // Remove all whitespace (including newlines) for validation
    const cleaned = str.replace(/\s/g, '');

    // Check if the string looks like base64
    // Base64 strings should only contain A-Z, a-z, 0-9, +, /, and = (padding)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

    // Additional checks for valid base64
    if (!cleaned || !base64Regex.test(cleaned)) {
      return str;
    }

    // The length of a base64 string should be a multiple of 4
    if (cleaned.length % 4 !== 0) {
      return str;
    }

    // Try to decode using the appropriate method
    let decoded: string;

    if (typeof Buffer !== 'undefined') {
      // Node.js environment
      decoded = Buffer.from(cleaned, 'base64').toString('utf-8');
    } else if (typeof atob !== 'undefined') {
      // Browser environment
      try {
        decoded = decodeURIComponent(
          atob(cleaned)
            .split('')
            .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
            .join(''),
        );
      } catch {
        // If decoding fails, try without URI decoding (for non-UTF8 content)
        decoded = atob(cleaned);
      }
    } else {
      // Unsupported environment
      return str;
    }

    // Check if the decoded string contains valid characters
    // The replacement character () indicates invalid UTF-8
    if (decoded.includes('\ufffd') || decoded.length === 0) {
      return str;
    }

    // Additional check: if the decoded string is significantly smaller than the original,
    // and the original looks like JSON or readable text, it's probably not base64
    const trimmed = str.trim();
    if (
      decoded.length < trimmed.length * 0.5 &&
      (trimmed.startsWith('{') || trimmed.startsWith('['))
    ) {
      return str;
    }

    return decoded;
  } catch {
    return str;
  }
}
