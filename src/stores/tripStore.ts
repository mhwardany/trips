'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trip } from '@/types';

interface TripState {
  activeTrip: Trip | null;
  setActiveTrip: (trip: Trip | null) => void;
}

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      activeTrip: null,
      setActiveTrip: (trip) => set({ activeTrip: trip })
    }),
    { name: 'wt_trip' }
  )
);
