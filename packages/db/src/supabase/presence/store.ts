import { createStore } from 'zustand/vanilla';

export interface PresenceState {
  onlineUsers?: Set<string>;
}

export interface PresenceActions {
  setOnlineUsers: (onlineUsers: Set<string>) => void;
}

export type PresenceStore = PresenceState & PresenceActions;

export const defaultInitState: PresenceState = {
  onlineUsers: new Set(),
};

export const createPresenceStore = (
  initState: PresenceState = defaultInitState,
) => {
  return createStore<PresenceStore>()((set) => ({
    ...initState,
    setOnlineUsers: (onlineUsers: Set<string>) =>
      set(() => ({
        onlineUsers,
      })),
  }));
};
