import { createClerkClient } from '../clerk';
import { useAuthStore } from '../store';

/**
 * Hook to check if the user is signed in
 * @returns boolean indicating if the user is signed in
 */
export function useAuth() {
  const isAuthenticated = useAuthStore.use.isAuthenticated();
  const isLoading = useAuthStore.use.isLoading();
  const userId = useAuthStore.use.userId();
  const orgId = useAuthStore.use.orgId();
  const token = useAuthStore.use.token();
  const firstName = useAuthStore.use.firstName();
  const lastName = useAuthStore.use.lastName();
  const clearAuth = useAuthStore.use.clearAuth();

  const logout = async () => {
    const clerk = await createClerkClient();
    await clerk.signOut();
    clearAuth();
  };

  return {
    isAuthenticated,
    isLoading,
    userId,
    orgId,
    token,
    firstName,
    lastName,
    isSignedIn: isAuthenticated,
    logout,
  };
}
