import { createClerkClient } from '../lib/auth/clerk';
import { useAuthStore } from '../stores/auth-store';

/**
 * Hook to check if the user is signed in
 * @returns boolean indicating if the user is signed in
 */
export function useAuth() {
  const isAuthenticated = useAuthStore.use.isAuthenticated();
  const isLoading = useAuthStore.use.isLoading();
  const user = useAuthStore.use.user();
  const orgId = useAuthStore.use.orgId();
  const token = useAuthStore.use.token();
  const clearAuth = useAuthStore.use.clearAuth();

  const logout = async () => {
    const clerk = await createClerkClient();
    await clerk.signOut();
    clearAuth();
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    orgId,
    token,
    isSignedIn: isAuthenticated,
    logout,
  };
}
