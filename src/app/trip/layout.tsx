'use client';
import AppShell from '@/components/layout/AppShell';

export default function TripLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
