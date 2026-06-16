'use client';
import { create } from 'zustand';

interface SyncState {
  pending: number;
  syncing: boolean;
  online: boolean;
  setSyncing: (v: boolean) => void;
  setOnline: (v: boolean) => void;
  refreshCount: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  pending: 0,
  syncing: false,
  online: true,
  setSyncing: (syncing) => set({ syncing }),
  setOnline: (online) => set({ online }),
  refreshCount: () => {
    void import('@/lib/offlineQueue').then(async (m) => set({ pending: await m.pendingCount() }));
  }
}));
