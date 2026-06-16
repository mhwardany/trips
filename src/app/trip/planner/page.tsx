'use client';
import { useCallback, useEffect, useState } from 'react';
import { Calendar, CalendarRange, Hotel, NotebookPen, Pencil, Plane, Save, Wallet, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useT, useIsRtl } from '@/lib/i18n';
import { useTripStore } from '@/stores/tripStore';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import type { Trip } from '@/types';
import { Button, Card, Field, Input, Modal, Spinner, TextArea, EmptyState, ListSkeleton } from '@/components/ui/Primitives';
import { CountryPicker, ListPicker } from '@/components/ui/Pickers';
import { AIRLINES, COUNTRIES } from '@/lib/catalog';
import { formatDateLocal } from '@/lib/utils';
import WeatherCard from '@/components/shared/WeatherCard';
import FlightTrackerCard from '@/components/shared/FlightTrackerCard';
interface TimelineEvent { date: string; type: string; title: string; detail: string }
const EVENT_ICON: Record<string, React.ReactNode> = {
  flight: <Plane size={13} />, hotel: <Hotel size={13} />, journal: <NotebookPen size={13} />
};

export default function PlannerPage() {
  const t = useT();
  const isRtl = useIsRtl();
  const { activeTrip: trip, setActiveTrip } = useTripStore();
  const role = useAuthStore((s) => s.user?.role);
  const showToast = useUiStore((s) => s.showToast);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (trip && (!trip.snapshot_rate || trip.snapshot_rate <= 1)) {
      (async () => {
        try {
          const rateRes = await api<{rate: number}>('fx.today', { base: trip.currency_code, quote: trip.base_currency || 'EGP' });
          if (rateRes.ok && rateRes.data && rateRes.data.rate > 1) {
            await api('trips.update', { id: trip.id, snapshot_rate: rateRes.data.rate });
            setActiveTrip({ ...trip, snapshot_rate: rateRes.data.rate });
          }
        } catch (e) {}
      })();
    }
  }, [trip?.id, trip?.snapshot_rate]);

  const load = useCallback(async () => {
    if (!trip) return;
    setLoading(true);
    const res = await api<TimelineEvent[]>('trips.timeline', { id: trip.id });
    if (res.ok && Array.isArray(res.data)) setEvents(res.data);
    setLoading(false);
  }, [trip]);
  useEffect(() => { void load(); }, [load]);

  const openEdit = () => {
    if (!trip) return;
    setForm({
      name: trip.name, country: trip.country, city: trip.city, hotel: trip.hotel,
      airline: trip.airline, flight_no: trip.flight_no, airport: trip.airport,
      depart_date: trip.depart_date, return_date: trip.return_date,
      budget_total: String(trip.budget_total), notes: trip.notes, address: trip.address,
      currency_code: trip.currency_code,
      origin_country: trip.origin_country || 'Egypt',
      base_currency: trip.base_currency || 'EGP',
      is_round_trip: trip.is_round_trip !== undefined ? String(trip.is_round_trip) : 'true'
    });
    setModal(true);
  };

  const save = async () => {
    setIsSaving(true);
    let finalForm: any = { ...form, budget_total: parseFloat(form.budget_total as string) || 0 };
    if (finalForm.is_round_trip === 'true') finalForm.is_round_trip = true;
    if (finalForm.is_round_trip === 'false') finalForm.is_round_trip = false;
    
    // If currency changed, fetch new rate
    const baseCurr = finalForm.base_currency || trip?.base_currency || 'EGP';
    const needsRateRefresh = !trip?.snapshot_rate || trip.snapshot_rate <= 1 || form.currency_code !== trip.currency_code || form.base_currency !== trip.base_currency;
    if (trip && needsRateRefresh) {
      try {
        const rateRes = await api<{ rate: number }>('fx.today', { base: form.currency_code, quote: baseCurr });
        if (rateRes.ok && rateRes.data) {
          finalForm.snapshot_rate = rateRes.data.rate;
        }
      } catch (e) {
        console.warn('Failed to fetch new rate', e);
      }
    }

    const res = await api<Trip>('trips.update', { id: trip!.id, ...finalForm });
    setIsSaving(false);
    if (res.ok && res.data) {
      showToast(t('save') + ' ✓');
      setModal(false);
      setActiveTrip(res.data);
      void load();
    } else {
      showToast(res.error?.message || 'Error', 'error');
    }
  };

  if (!trip) return null;
  const flag = COUNTRIES.find((c) => c.name === trip.country)?.flag || '✈️';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rise">
        <span className="icon-tile"><CalendarRange size={20} /></span>
        <h1 className="font-display text-[22px] gold-text flex-1">{t('planner')}</h1>
        {role !== 'family' && <button onClick={openEdit} className="icon-tile"><Pencil size={16} /></button>}
      </div>
      <Card className="rise rise-1">
        <div className="flex items-center gap-3.5 mb-4">
          {flag}
          <div>
            <h3 className="font-display text-[18px] text-foreground">{trip.name}</h3>
            <p className="text-[11px] text-zinc-500 flex items-center gap-1">
              {trip.origin_country} <Plane size={10} className="rotate-90 text-royal-gold" /> {trip.city ? `${trip.city}, ` : ''}{trip.country}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-[12px]">
          {[
            [t('departure'), formatDateLocal(trip.depart_date)],
            trip.is_round_trip !== false ? [t('return'), formatDateLocal(trip.return_date)] : [isRtl ? 'نوع الرحلة' : 'Route', isRtl ? 'ذهاب فقط' : 'One Way'],
            [t('airline'), trip.airline || '—'], [t('flight_no'), trip.flight_no || '—'],
            [t('hotel'), trip.hotel || '—'], [t('currency'), `${trip.currency_code} = ${Number(trip.snapshot_rate).toFixed(2)} ${trip.base_currency || 'EGP'}`]
          ].map(([k, v], i) => (
            <div key={i} className="card-flat !rounded-2xl p-3">
              <p className="text-zinc-600 text-[10px]">{k}</p>
              <div className="font-medium text-foreground mt-1 text-[13px] break-words">
                {k === t('currency') ? (
                  <div className="flex items-center gap-2">
                    <span>{v}</span>
                    <button onClick={async () => {
                      showToast('Refreshing rate...');
                      const rateRes = await api<{rate: number}>('fx.today', { base: trip.currency_code, quote: trip.base_currency || 'EGP' });
                      if (rateRes.ok && rateRes.data) {
                        const newRate = rateRes.data.rate;
                        await api('trips.update', { id: trip.id, snapshot_rate: newRate });
                        setActiveTrip({ ...trip, snapshot_rate: newRate });
                        showToast(`Rate updated: ${newRate} ✓`);
                      } else {
                        showToast(rateRes.error?.message || 'Failed to refresh rate', 'error');
                      }
                    }} className="p-1 rounded bg-black/20 hover:bg-black/40 text-royal-gold transition">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                    </button>
                  </div>
                ) : v}
              </div>
            </div>
          ))}
        </div>
      </Card>
      {loading ? <ListSkeleton /> : events.length === 0 ? <EmptyState imageSrc="/illustrations/empty-planner.svg" label="No timeline events yet" /> : (
        <>
          <div className="mt-8 flex items-center justify-between">
          <h3 className="font-bold text-foreground">Timeline</h3>
        </div>
        <div className="mt-4 relative pl-4 border-l-2 border-white/10 space-y-6">
          {events.map((e, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-royal-gold ring-4 ring-background" />
              <div className="absolute -left-[30px] top-0 p-1 bg-background rounded-full">
                {e.type === 'flight' && <Plane className="text-royal-gold" size={14} />}
                {e.type === 'hotel' && <Building2 className="text-royal-gold" size={14} />}
                {e.type === 'activity' && <Calendar className="text-royal-gold" size={14} />}
              </div>
              <p className="text-royal-gold text-[10px] mb-0.5 ml-2 font-medium">{formatDateLocal(e.date)}</p>
              <div className="ml-2">
                <p className="text-sm font-bold text-foreground">{e.title}</p>
                {e.detail && <p className="text-xs text-zinc-400 mt-1">{e.detail}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 grid-cols-1 md:grid-cols-2">
          {trip.city && <WeatherCard city={trip.city} country={trip.country} departDate={trip.depart_date} />}
          {trip.flight_no && <FlightTrackerCard airline={trip.airline} flightNo={trip.flight_no} departDate={trip.depart_date} />}
        </div>
        </>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={t('edit')}>
        <div className="space-y-4">
          <Field label={t('name')}><Input value={form.name || ''} onChange={(v) => setForm({ ...form, name: v })} /></Field>
          <Field label={t('origin_country')}>
            <CountryPicker value={form.origin_country || ''} title={t('origin_country')}
              onChange={(country, currency) => setForm({ ...form, origin_country: country, base_currency: currency })} />
          </Field>
          <Field label={t('destination_country')}>
            <CountryPicker value={form.country || ''} title={t('destination_country')}
              onChange={(country, currency) => setForm({ ...form, country, currency_code: currency })} />
          </Field>
          <Field label={isRtl ? 'نوع مسار الرحلة' : 'Route Type'}>
             <div className="flex bg-black/40 p-1 rounded-xl">
               <button onClick={() => setForm({...form, is_round_trip: true as any})} className={`flex-1 py-2 text-sm rounded-lg transition ${form.is_round_trip ? 'bg-royal-gold text-black font-semibold' : 'text-zinc-400'}`}>{isRtl ? 'ذهاب وعودة' : 'Round Trip'}</button>
               <button onClick={() => setForm({...form, is_round_trip: false as any})} className={`flex-1 py-2 text-sm rounded-lg transition ${!form.is_round_trip ? 'bg-royal-gold text-black font-semibold' : 'text-zinc-400'}`}>{isRtl ? 'ذهاب فقط' : 'One Way'}</button>
             </div>
          </Field>
          <div className={`grid ${form.is_round_trip ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
            <Field label={t('departure')}><Input type="date" value={formatDateLocal(form.depart_date)} onChange={(v) => setForm({ ...form, depart_date: v })} /></Field>
            {form.is_round_trip && <Field label={t('return')}><Input type="date" value={formatDateLocal(form.return_date)} onChange={(v) => setForm({ ...form, return_date: v })} /></Field>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('airline')}>
              <ListPicker value={form.airline || ''} title={t('airline')} onChange={(v) => setForm({ ...form, airline: v })}
                options={AIRLINES.map((a) => ({ value: a, label: a, icon: <Plane size={15} /> }))} />
            </Field>
            <Field label={t('flight_no')}><Input value={form.flight_no || ''} onChange={(v) => setForm({ ...form, flight_no: v.toUpperCase() })} /></Field>
          </div>
          <Field label={t('hotel')}><Input value={form.hotel || ''} onChange={(v) => setForm({ ...form, hotel: v })} icon={<Hotel size={15} />} /></Field>
          <Field label={t('budget_total') + ` (${form.base_currency || 'EGP'})`}><Input type="number" inputMode="decimal" value={form.budget_total || ''} onChange={(v) => setForm({ ...form, budget_total: v })} icon={<Wallet size={15} />} /></Field>
          <Field label={t('notes_field')}><TextArea value={form.notes || ''} onChange={(v) => setForm({ ...form, notes: v })} rows={2} /></Field>
          <Button onClick={save} isLoading={isSaving} className="w-full"><Save size={17} />{t('save')}</Button>
        </div>
      </Modal>
    </div>
  );
}
