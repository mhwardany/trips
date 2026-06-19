'use client';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useT } from '@/lib/i18n';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Primitives';
import { SECTION_ICONS } from '@/lib/icons';

const SECTIONS: Record<string, { href: string; roles?: string[] }> = {
  budget: { href: '/trip/budget/' },
  expenses: { href: '/trip/expenses/', roles: ['owner', 'manager'] },
  shopping: { href: '/trip/shopping/', roles: ['owner', 'manager'] },
  scanner: { href: '/trip/scanner/' },
  calculator: { href: '/trip/calculator/' },
};

export default function FinancesPage() {
  const t = useT();
  const { user } = useAuthStore();

  return (
    <AppShell>
      <div className="space-y-4 pt-1 pb-10">
        <div className="flex items-center gap-3 rise">
          <span className="icon-tile">{SECTION_ICONS['budget']}</span>
          <h1 className="font-display text-[22px] gold-text">{t('finances') || 'Finances'}</h1>
        </div>

        <div className="space-y-5 rise rise-1">
          <Card className="p-0 overflow-hidden">
            {Object.keys(SECTIONS).filter(k => !SECTIONS[k].roles || SECTIONS[k].roles?.includes(user?.role || '')).map((k, i) => (
              <Link key={k} href={SECTIONS[k].href} className="flex items-center gap-3 p-3.5 border-b border-zinc-800/40 last:border-0 active:bg-zinc-800/50 transition">
                {SECTION_ICONS[k]}
                <span className="flex-1 text-[14px] text-zinc-200 font-medium">{t(k) || k}</span>
                <ChevronRight size={18} className="text-zinc-600" />
              </Link>
            ))}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
