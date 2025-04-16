import { create } from 'zustand';

export interface RunnerIdentity {
  id: string;
  name: string;
  faction: string;
  description: string;
}

interface IdentityState {
  selectedIdentity: RunnerIdentity | null;
  setIdentity: (identity: RunnerIdentity) => void;
  clearIdentity: () => void;
}

export const useIdentity = create<IdentityState>((set) => ({
  selectedIdentity: null,
  setIdentity: (identity) => set({ selectedIdentity: identity }),
  clearIdentity: () => set({ selectedIdentity: null }),
}));
