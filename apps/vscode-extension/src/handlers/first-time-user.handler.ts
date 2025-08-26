import { debug } from '@unhook/logger';
import type { AuthStore } from '../services/auth.service';
import type { FirstTimeUserService } from '../services/first-time-user.service';

const log = debug('unhook:vscode:first-time-user-handler');

export function setupFirstTimeUserHandler(
  authStore: AuthStore,
  firstTimeUserService: FirstTimeUserService,
): void {
  let previousAuthState = authStore.isSignedIn;
  log('Setting up workspace config handler', {
    initialAuthState: previousAuthState,
  });

  // Check if user is already signed in during initialization
  // Add a delay to ensure everything is properly initialized
  if (previousAuthState) {
    log(
      'User is already signed in during initialization, checking if workspace needs config with 2 second delay',
    );
    setTimeout(async () => {
      await firstTimeUserService.checkAndShowWorkspaceConfigPromptsIfNeeded();
    }, 2000);
  }

  // Note: Removed the immediate forceCheckWorkspaceStatus call to prevent duplicate prompts
  // The handler now only triggers prompts when explicitly needed (auth state changes, etc.)

  authStore.onDidChangeAuth(() => {
    const currentAuthState = authStore.isSignedIn;
    log('Auth state changed', {
      currentAuthState,
      isTransitionToSignedIn: !previousAuthState && currentAuthState,
      previousAuthState,
    });

    // Check if user just signed in (transition from not signed in to signed in)
    if (!previousAuthState && currentAuthState) {
      log('User signed in, checking if workspace needs config');
      // Check if workspace needs config and show prompts if needed
      firstTimeUserService
        .checkAndShowWorkspaceConfigPromptsIfNeeded()
        .catch((error) => {
          log('Error checking workspace config status', { error });
        });
    }

    previousAuthState = currentAuthState;
  });
}
