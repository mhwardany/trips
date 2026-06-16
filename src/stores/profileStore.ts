'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '@/types';

interface ProfileState {
  activeProfile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  clear: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      activeProfile: null,
      setProfile: (profile) => set({ activeProfile: profile }),
      clear: () => set({ activeProfile: null })
    }),
    { name: 'wt_profile' }
  )
);
