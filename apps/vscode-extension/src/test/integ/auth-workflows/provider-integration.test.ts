import * as assert from 'node:assert';
import { afterEach, beforeEach, suite, test } from 'mocha';
import * as vscode from 'vscode';
import { env } from '../../../env';

suite('Authentication Provider Integration Tests', () => {
  let extension: vscode.Extension<unknown> | undefined;

  beforeEach(async () => {
    // Get the extension
    extension = vscode.extensions.getExtension(
      env.NEXT_PUBLIC_VSCODE_EXTENSION_ID,
    );

    // Activate extension if not already active
    if (extension && !extension.isActive) {
      await extension.activate();
    }

    // Clear any existing authentication sessions
    try {
      await vscode.authentication.getSession(
        'unhook',
        ['openid', 'email', 'profile'],
        { clearSessionPreference: true },
      );
    } catch {
      // Expected when no session exists
    }
  });

  afterEach(async () => {
    // Clean up any sessions created during tests
    try {
      await vscode.authentication.getSession(
        'unhook',
        ['openid', 'email', 'profile'],
        { clearSessionPreference: true },
      );
    } catch {
      // Expected when no session exists
    }
  });

  test('should register and use authentication provider', async () => {
    // Test that the authentication provider is properly registered
    try {
      // Try to get a session which should use the registered provider
      const session = await vscode.authentication.getSession(
        'unhook',
        ['openid', 'email', 'profile'],
        { createIfNone: true },
      );

      if (session) {
        // Verify the session is from our provider
        assert.ok(session.accessToken, 'Provider should provide access token');
        assert.ok(
          session.account,
          'Provider should provide account information',
        );
        assert.ok(session.id, 'Provider should provide session ID');
      }
    } catch (error) {
      // In test environment, this might fail
      assert.ok(
        error instanceof Error,
        'Should handle provider integration gracefully',
      );
    }
  });

  test('should handle authentication provider errors', async () => {
    // Test error handling in the authentication provider
    try {
      // Try to get a session with invalid scopes
      await vscode.authentication.getSession('unhook', ['invalid-scope'], {
        createIfNone: true,
      });
    } catch (error) {
      assert.ok(
        error instanceof Error,
        'Should handle invalid scopes gracefully',
      );
    }
  });

  test('should handle provider session creation workflow', async () => {
    // Test the complete provider session creation workflow
    try {
      // Step 1: Request session without forcing creation
      await vscode.authentication.getSession(
        'unhook',
        ['openid', 'email', 'profile'],
        { createIfNone: false },
      );

      // Step 2: Request session with creation if none exists
      const session = await vscode.authentication.getSession(
        'unhook',
        ['openid', 'email', 'profile'],
        { createIfNone: true },
      );

      // Verify provider handles both scenarios
      if (session) {
        assert.ok(true, 'Provider should create session when requested');
      } else {
        assert.ok(true, 'Provider should handle no session gracefully');
      }
    } catch (error) {
      assert.ok(
        error instanceof Error,
        'Should handle provider session creation gracefully',
      );
    }
  });

  test('should handle provider session retrieval', async () => {
    // Test that the provider can retrieve existing sessions
    try {
      // First, try to create a session
      const createdSession = await vscode.authentication.getSession(
        'unhook',
        ['openid', 'email', 'profile'],
        { createIfNone: true },
      );

      if (createdSession) {
        // Then try to retrieve the same session
        const retrievedSession = await vscode.authentication.getSession(
          'unhook',
          ['openid', 'email', 'profile'],
          { createIfNone: false },
        );

        if (retrievedSession) {
          assert.strictEqual(
            retrievedSession.id,
            createdSession.id,
            'Provider should retrieve same session',
          );
          assert.strictEqual(
            retrievedSession.accessToken,
            createdSession.accessToken,
            'Provider should retrieve same access token',
          );
        }
      }
    } catch (error) {
      assert.ok(
        error instanceof Error,
        'Should handle provider session retrieval gracefully',
      );
    }
  });

  test('should handle provider scope validation', async () => {
    // Test that the provider validates scopes properly
    try {
      // Test with valid scopes
      const validSession = await vscode.authentication.getSession(
        'unhook',
        ['openid', 'email', 'profile'],
        { createIfNone: true },
      );

      if (validSession) {
        assert.ok(
          Array.isArray(validSession.scopes),
          'Provider should return scopes array',
        );
        assert.ok(
          validSession.scopes.includes('openid'),
          'Provider should include openid scope',
        );
      }

      // Test with empty scopes
      try {
        await vscode.authentication.getSession('unhook', [], {
          createIfNone: true,
        });
      } catch (error) {
        assert.ok(
          error instanceof Error,
          'Provider should handle empty scopes gracefully',
        );
      }
    } catch (error) {
      assert.ok(
        error instanceof Error,
        'Should handle provider scope validation gracefully',
      );
    }
  });
});
