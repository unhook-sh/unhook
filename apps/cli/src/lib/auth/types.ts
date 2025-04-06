// Type definitions for better TypeScript support
export interface Session {
  user: {
    id: string | null;
  };
  token: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  token: string | null;
  status: 'authenticated' | 'unauthenticated';
  session: Session | null;
}
