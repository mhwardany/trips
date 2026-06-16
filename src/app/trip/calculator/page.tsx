'use client';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, Calculator } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useTripStore } from '@/stores/tripStore';
import { Card, Field, Spinner } from '@/components/ui/Primitives';
import { CurrencyPicker } from '@/components/ui/Pickers';
import { cacheGet, cacheSet } from '@/lib/db';
import { fmt } from '@/lib/utils';

export default function CalculatorPage() {
  const t = useT();
  const trip = useTripStore((s) => s.activeTrip);
  const tripCcy = trip?.currency_code || 'KWD';
  const baseCcy = trip?.base_currency || 'EGP';
  const [amount, setAmount] = useState('1');
  const [from, setFrom] = useState(tripCcy);
  const [to, setTo] = useState(baseCcy);
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRate = useCallback(async (f: string, to_: string) => {
    if (!f || !to_ || f === to_) { setRate(1); return; }
    const key = `fx_${f}_${to_}`;
    const cached = await cacheGet<{ rate: number; date: string }>(key);
    const today = new Date().toISOString().slice(0, 10);
    if (cached && cached.date === today) { setRate(cached.rate); return; }
    setLoading(true);
    const res = await api<{ rate: number }>('fx.today', { base: f, quote: to_ });
    setLoading(false);
    if (res.ok && res.data) { setRate(res.data.rate); void cacheSet(key, { rate: res.data.rate, date: today }); }
    else if (cached) setRate(cached.rate);
  }, []);

  useEffect(() => { void fetchRate(from, to); }, [from, to, fetchRate]);

  const result = rate !== null ? (parseFloat(amount) || 0) * rate : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rise">
        <span className="icon-tile"><Calculator size={20} /></span>
        <h1 className="font-display text-[22px] gold-text">{t('calculator')}</h1>
      </div>
      <Card className="space-y-4 rise rise-1">
        <input className="input-luxe text-center font-display !text-[34px] !h-[76px]" type="number" inputMode="decimal"
          value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div className="flex items-end gap-3">
          <div className="flex-1"><Field label={t('from')}><CurrencyPicker value={from} onChange={setFrom} title={t('from')} extra={[tripCcy, baseCcy]} /></Field></div>
          <button onClick={() => { setFrom(to); setTo(from); }} className="icon-tile mb-0.5"><ArrowLeftRight size={18} /></button>
          <div className="flex-1"><Field label={t('to')}><CurrencyPicker value={to} onChange={setTo} title={t('to')} extra={[tripCcy, baseCcy]} /></Field></div>
        </div>
        <div className="text-center py-5 rounded-3xl" style={{ background: 'rgba(37, 99, 235,0.05)', border: '1px solid rgba(37, 99, 235,0.14)' }}>
          {loading ? <Spinner /> : result !== null ? (
            <>
              <p className="font-display text-[36px] leading-none gold-text">{fmt(result, 3)}</p>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-2">{to} · 1 {from} = {fmt(rate!, 5)} {to}</p>
            </>
          ) : <p className="text-xs text-zinc-500">—</p>}
        </div>
      </Card>
      <div className="grid grid-cols-3 gap-2 rise rise-2">
        {[[tripCcy, baseCcy], ['USD', baseCcy], [baseCcy, tripCcy]].map(([f, t2], i) => (
          <button key={i} onClick={() => { setFrom(f); setTo(t2); }}
            className="card-flat !rounded-2xl py-3.5 text-[12px] text-zinc-600 dark:text-zinc-300 active:scale-95 transition">{f} → {t2}</button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 rise rise-3">
        {['1', '5', '10', '50', '100', '500', '1000', '5000'].map((v) => (
          <button key={v} onClick={() => setAmount(v)}
            className="card-flat !rounded-2xl py-3 text-[12px] font-display text-zinc-500 dark:text-zinc-400 active:scale-95 transition">{v}</button>
        ))}
      </div>
    </div>
  );
}
