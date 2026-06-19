'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Gauge, PieChart, Pencil, Save, TrendingUp, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useTripStore } from '@/stores/tripStore';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import type { DashboardData, ShoppingItem } from '@/types';
import { EXPENSE_CATEGORIES } from '@/types';
import { EXPENSE_ICONS } from '@/lib/icons';
import { Badge, Button, Card, Input, ProgressBar, Spinner } from '@/components/ui/Primitives';
import { fmt, isTrue } from '@/lib/utils';

export default function BudgetPage() {
  const t = useT();
  const router = useRouter();
  const trip = useTripStore((s) => s.activeTrip);
  const role = useAuthStore((s) => s.user?.role);
  const showToast = useUiStore((s) => s.showToast);
  const [data, setData] = useState<DashboardData | null>(null);
  const [env, setEnv] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!trip) return;
    try {
      const [res, sRes] = await Promise.all([
        api<DashboardData>('dashboard.get', { trip_id: trip.id }),
        api<ShoppingItem[]>('shopping.list', { trip_id: trip.id })
      ]);
      
      if (res.ok && res.data?.trip) {
        let finalData = { ...res.data };
        
        // Calculate shopping expenses to reflect true budget
        if (sRes.ok && sRes.data) {
          const sItems = Array.isArray(sRes.data) ? sRes.data : ((sRes.data as any).items || []);
          const rate = Number(trip.snapshot_rate) || 1;
          const purchasedItems = sItems.filter((i: any) => isTrue(i.purchased));
          const shoppingTotalKWD = purchasedItems.reduce((acc: number, s: any) => {
            const val = parseFloat(String(s.actual_price)) || 0;
            const qty = Number(s.qty) || 1;
            return acc + (val * qty);
          }, 0);
          
          const shoppingTotalEGP = shoppingTotalKWD * rate;
          finalData.widgets.budget_spent += shoppingTotalEGP;
          finalData.widgets.budget_remaining -= shoppingTotalEGP;
          
          if (finalData.budget_intel) {
             finalData.budget_intel.on_track = finalData.widgets.budget_spent <= finalData.widgets.budget_total;
          }
          
          // Also add shopping to spentByCat
          finalData.charts.by_category = { ...finalData.charts.by_category };
          finalData.charts.by_category['shopping'] = (finalData.charts.by_category['shopping'] || 0) + shoppingTotalEGP;
        }
        
        setData(finalData);
        const map: Record<string, string> = {};
        finalData.envelopes.forEach((e) => { map[e.category] = String(e.amount); });
        setEnv(map);
      }
    } catch (e) {}
  }, [trip]);
  useEffect(() => { void load(); }, [load]);

  const saveEnvelopes = async () => {
    setIsSaving(true);
    const envelopes = EXPENSE_CATEGORIES.map((c) => ({ category: c, amount: parseFloat(env[c] || '0') || 0 }));
    const res = await api('envelopes.set', { trip_id: trip!.id, envelopes });
    setIsSaving(false);
    if (res.ok) { showToast(t('save') + ' ✓'); setEditing(false); void load(); }
  };

  if (!data) return <Spinner />;
  const { widgets: w, budget_intel: bi, envelopes } = data;
  const spentByCat = data.charts.by_category;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rise">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 shrink-0">
          <ChevronLeft size={18} />
        </button>
        <span className="icon-tile"><PieChart size={20} /></span>
        <h1 className="font-display text-[22px] gold-text">{t('budget')}</h1>
      </div>
      <div className="grid grid-cols-3 gap-2.5 rise rise-1">
        {[
          { Icon: Gauge, label: t('daily_limit'), value: fmt(bi.daily_limit) },
          { Icon: Flame, label: t('burn_rate'), value: fmt(bi.burn_rate) },
          { Icon: TrendingUp, label: t('forecast'), value: fmt(bi.forecast_total) }
        ].map(({ Icon, label, value }, i) => (
          <Card key={i} flat className="text-center !px-2 !py-4">
            <Icon size={16} className="mx-auto text-royal-goldsoft mb-2" />
            <p className="font-display text-[16px] text-foreground">{value}</p>
            <p className="text-[9.5px] text-zinc-500 mt-1 leading-tight">{label}</p>
          </Card>
        ))}
      </div>
      <Card className="rise rise-2">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{fmt(w.budget_spent)} / {fmt(w.budget_total)} {trip?.base_currency || 'EGP'}</p>
          <Badge color={bi.on_track ? 'green' : 'red'}>{bi.on_track ? t('on_track') : t('over_budget')}</Badge>
        </div>
        <ProgressBar value={w.budget_spent} max={w.budget_total || 1} color={bi.on_track ? '#2563EB' : '#EF4444'} />
      </Card>
      <div className="flex items-center justify-between rise rise-3">
        <h2 className="text-[14px] text-foreground">Budget Envelopes</h2>
        {role !== 'family' && (
          <button onClick={() => (editing ? saveEnvelopes() : setEditing(true))}
            className="chip chip-on !h-9">{editing ? <Save size={13} /> : <Pencil size={13} />}{editing ? t('save') : t('edit')}</button>
        )}
      </div>
      <div className="space-y-2.5">
        {EXPENSE_CATEGORIES.map((c) => {
          const envelope = envelopes.find((e) => e.category === c);
          const amount = envelope?.amount || 0;
          const spent = spentByCat[c] || 0;
          const over = amount > 0 && spent > amount;
          return (
            <Card key={c} flat className="!p-3.5">
              <div className="flex items-center gap-3 mb-2">
                {EXPENSE_ICONS[c]}
                <span className="text-[13px] text-foreground capitalize flex-1">{c}</span>
                {editing ? (
                  <Input type="number" inputMode="decimal" value={env[c] || ''} onChange={(v) => setEnv({ ...env, [c]: v })} className="!w-28 !h-10 text-end" />
                ) : (
                  <span className={`text-[12px] ${over ? 'text-red-400' : 'text-zinc-500'}`}>{fmt(spent)} / {fmt(amount)}</span>
                )}
              </div>
              {!editing && amount > 0 && <ProgressBar value={spent} max={amount} color={over ? '#EF4444' : '#2563EB'} />}
            </Card>
          );
        })}
      </div>
      {editing && <Button onClick={saveEnvelopes} isLoading={isSaving} className="w-full"><Save size={17} />{t('save')}</Button>}
    </div>
  );
}
