'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PlaneTakeoff, PlaneLanding, Boxes, Gift, Wallet, Sparkles, ChevronRight, PackageSearch, CalendarRange, PieChart, ScanLine, ListChecks, Luggage, Calculator } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useTripStore } from '@/stores/tripStore';
import type { DashboardData } from '@/types';
import { Card, ProgressBar, Badge } from '@/components/ui/Primitives';
import { SECTION_ICONS } from '@/lib/icons';
import { JoyIcon, type JoyColor } from '@/components/ui/JoyIcon';
import DestinationImage from '@/components/shared/DestinationImage';
import { COUNTRIES } from '@/lib/catalog';
import { cacheGet, cacheSet } from '@/lib/db';
import { fmt } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

interface Tip { type: string; severity: string; text: string }

const QUICK = ['client-orders', 'planner', 'budget', 'scanner', 'checklist', 'gifts', 'packing', 'requests', 'calculator'];

export default function DashboardPage() {
  const t = useT();
  const trip = useTripStore((s) => s.activeTrip);
  const role = useAuthStore((s) => s.user?.role);
  const [data, setData] = useState<DashboardData | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!trip) return;
    const cached = await cacheGet<DashboardData>('dash_' + trip.id);
    if (cached) { setData(cached); setLoading(false); }
    const res = await api<DashboardData>('dashboard.get', { trip_id: trip.id });
    if (res.ok && res.data?.trip) { setData(res.data); void cacheSet('dash_' + trip.id, res.data); }
    setLoading(false);
    const tipsRes = await api<{ tips: Tip[] }>('assistant.recommend', { trip_id: trip.id });
    if (tipsRes.ok && tipsRes.data) setTips(tipsRes.data.tips || []);
  }, [trip]);
  useEffect(() => { void load(); }, [load]);

  if (loading && !data) return (
    <div className="space-y-4 pt-1">
      <div className="skeleton h-48 w-full" />
      <div className="skeleton h-32 w-full" />
      <div className="grid grid-cols-2 gap-3">
        {[0,1,2,3].map((i) => <div key={i} className="skeleton h-20" />)}
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {[0,1,2,3,4,5,6,7].map((i) => <div key={i} className="skeleton h-20" />)}
      </div>
    </div>
  );
  if (!data?.trip) return null;
  const w = data.widgets;
  const dt = data.trip as { name?: string; country?: string; city?: string };
  const dtFlag = COUNTRIES.find((c) => c.name === dt.country)?.flag || '✈️';

  return (
    <div className="space-y-4 pt-1">
      {/* Destination hero */}
      <div className="relative rise scale-in">
        <DestinationImage country={dt.country} city={dt.city} seed={dt.name || 'trip'}
          flag={dtFlag} eager className="h-48 w-full" />
        <div className="absolute bottom-0 inset-x-0 p-5 z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl leading-none">{dtFlag}</span>
            <span className="text-[12px] text-zinc-200/90">{dt.city ? `${dt.city}, ` : ''}{dt.country}</span>
          </div>
          <h1 className="font-display text-[26px] text-white drop-shadow leading-tight">{dt.name}</h1>
        </div>
      </div>

      {/* Family Quick Add Request */}
      {role === 'family' && (
        <div className="rise rise-2">
          <Link href="/trip/requests/" className="block w-full bg-gradient-to-r from-resort-sunset to-orange-400 text-white font-bold text-[16px] text-center rounded-2xl py-5 active:scale-95 transition-transform flex items-center justify-center gap-3 shadow-[0_4px_24px_rgba(249,115,22,0.35)]">
            <Boxes size={22} />
            Add New Request
          </Link>
        </div>
      )}

      {/* Hero: budget remaining */}
      {role !== 'family' && (
        <Card onClick={() => router.push('/trip/budget/')} className="rise rise-1 text-center !py-6 cursor-pointer hover:border-royal-gold/30 transition active:scale-[0.98]">
          <p className="text-[11px] text-zinc-500 mb-1 flex items-center justify-center gap-1.5"><Wallet size={12} />{t('budget_remaining')}</p>
          <p className="font-display text-[42px] leading-none gold-text">{fmt(w.budget_remaining)}</p>
          <p className="text-[11px] text-zinc-600 mt-1">{trip?.base_currency || 'EGP'}</p>
          <div className="mt-4">
            <ProgressBar value={w.budget_spent} max={w.budget_total || 1} color={data.budget_intel.on_track ? '#2563EB' : '#EF4444'} />
            <div className="flex justify-between text-[11px] text-zinc-500 mt-2">
              <span>{fmt(w.budget_spent)} {t('budget_spent')}</span>
              <Badge color={data.budget_intel.on_track ? 'green' : 'red'}>
                {data.budget_intel.on_track ? t('on_track') : t('over_budget')}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Countdown + counters */}
      <div className="grid grid-cols-2 gap-3 rise rise-1">
        {[
          { Icon: PlaneTakeoff, label: t('days_to_departure'), value: w.days_to_departure, color: 'ocean' as JoyColor },
          { Icon: PlaneLanding, label: t('days_to_return'), value: w.days_to_return, color: 'sunset' as JoyColor },
          { Icon: Boxes, label: t('open_requests'), value: w.open_requests, color: 'amethyst' as JoyColor, href: '/trip/requests/' },
          ...(role !== 'family' ? [{ Icon: Gift, label: t('gifts_purchased'), value: `${w.gifts_purchased}/${w.gifts_total}`, color: 'coral' as JoyColor, href: '/trip/gifts/' }] : [])
        ].map(({ Icon, label, value, color, href }, i) => {
          const content = (
            <Card flat className="flex items-center gap-3 !p-3 h-full">
              <JoyIcon icon={Icon} color={color} size="md" />
              <span>
                <span className="block font-display text-[22px] leading-none text-gray-800 dark:text-gray-100">{value}</span>
                <span className="block text-[10px] text-zinc-500 mt-1">{label}</span>
              </span>
            </Card>
          );
          return href ? <Link key={i} href={href} className="block">{content}</Link> : <div key={i}>{content}</div>;
        })}
      </div>

      {/* progress strips */}
      {role !== 'family' && (
        <div className="grid grid-cols-2 gap-3 rise rise-2">
          {[
            { label: t('shopping_progress'), done: w.shopping_done, total: w.shopping_total, href: '/trip/shopping/' },
            { label: t('packing_progress'), done: w.packing_done, total: w.packing_total, href: '/trip/packing/' }
          ].map((p, i) => (
            <Link key={i} href={p.href}>
              <Card flat className="!p-3.5">
                <p className="text-[10px] text-zinc-500 mb-2">{p.label}</p>
                <ProgressBar value={p.done} max={p.total || 1} />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">{p.done}/{p.total}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Assistant */}
      {tips.length > 0 && (
        <Card className="rise rise-3">
          <p className="text-[12px] gold-text font-semibold mb-3 flex items-center gap-1.5"><Sparkles size={14} />{t('assistant')}</p>
          <div className="space-y-2.5">
            {tips.slice(0, 4).map((tip, i) => (
              <div key={i} className="flex gap-2.5 text-[12.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: tip.severity === 'high' ? '#EF4444' : tip.severity === 'medium' ? '#F59E0B' : '#10B981' }} />
                {tip.text}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <div className="rise rise-4">
        <p className="text-[12px] text-zinc-500 mb-3 ps-1">{t('quick_actions')}</p>
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK.filter(k => role !== 'family' || ['requests', 'packing'].includes(k)).map((key) => {
            const iconsMap: any = { 'client-orders': 'emerald', planner: 'ocean', budget: 'emerald', scanner: 'amethyst', checklist: 'coral', gifts: 'peach', packing: 'sunset', requests: 'amethyst', calculator: 'ocean' };
            const IconComp = [
              {k: 'client-orders', i: PackageSearch},
              {k: 'planner', i: CalendarRange},
              {k: 'budget', i: PieChart},
              {k: 'scanner', i: ScanLine},
              {k: 'checklist', i: ListChecks},
              {k: 'gifts', i: Gift},
              {k: 'packing', i: Luggage},
              {k: 'requests', i: Boxes},
              {k: 'calculator', i: Calculator}
            ].find(x => x.k === key)?.i || Sparkles;

            return (
              <Link key={key} href={`/trip/${key === 'contacts' ? 'contacts' : key}/`}
                className="card-flat !bg-white/40 dark:!bg-black/20 !border-white/40 !rounded-3xl py-3 px-1 flex flex-col items-center active:scale-95 transition shadow-sm">
                <JoyIcon icon={IconComp} color={iconsMap[key] || 'gold'} size="sm" className="mb-2" />
                <span className="block text-[9.5px] font-medium text-zinc-600 dark:text-zinc-400 truncate px-1 w-full text-center">{t(key)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {role !== 'family' && (
        <Link href="/trip/analytics/" className="block rise rise-4 mb-4">
          <Card flat className="flex items-center gap-3 !p-3">
            <JoyIcon icon={require('lucide-react').PieChart} color="emerald" size="md" />
            <span className="flex-1 text-[14px] font-medium text-gray-800 dark:text-gray-200">{t('analytics')}</span>
            <ChevronRight size={17} className="text-zinc-500 dark:text-zinc-400 rtl:rotate-180" />
          </Card>
        </Link>
      )}
    </div>
  );
}
