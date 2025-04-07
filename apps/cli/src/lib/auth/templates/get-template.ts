import fs from 'node:fs';
import path from 'node:path';

/**
 * Reads the auth success template HTML file
 * @returns The HTML content of the success template
 */
export function getAuthSuccessTemplate(): string {
  try {
    return fs.readFileSync(
      path.join(__dirname, '..', 'templates', 'auth-success.html'),
      'utf-8',
    );
  } catch (_error) {
    // Fallback template in case the file cannot be read
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
        </head>
        <body>
          <h1>Authentication Successful</h1>
          <p>You can now close this window and return to the CLI.</p>
        </body>
      </html>
    `;
  }
}
