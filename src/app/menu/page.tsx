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

const SECTIONS: Record<string, { href: string; roles?: string[] }> = {
  trips: { href: '/trips/' },
  planner: { href: '/trip/planner/' },
  checklist: { href: '/trip/checklist/' },
  gifts: { href: '/trip/gifts/' },
  packing: { href: '/trip/packing/' },
  journal: { href: '/trip/journal/' },
  places: { href: '/trip/places/' },
  restaurants: { href: '/trip/restaurants/' },
  malls: { href: '/trip/malls/' },
  requests: { href: '/trip/requests/' },
  shopping: { href: '/trip/shopping/', roles: ['owner', 'manager'] },
  expenses: { href: '/trip/expenses/', roles: ['owner', 'manager'] },
  contacts: { href: '/trip/contacts/' },
  notes: { href: '/trip/notes/' },
  documents: { href: '/trip/documents/' },
  calculator: { href: '/trip/calculator/' },
  budget: { href: '/trip/budget/' },
  analytics: { href: '/trip/analytics/' },
  reports: { href: '/trip/reports/', roles: ['owner', 'manager'] },
  scanner: { href: '/trip/scanner/' },
  users: { href: '/admin/users/', roles: ['owner'] },
  settings: { href: '/settings/' }
};

const MENU_GROUPS = [
  { title: 'management', items: ['trips', 'planner', 'checklist', 'packing', 'users'] },
  { title: 'finances', items: ['budget', 'expenses', 'shopping', 'scanner', 'calculator'] },
  { title: 'activities', items: ['places', 'restaurants', 'malls', 'journal'] },
  { title: 'tools', items: ['documents', 'contacts', 'notes', 'requests', 'gifts', 'reports', 'analytics', 'settings'] }
];

export default function MenuPage() {
  const t = useT();
  const router = useRouter();
  const { user, token, clear } = useAuthStore();

  const logout = async () => { await api('auth.logout', { token }); clear(); router.replace('/'); };
  const initials = (user?.display_name || 'U').slice(0, 1).toUpperCase();

  return (
    <AppShell>
      <div className="space-y-4 pt-1 pb-10">
        <Card className="flex items-center gap-3.5 rise">
          <div className="w-12 h-12 flex items-center justify-center rounded-[14px] bg-zinc-800 text-royal-gold font-display text-xl">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-[17px] gold-text truncate">{user?.display_name}</p>
            <p className="text-[11px] text-zinc-500 capitalize flex items-center gap-1">
              {user?.role === 'owner' && <Crown size={11} className="text-royal-gold" />}{t('role') || 'Role'}: {user?.role}
            </p>
          </div>
          <button onClick={logout} className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 active:scale-95 transition">
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </Card>

        <div className="space-y-5 rise rise-1">
          {MENU_GROUPS.map((group, gIdx) => {
            const items = group.items.filter(k => !SECTIONS[k].roles || SECTIONS[k].roles?.includes(user?.role || ''));
            if (items.length === 0) return null;
            return (
              <div key={gIdx} className="space-y-2">
                <h3 className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider px-2">{t(group.title) || group.title}</h3>
                <Card className="p-0 overflow-hidden">
                  {items.map((k, i) => (
                    <Link key={k} href={SECTIONS[k].href} className="flex items-center gap-3 p-3.5 border-b border-zinc-800/40 last:border-0 active:bg-zinc-800/50 transition">
                      {SECTION_ICONS[k]}
                      <span className="flex-1 text-[14px] text-zinc-200 font-medium">{t(k) || k}</span>
                      <ChevronRight size={18} className="text-zinc-600" />
                    </Link>
                  ))}
                </Card>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[10px] text-zinc-700 pt-4">WARDANY TRIP ENTERPRISE · v2.0.0</p>
      </div>
    </AppShell>
  );
}
