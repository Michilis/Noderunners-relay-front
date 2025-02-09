import { create } from 'zustand';
import { NostrUser } from '../types';

interface Store {
  user: NostrUser | null;
  setUser: (user: NostrUser | null) => void;
}

export const useStore = create<Store>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));