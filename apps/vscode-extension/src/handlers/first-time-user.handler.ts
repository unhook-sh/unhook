import { debug } from '@unhook/logger';
import type { AuthStore } from '../services/auth.service';
import type { FirstTimeUserService } from '../services/first-time-user.service';

const log = debug('unhook:vscode:first-time-user-handler');

export function setupFirstTimeUserHandler(
  authStore: AuthStore,
  firstTimeUserService: FirstTimeUserService,
): void {
  let previousAuthState = authStore.isSignedIn;
  log('Setting up first-time user handler', {
    initialAuthState: previousAuthState,
  });

  // Check if user is already signed in during initialization
  if (previousAuthState) {
    log(
      'User is already signed in during initialization, checking if first-time user',
    );
    firstTimeUserService
      .isFirstTimeUser()
      .then((isFirstTime) => {
        log('First-time user check result (initialization)', { isFirstTime });
        if (isFirstTime) {
          log('User is first-time user and already signed in, showing prompts');
          // Show analytics consent prompt first, then unhook.yml prompt
          setTimeout(async () => {
            // Check if we've already asked for analytics consent
            const hasAskedForConsent =
              await firstTimeUserService.hasAskedForAnalyticsConsent();
            log('Analytics consent check (initialization)', {
              hasAskedForConsent,
            });
            if (!hasAskedForConsent) {
              log('Showing analytics consent prompt (initialization)');
              await firstTimeUserService.promptForAnalyticsConsent();
            }

            // Show unhook.yml prompt after a short delay
            setTimeout(() => {
              log('Showing unhook.yml creation prompt (initialization)');
              firstTimeUserService.promptForUnhookYmlCreation();
            }, 500);
          }, 1000);
        } else {
          log('User is not first-time user (initialization), skipping prompts');
        }
      })
      .catch((error) => {
        log('Error checking first-time user status (initialization)', {
          error,
        });
      });
  }

  authStore.onDidChangeAuth(() => {
    const currentAuthState = authStore.isSignedIn;
    log('Auth state changed', {
      currentAuthState,
      isTransitionToSignedIn: !previousAuthState && currentAuthState,
      previousAuthState,
    });

    // Check if user just signed in (transition from not signed in to signed in)
    if (!previousAuthState && currentAuthState) {
      log('User signed in, checking if first-time user');
      // Check if first-time user
      firstTimeUserService
        .isFirstTimeUser()
        .then((isFirstTime) => {
          log('First-time user check result', { isFirstTime });
          if (isFirstTime) {
            log('User is first-time user, showing prompts');
            // Show analytics consent prompt first, then unhook.yml prompt
            setTimeout(async () => {
              // Check if we've already asked for analytics consent
              const hasAskedForConsent =
                await firstTimeUserService.hasAskedForAnalyticsConsent();
              log('Analytics consent check', { hasAskedForConsent });
              if (!hasAskedForConsent) {
                log('Showing analytics consent prompt');
                await firstTimeUserService.promptForAnalyticsConsent();
              }

              // Show unhook.yml prompt after a short delay
              setTimeout(() => {
                log('Showing unhook.yml creation prompt');
                firstTimeUserService.promptForUnhookYmlCreation();
              }, 500);
            }, 1000);
          } else {
            log('User is not first-time user, skipping prompts');
          }
        })
        .catch((error) => {
          log('Error checking first-time user status', { error });
        });
    }

    previousAuthState = currentAuthState;
  });
}
