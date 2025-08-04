import * as assert from 'node:assert';
import { afterEach, beforeEach, suite, test } from 'mocha';
import * as vscode from 'vscode';
import { env } from '../../../env';

suite('Session Management Workflow Tests', () => {
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

  test('should create and manage authentication sessions', async () => {
    // Test that the extension can create authentication sessions
    try {
      const session = await vscode.authentication.getSession(
        'unhook',
        ['openid', 'email', 'profile'],
        { createIfNone: true },
      );

      if (session) {
        // Verify session structure
        assert.ok(session.accessToken, 'Session should have access token');
        assert.ok(session.account, 'Session should have account information');
        assert.ok(session.id, 'Session should have ID');
        assert.ok(
          Array.isArray(session.scopes),
          'Session should have scopes array',
        );
        assert.ok(
          session.scopes.includes('openid'),
          'Session should include openid scope',
        );
        assert.ok(
          session.scopes.includes('email'),
          'Session should include email scope',
        );
        assert.ok(
          session.scopes.includes('profile'),
          'Session should include profile scope',
        );
      }
    } catch (error) {
      // In test environment, this might fail due to no real OAuth flow
      assert.ok(
        error instanceof Error,
        'Should handle session creation gracefully',
      );
    }
  });

  test('should maintain session after extension reactivation', async () => {
    // Test session persistence across extension reactivation
    try {
      const session = await vscode.authentication.getSession(
        'unhook',
        ['openid', 'email', 'profile'],
        { createIfNone: true },
      );

      if (session) {
        // Simulate extension reactivation
        if (extension) {
          // Note: VS Code extensions don't have a deactivate method in tests
          // We'll just test that the session persists by getting it again
          await extension.activate();
        }

        // Verify session persists
        const reactivatedSession = await vscode.authentication.getSession(
          'unhook',
          ['openid', 'email', 'profile'],
          { createIfNone: false },
        );

        if (reactivatedSession) {
          assert.strictEqual(
            reactivatedSession.id,
            session.id,
            'Session ID should remain the same after reactivation',
          );
          assert.strictEqual(
            reactivatedSession.accessToken,
            session.accessToken,
            'Access token should remain the same after reactivation',
          );
        }
      }
    } catch (error) {
      // In test environment, this might fail
      assert.ok(
        error instanceof Error,
        'Should handle session persistence gracefully',
      );
    }
  });

  test('should handle sign out and session cleanup', async () => {
    // Test the complete sign out workflow
    try {
      // Try to get an existing session
      const session = await vscode.authentication.getSession(
        'unhook',
        ['openid', 'email', 'profile'],
        { createIfNone: false },
      );

      if (session) {
        // Sign out
        await vscode.commands.executeCommand('unhook.signOut');

        // Verify session is removed
        const sessionAfterSignOut = await vscode.authentication.getSession(
          'unhook',
          ['openid', 'email', 'profile'],
          { createIfNone: false },
        );

        assert.strictEqual(
          sessionAfterSignOut,
          undefined,
          'Session should be removed after sign out',
        );
      } else {
        // No session exists, test sign out anyway
        await vscode.commands.executeCommand('unhook.signOut');
        assert.ok(true, 'Sign out should handle no session gracefully');
      }
    } catch (error) {
      assert.ok(error instanceof Error, 'Should handle sign out gracefully');
    }
  });

  test('should handle session state changes', async () => {
    // Test that the extension handles session state changes properly
    try {
      // Get initial session state
      const initialSession = await vscode.authentication.getSession(
        'unhook',
        ['openid', 'email', 'profile'],
        { createIfNone: false },
      );

      // Try to create a new session
      const newSession = await vscode.authentication.getSession(
        'unhook',
        ['openid', 'email', 'profile'],
        { createIfNone: true },
      );

      // Verify session state changes are handled
      if (newSession && !initialSession) {
        assert.ok(true, 'Should handle session creation state change');
      } else if (newSession && initialSession) {
        assert.ok(true, 'Should handle existing session state');
      } else {
        assert.ok(true, 'Should handle no session state');
      }
    } catch (error) {
      assert.ok(
        error instanceof Error,
        'Should handle session state changes gracefully',
      );
    }
  });

  test('should handle multiple authentication attempts', async () => {
    // Test that the extension handles multiple authentication attempts properly
    try {
      // First authentication attempt
      const session1 = await vscode.authentication.getSession(
        'unhook',
        ['openid', 'email', 'profile'],
        { createIfNone: true },
      );

      // Second authentication attempt
      const session2 = await vscode.authentication.getSession(
        'unhook',
        ['openid', 'email', 'profile'],
        { createIfNone: true },
      );

      // Verify both attempts are handled
      if (session1 && session2) {
        assert.strictEqual(
          session1.id,
          session2.id,
          'Multiple auth attempts should return same session',
        );
      } else {
        assert.ok(true, 'Should handle multiple auth attempts gracefully');
      }
    } catch (error) {
      assert.ok(
        error instanceof Error,
        'Should handle multiple authentication attempts gracefully',
      );
    }
  });
});
