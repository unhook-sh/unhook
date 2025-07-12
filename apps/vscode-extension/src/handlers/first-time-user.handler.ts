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
          // Show prompt after a short delay to let the success message appear first
          setTimeout(() => {
            firstTimeUserService.promptForUnhookYmlCreation();
          }, 2000);
        }
      });
    }

    previousAuthState = authStore.isSignedIn;
  });
}
