import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { type ReactNode, createContext, useContext, useRef } from 'react';
import { createStore, useStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  isLoading: boolean;
}

interface AuthActions {
  setAuth: (auth: {
    token: string;
    userId: string;
    firstName?: string;
    lastName?: string;
  }) => void;
  clearAuth: () => void;
  setIsLoading: (isLoading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const defaultInitState: AuthState = {
  isAuthenticated: false,
  token: null,
  userId: null,
  firstName: null,
  lastName: null,
  isLoading: false,
};

// Create a custom storage that uses the file system
const fsStorage = {
  getItem: (name: string): string | null => {
    const filePath = path.join(os.homedir(), '.tunnel', `${name}.json`);
    try {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      return fs.existsSync(filePath)
        ? fs.readFileSync(filePath, 'utf-8')
        : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    const filePath = path.join(os.homedir(), '.tunnel', `${name}.json`);
    try {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, value, 'utf-8');
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  },
  removeItem: (name: string): void => {
    const filePath = path.join(os.homedir(), '.tunnel', `${name}.json`);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },
};

// Create and export the store instance
export const authStore = createStore<AuthStore>()(
  persist(
    (set) => ({
      ...defaultInitState,
      setAuth: (auth: {
        token: string;
        userId: string;
        firstName?: string;
        lastName?: string;
      }) =>
        set({
          isAuthenticated: true,
          token: auth.token,
          userId: auth.userId,
          firstName: auth.firstName,
          lastName: auth.lastName,
        }),
      clearAuth: () =>
        set({
          isAuthenticated: false,
          token: null,
          userId: null,
          firstName: null,
          lastName: null,
        }),
      setIsLoading: (isLoading: boolean) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => fsStorage),
    },
  ),
);

export const createAuthStore = (initState: AuthState = defaultInitState) => {
  return authStore;
};

export type AuthStoreApi = ReturnType<typeof createAuthStore>;

const AuthStoreContext = createContext<AuthStoreApi | undefined>(undefined);

export interface AuthStoreProviderProps {
  children: ReactNode;
}

export function AuthStoreProvider({ children }: AuthStoreProviderProps) {
  const storeRef = useRef<AuthStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createAuthStore();
  }

  return (
    <AuthStoreContext.Provider value={storeRef.current}>
      {children}
    </AuthStoreContext.Provider>
  );
}

export const useAuthStore = <T,>(selector: (store: AuthStore) => T): T => {
  const authStoreContext = useContext(AuthStoreContext);

  if (!authStoreContext) {
    throw new Error('useAuthStore must be used within AuthStoreProvider');
  }

  return useStore(authStoreContext, selector);
};
