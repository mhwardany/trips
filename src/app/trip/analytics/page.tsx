'use client';
import { useCallback, useEffect, useState } from 'react';
import { PieChart as PieIcon, TrendingUp, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useTripStore } from '@/stores/tripStore';
import type { DashboardData, ShoppingItem } from '@/types';
import { Card, Spinner } from '@/components/ui/Primitives';
import { BarChart, LineChart, PieChart } from '@/components/charts/SvgCharts';
import { fmt, isTrue } from '@/lib/utils';

export default function AnalyticsPage() {
  const t = useT();
  const trip = useTripStore((s) => s.activeTrip);
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    if (!trip) return;
    try {
      const [res, sRes] = await Promise.all([
        api<DashboardData>('dashboard.get', { trip_id: trip.id }),
        api<ShoppingItem[]>('shopping.list', { trip_id: trip.id })
      ]);
      
      if (res.ok && res.data?.trip) {
        let finalData = { ...res.data };
        
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
          
          finalData.charts.by_category = { ...finalData.charts.by_category };
          finalData.charts.by_category['shopping'] = (finalData.charts.by_category['shopping'] || 0) + shoppingTotalEGP;
          
          const envIndex = finalData.envelopes.findIndex(e => e.category === 'shopping');
          if (envIndex >= 0) {
            finalData.envelopes[envIndex].spent = (finalData.envelopes[envIndex].spent || 0) + shoppingTotalEGP;
          }
        }
        
        setData(finalData);
      }
    } catch (e) {}
  }, [trip]);
  useEffect(() => { void load(); }, [load]);

  if (!data) return <Spinner />;
  const byCat = Object.entries(data.charts.by_category).filter(([, v]) => v > 0).map(([label, value]) => ({ label, value }));
  const byDay = Object.entries(data.charts.by_day).sort(([a], [b]) => (a > b ? 1 : -1)).map(([label, value]) => ({ label: label.slice(5), value }));
  const envData = data.envelopes.filter((e) => e.amount > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rise">
        <span className="icon-tile"><PieIcon size={20} /></span>
        <h1 className="font-display text-[22px] gold-text">{t('analytics')}</h1>
      </div>
      <Card className="rise rise-1">
        <p className="text-[12px] gold-text font-semibold mb-4 flex items-center gap-1.5"><PieIcon size={13} />By Category ({trip?.base_currency || 'EGP'})</p>
        {byCat.length ? <PieChart data={byCat} /> : <p className="text-xs text-zinc-500">{t('no_data')}</p>}
      </Card>
      <Card className="rise rise-2">
        <p className="text-[12px] gold-text font-semibold mb-4 flex items-center gap-1.5"><TrendingUp size={13} />Daily Trend</p>
        {byDay.length ? <LineChart data={byDay} /> : <p className="text-xs text-zinc-500">{t('no_data')}</p>}
      </Card>
      <Card className="rise rise-3">
        <p className="text-[12px] gold-text font-semibold mb-4">Envelopes: Planned vs Spent</p>
        {envData.length ? (
          <div className="space-y-3.5">
            {envData.map((e) => (
              <div key={e.category}>
                <div className="flex justify-between text-[11px] text-zinc-500 mb-1.5">
                  <span className="capitalize">{e.category}</span>
                  <span>{fmt(e.spent)} / {fmt(e.amount)}</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                  <div style={{ width: Math.min(100, (e.spent / e.amount) * 100) + '%', background: e.spent > e.amount ? '#EF4444' : 'linear-gradient(90deg,#2563EBAA,#2563EB)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-zinc-500">{t('no_data')}</p>}
      </Card>
      <Card className="rise rise-4">
        <p className="text-[12px] gold-text font-semibold mb-4 flex items-center gap-1.5"><BarChart3 size={13} />Last 14 Days</p>
        {byDay.length ? <BarChart data={byDay.slice(-14)} /> : <p className="text-xs text-zinc-500">{t('no_data')}</p>}
      </Card>
    </div>
  );
}
