'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronRight, Crown } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useT } from '@/lib/i18n';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Primitives';
import { SECTION_ICONS } from '@/lib/icons';

const SECTIONS: { key: string; href: string; roles?: string[] }[] = [
  { key: 'trips', href: '/trips/' },
  { key: 'planner', href: '/trip/planner/' },
  { key: 'checklist', href: '/trip/checklist/' },
  { key: 'gifts', href: '/trip/gifts/' },
  { key: 'packing', href: '/trip/packing/' },
  { key: 'journal', href: '/trip/journal/' },
  { key: 'places', href: '/trip/places/' },
  { key: 'restaurants', href: '/trip/restaurants/' },
  { key: 'malls', href: '/trip/malls/' },
  { key: 'requests', href: '/trip/requests/' },
  { key: 'shopping', href: '/trip/shopping/', roles: ['owner', 'manager'] },
  { key: 'expenses', href: '/trip/expenses/', roles: ['owner', 'manager'] },
  { key: 'contacts', href: '/trip/contacts/' },
  { key: 'notes', href: '/trip/notes/' },
  { key: 'documents', href: '/trip/documents/' },
  { key: 'calculator', href: '/trip/calculator/' },
  { key: 'budget', href: '/trip/budget/' },
  { key: 'analytics', href: '/trip/analytics/' },
  { key: 'reports', href: '/trip/reports/', roles: ['owner', 'manager'] },
  { key: 'scanner', href: '/trip/scanner/' },
  { key: 'users', href: '/admin/users/', roles: ['owner'] },
  { key: 'settings', href: '/settings/' }
];

export default function MenuPage() {
  const t = useT();
  const router = useRouter();
  const { user, token, clear } = useAuthStore();

  const logout = async () => { await api('auth.logout', { token }); clear(); router.replace('/'); };
  const initials = (user?.display_name || 'U').slice(0, 1).toUpperCase();

  return (
    <AppShell>
      <div className="space-y-4 pt-1">
        <Card className="flex items-center gap-3.5 rise">
          {initials}
          <div className="flex-1 min-w-0">
            <p className="font-display text-[17px] gold-text truncate">{user?.display_name}</p>
            <p className="text-[11px] text-zinc-500 capitalize flex items-center gap-1">
              {user?.role === 'owner' && <Crown size={11} className="text-royal-gold" />}{t('role')}: {user?.role}
            </p>
          </div>
          <button onClick={logout} className="icon-tile !text-red-400 !border-red-500/25"><LogOut size={17} /></button>
        </Card>

        <div className="grid grid-cols-3 gap-2.5 rise rise-1">
          {SECTIONS.filter((s) => !s.roles || s.roles.includes(user?.role || '')).map((s) => (
            <Link key={s.key} href={s.href} className="card-flat !rounded-3xl py-4 px-2 text-center active:scale-95 transition">
              {SECTION_ICONS[s.key]}
              <span className="block text-[10px] text-zinc-500 mt-2 leading-tight truncate px-0.5">{t(s.key)}</span>
            </Link>
          ))}
        </div>

        <p className="text-center text-[10px] text-zinc-700 pt-2">WARDANY TRIP ENTERPRISE · v2.0.0</p>
      </div>
    </AppShell>
  );
}
