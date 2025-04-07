import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createSelectors } from '../zustand-create-selectors';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  orgId: string | null;
  firstName: string | null;
  lastName: string | null;
  isLoading: boolean;
}

interface AuthActions {
  setAuth: (auth: {
    token: string;
    userId: string;
    orgId?: string | null;
    firstName?: string;
    lastName?: string;
  }) => void;
  clearAuth: () => void;
  setIsLoading: (isLoading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

const defaultInitState: AuthState = {
  isAuthenticated: false,
  token: null,
  userId: null,
  orgId: null,
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
const store = createStore<AuthStore>()(
  persist(
    (set, get) => ({
      ...defaultInitState,
      setAuth: (auth: {
        token: string;
        userId: string;
        orgId?: string | null;
        firstName?: string;
        lastName?: string;
      }) => {
        const currentState = get();
        if (
          currentState.token === auth.token &&
          currentState.userId === auth.userId &&
          currentState.orgId === auth.orgId &&
          currentState.firstName === auth.firstName &&
          currentState.lastName === auth.lastName
        ) {
          return;
        }
        set({
          isAuthenticated: true,
          token: auth.token,
          userId: auth.userId,
          orgId: auth.orgId,
          firstName: auth.firstName,
          lastName: auth.lastName,
        });
      },
      clearAuth: () => {
        const currentState = get();
        if (
          !currentState.isAuthenticated &&
          !currentState.token &&
          !currentState.userId &&
          !currentState.orgId &&
          !currentState.firstName &&
          !currentState.lastName
        ) {
          return;
        }
        set({
          isAuthenticated: false,
          token: null,
          userId: null,
          orgId: null,
          firstName: null,
          lastName: null,
        });
      },
      setIsLoading: (isLoading: boolean) => {
        const currentState = get();
        if (currentState.isLoading === isLoading) {
          return;
        }
        set({ isLoading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => fsStorage),
    },
  ),
);

export const useAuthStore = createSelectors(store);
