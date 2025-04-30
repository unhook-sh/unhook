import { debug } from '@unhook/logger';
import { capture, captureException } from '../posthog';

const log = debug('unhook:cli:auth-errors');

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>,
    options?: { cause?: Error },
  ) {
    super(message, options);
    this.name = 'AuthError';
  }

  logAndCapture(): void {
    log('Auth error', this);
    captureException(this);
    capture({
      event: `auth_error_${this.code}`,
      properties: {
        error: this.message,
        ...this.details,
        cause: this.cause instanceof Error ? this.cause.message : undefined,
      },
    });
  }
}

export class InvalidAuthResponseError extends AuthError {
  constructor(details: Record<string, unknown>) {
    super('Invalid authentication response', 'invalid_response', details);
  }
}

export class AuthenticationInProgressError extends AuthError {
  constructor() {
    super('Authentication already in progress', 'already_in_progress');
  }
}

export class ClerkSignInError extends AuthError {
  constructor() {
    super('Failed to sign in with Clerk', 'clerk_signin_failed');
  }
}

export class MissingTokenError extends AuthError {
  constructor(source: 'clerk' | 'callback') {
    super(`Token was not returned from ${source}`, 'missing_token', { source });
  }
}

export class MissingUserError extends AuthError {
  constructor() {
    super('Failed to get user', 'missing_user');
  }
}

export class TokenExpiredError extends AuthError {
  constructor() {
    super('Token expired', 'token_expired');
  }
}

export function handleAuthError(error: unknown): never {
  log('Handling auth error', error);
  const authError =
    error instanceof AuthError
      ? error
      : new AuthError(
          error instanceof Error
            ? error.message
            : 'Unknown authentication error',
          'unknown',
          undefined,
          { cause: error instanceof Error ? error : undefined },
        );

  authError.logAndCapture();
  throw authError;
}
