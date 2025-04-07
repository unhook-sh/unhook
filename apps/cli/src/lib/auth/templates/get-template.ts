import { file } from 'bun';
import authSuccessTemplate from '../../../templates/auth-success.html' with {
  type: 'file',
};

/**
 * Gets the auth success template HTML
 * @returns The HTML content of the success template
 */
export async function getAuthSuccessTemplate(): Promise<string> {
  try {
    return await file(authSuccessTemplate).text();
  } catch (error) {
    // Fallback template in case the embedded file cannot be read
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
