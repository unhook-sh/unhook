import type { AuthStore } from '../services/auth.service';
import type { FirstTimeUserService } from '../services/first-time-user.service';

export function setupFirstTimeUserHandler(
  authStore: AuthStore,
  firstTimeUserService: FirstTimeUserService,
): void {
  let previousAuthState = authStore.isSignedIn;

  authStore.onDidChangeAuth(() => {
    // Check if user just signed in (transition from not signed in to signed in)
    if (!previousAuthState && authStore.isSignedIn) {
      // Check if first-time user
      firstTimeUserService.isFirstTimeUser().then((isFirstTime) => {
        if (isFirstTime) {
          // Show analytics consent prompt first, then unhook.yml prompt
          setTimeout(async () => {
            // Check if we've already asked for analytics consent
            const hasAskedForConsent =
              await firstTimeUserService.hasAskedForAnalyticsConsent();
            if (!hasAskedForConsent) {
              await firstTimeUserService.promptForAnalyticsConsent();
            }

            // Show unhook.yml prompt after a short delay
            setTimeout(() => {
              firstTimeUserService.promptForUnhookYmlCreation();
            }, 1000);
          }, 2000);
        }
      });
    }

    previousAuthState = authStore.isSignedIn;
  });
}
