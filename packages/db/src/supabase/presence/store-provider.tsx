'use client';

import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { useStore } from 'zustand';

import type { PresenceStore } from './store';
import { createPresenceStore } from './store';

export type PresenceStoreApi = ReturnType<typeof createPresenceStore>;

export const PresenceStoreContext = createContext<PresenceStoreApi | undefined>(
  undefined,
);

export interface PresenceStoreProviderProps {
  onlineUsers?: Set<string>;
}

export const PresenceStoreProvider = ({
  children,
  onlineUsers,
}: PropsWithChildren<PresenceStoreProviderProps>) => {
  const storeRef = useMemo<PresenceStoreApi>(() => {
    return createPresenceStore({ onlineUsers: onlineUsers ?? new Set() });
  }, [onlineUsers]);

  useEffect(() => {
    if (storeRef.getState().onlineUsers === onlineUsers) {
      return;
    }

    storeRef.setState({ onlineUsers });
  }, [onlineUsers, storeRef]);

  return (
    <PresenceStoreContext.Provider value={storeRef}>
      {children}
    </PresenceStoreContext.Provider>
  );
};

export const usePresenceStore = <T,>(
  selector: (store: PresenceStore) => T,
): T => {
  const presenceStoreContext = useContext(PresenceStoreContext);

  if (!presenceStoreContext) {
    throw new Error(
      'usePresenceStore must be used within PresenceStoreProvider',
    );
  }

  return useStore(presenceStoreContext, selector);
};
