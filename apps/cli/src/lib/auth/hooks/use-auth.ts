import { createClerkClient } from '../clerk';
import { useAuthStore } from '../store';

/**
 * Hook to check if the user is signed in
 * @returns boolean indicating if the user is signed in
 */
export function useAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const userId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token);
  const firstName = useAuthStore((state) => state.firstName);
  const lastName = useAuthStore((state) => state.lastName);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const logout = async () => {
    const clerk = await createClerkClient();
    await clerk.signOut();
    clearAuth();
  };

  return {
    isAuthenticated,
    isLoading,
    userId,
    token,
    firstName,
    lastName,
    isSignedIn: isAuthenticated,
    logout,
  };
}
