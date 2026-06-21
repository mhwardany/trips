'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, CalendarDays, ChevronRight, Mail, Menu, Plane, RefreshCw, Sparkles, Trash2, Wallet, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useT, useIsRtl } from '@/lib/i18n';
import { useAuthStore } from '@/stores/authStore';
import { useTripStore } from '@/stores/tripStore';
import { useUiStore } from '@/stores/uiStore';
import type { Trip } from '@/types';
import { Button, Card, ConfirmDialog, Field, Input, Modal, Segmented, ChipGroup, EmptyState } from '@/components/ui/Primitives';
import { CountryPicker, ListPicker } from '@/components/ui/Pickers';
import { AIRLINES, COUNTRIES } from '@/lib/catalog';
import DestinationImage from '@/components/shared/DestinationImage';
import { fmt, formatDateLocal } from '@/lib/utils';
import { JoyIcon } from '@/components/ui/JoyIcon';

interface Suggestion {
  message_id: string; subject: string; from: string; received: string;
  detected: { flight_no: string; airline: string; depart_date: string; return_date: string; city: string; country: string; hotel: string };
}

const TYPE_OPTS = [
  { value: 'family', label: '👨‍👩‍👧 Family' }, { value: 'business', label: '💼 Business' },
  { value: 'shopping', label: '🛍 Shopping' }, { value: 'medical', label: '🏥 Medical' },
  { value: 'personal', label: '✨ Personal' }, { value: 'custom', label: '⚙ Custom' }
];

const EMPTY_FORM = { name: '', type: 'family', origin_country: 'Egypt', base_currency: 'EGP', is_round_trip: true, country: 'Kuwait', city: '', depart_date: '', return_date: '', budget_total: '', hotel: '', airline: '', flight_no: '', currency_code: 'KWD' };

export default function TripsPage() {
  const router = useRouter();
  const t = useT();
  const isRtl = useIsRtl();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setActiveTrip = useTripStore((s) => s.setActiveTrip);
  const activeTrip = useTripStore((s) => s.activeTrip);
  const showToast = useUiStore((s) => s.showToast);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { if (!token) router.replace('/'); }, [token, router]);

  useEffect(() => {
    // Clear active trip when returning to the trips list
    setActiveTrip(null);
  }, [setActiveTrip]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api<Trip[]>('trips.list', {});
    if (res.ok && Array.isArray(res.data)) setTrips(res.data);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const canManage = user?.role !== 'family';

  const scanInbox = async () => {
    setScanning(true);
    const res = await api<Suggestion[]>('trips.scanEmail', {});
    setScanning(false);
    if (res.ok && Array.isArray(res.data)) setSuggestions(res.data);
    else showToast(res.error?.message || 'Scan failed', 'error');
  };

  const fromSuggestion = (s: Suggestion) => {
    const d = s.detected;
    setForm({
      ...EMPTY_FORM,
      name: d.city ? `${d.city} Trip` : s.subject.slice(0, 30),
      country: d.country || 'Kuwait',
      origin_country: (d as any).origin_country || 'Egypt',
      is_round_trip: (d as any).is_round_trip !== undefined ? (d as any).is_round_trip : true,
      currency_code: COUNTRIES.find((c) => c.name === d.country)?.currency || 'KWD',
      city: d.city, depart_date: d.depart_date, return_date: d.return_date,
      airline: d.airline, flight_no: d.flight_no, hotel: d.hotel
    });
    setModal(true);
  };

  const select = (trip: Trip) => { setActiveTrip(trip); router.push('/trip/'); };

  const del = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const res = await api('trips.delete', { id: deleteId });
    setIsDeleting(false);
    if (res.ok) {
      showToast(t('delete') + ' ✓');
      if (activeTrip?.id === deleteId) setActiveTrip(null);
      setDeleteId(null);
      void load();
    } else { showToast(res.error?.message || 'Error', 'error'); setDeleteId(null); }
  };

  const create = async () => {
    if (!form.name || !form.depart_date || (form.is_round_trip && !form.return_date)) { showToast('Name & dates required', 'error'); return; }
    setIsSaving(true);
    const res = await api<Trip>('trips.create', { ...form, budget_total: parseFloat(form.budget_total) || 0 });
    setIsSaving(false);
    if (res.ok && res.data) { showToast(t('save') + ' ✓'); setModal(false); select(res.data); }
    else showToast(res.error?.message || 'Error', 'error');
  };

  const shown = trips.filter((tr) => tr.status === tab);
  const daysTo = (d: string) => {
    if (!d) return 0;
    const localDateStr = formatDateLocal(d);
    const today = new Date();
    const [y, m, day] = localDateStr.split('-').map(Number);
    const target = new Date(y, m - 1, day);
    const u1 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const u2 = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
    return Math.max(0, Math.round((u2 - u1) / 86400000));
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 pt-7 pb-28">
      <div className="flex items-center gap-3 mb-6 rise">
        <JoyIcon icon={Plane} color="ocean" size="sm" />
        <h1 className="font-display text-[24px] gold-text flex-1">{t('trips')}</h1>
        <div className="flex gap-2 shrink-0 items-center">
          {canManage && (
            <button onClick={() => { setForm({ ...EMPTY_FORM }); setModal(true); }} className="w-10 h-10 bg-royal-gold text-zinc-900 rounded-[12px] flex items-center justify-center shadow-[0_4px_16px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition">
              <Plus size={20} strokeWidth={2.5} />
            </button>
          )}
          <button onClick={() => router.push('/settings/')} className="tap-highlight-transparent"><JoyIcon icon={Menu} color="coral" size="sm" className="!w-10 !h-10" /></button>
        </div>
      </div>

      <div className="mb-5 rise rise-1">
        <Segmented value={tab} onChange={(v) => setTab(v as 'active' | 'archived')}
          options={[{ value: 'active', label: t('trips') }, { value: 'archived', label: t('archive') }]} />
      </div>

      {canManage && (
        <Card className="mb-5 rise rise-2">
          <div className="flex items-center gap-3">
            <JoyIcon icon={Mail} color="amethyst" size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-foreground">{t('from_inbox')}</p>
              <p className="text-[11px] text-zinc-500">Gmail · bookings & e-tickets</p>
            </div>
            <Button variant="ghost" onClick={scanInbox} disabled={scanning} className="!h-11 !px-4 text-[13px]">
              {scanning ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {t('scan_inbox')}
            </Button>
          </div>
          {suggestions !== null && (
            <div className="mt-4 space-y-2">
              {suggestions.length === 0 && <p className="text-[12px] text-zinc-500 text-center py-2">{t('no_suggestions')}</p>}
              {suggestions.map((s) => (
                <button key={s.message_id} onClick={() => fromSuggestion(s)}
                  className="card-flat !rounded-2xl p-3.5 w-full text-start flex items-center gap-3 active:scale-[0.98] transition">
                  <JoyIcon icon={Plane} color="ocean" size="sm" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] text-foreground truncate">{s.subject}</span>
                    <span className="block text-[11px] text-zinc-500 truncate">
                      {s.from}{s.detected.depart_date && ` · ${s.detected.depart_date}`}{s.detected.flight_no && ` · ${s.detected.flight_no}`}
                    </span>
                  </span>
                  <ChevronRight size={16} className="text-royal-gold shrink-0 rtl:rotate-180" />
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-44 w-full" />)}
        </div>
      ) : shown.length === 0 ? <EmptyState imageSrc="/illustrations/empty-trips.svg" /> : (
        <div className="space-y-4">
          {shown.map((trip, i) => {
            const c = COUNTRIES.find((x) => x.name === trip.country);
            const flag = c?.flag || '✈️';
            const days = daysTo(trip.depart_date);
            return (
              <div key={trip.id} className={i < 4 ? `rise rise-${i + 1}` : ''}>
                <div className="trip-card" onClick={() => select(trip)} role="button">
                  {/* cover */}
                  <DestinationImage country={trip.country} city={trip.city} seed={trip.name} flag={flag}
                    eager={i === 0} className="h-44 w-full" rounded="rounded-none" />
                  {/* delete */}
                  {canManage && (
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(trip.id); }}
                      className="absolute top-3 end-3 z-10 w-9 h-9 rounded-xl flex items-center justify-center bg-black/45 backdrop-blur-sm text-red-300 border border-red-400/25 active:scale-90 transition"
                      aria-label={t('delete')}>
                      <Trash2 size={15} />
                    </button>
                  )}
                  {/* days badge */}
                  {tab === 'active' && (
                    <div className="absolute top-3 start-3 z-10 px-3 py-1.5 rounded-xl bg-black/45 backdrop-blur-sm border border-royal-gold/30">
                      <span className="font-display text-[17px] gold-text leading-none">{days}</span>
                      <span className="text-[10px] text-zinc-300 ms-0.5">{t('days_short') || 'd'}</span>
                    </div>
                  )}
                  {/* bottom content overlaid */}
                  <div className="absolute bottom-0 inset-x-0 p-4 z-10">
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl leading-none">{flag}</span>
                          <span className="text-[11px] text-zinc-300/90 truncate flex items-center gap-1">
                            {trip.origin_country} <Plane size={10} className="rotate-90 text-royal-gold" /> {trip.city ? `${trip.city}, ` : ''}{trip.country}
                          </span>
                        </div>
                        <h3 className="font-display text-[19px] text-white truncate drop-shadow">{trip.name}</h3>
                        <p className="text-[11px] text-zinc-300/80 mt-1 flex items-center gap-1.5">
                          <CalendarDays size={11} />{formatDateLocal(trip.depart_date)} {trip.is_round_trip !== false ? `→ ${formatDateLocal(trip.return_date)}` : `(${isRtl ? 'ذهاب فقط' : 'One Way'})`}
                        </p>
                      </div>
                      <div className="shrink-0 text-end">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-sm border border-royal-gold/25 text-[11px] text-royal-goldsoft">
                          <Wallet size={11} />{trip.currency_code}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={t('new_trip')}>
        <div className="space-y-4">
          <Field label={t('name')}><Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} /></Field>
          <Field label={t('trip_type')}><ChipGroup value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={TYPE_OPTS} /></Field>
          <Field label={t('origin_country')}>
            <CountryPicker value={form.origin_country} title={t('origin_country')}
              onChange={(country, currency) => setForm({ ...form, origin_country: country, base_currency: currency })} />
          </Field>
          <Field label={t('destination_country')}>
            <CountryPicker value={form.country} title={t('destination_country')}
              onChange={(country, currency) => setForm({ ...form, country, currency_code: currency })} />
          </Field>
          <Field label={isRtl ? 'نوع مسار الرحلة' : 'Route Type'}>
             <div className="flex bg-black/40 p-1 rounded-xl">
               <button onClick={() => setForm({...form, is_round_trip: true as any})} className={`flex-1 py-2 text-sm rounded-lg transition ${form.is_round_trip ? 'bg-royal-gold text-black font-semibold' : 'text-zinc-400'}`}>{isRtl ? 'ذهاب وعودة' : 'Round Trip'}</button>
               <button onClick={() => setForm({...form, is_round_trip: false as any})} className={`flex-1 py-2 text-sm rounded-lg transition ${!form.is_round_trip ? 'bg-royal-gold text-black font-semibold' : 'text-zinc-400'}`}>{isRtl ? 'ذهاب فقط' : 'One Way'}</button>
             </div>
          </Field>
          <div className={`grid ${form.is_round_trip ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
            <Field label={t('departure')}><Input type="date" value={form.depart_date} onChange={(v) => setForm({ ...form, depart_date: v })} /></Field>
            {form.is_round_trip && <Field label={t('return')}><Input type="date" value={form.return_date} onChange={(v) => setForm({ ...form, return_date: v })} /></Field>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('airline')}>
              <ListPicker value={form.airline} title={t('airline')} onChange={(v) => setForm({ ...form, airline: v })}
                options={AIRLINES.map((a) => ({ value: a, label: a, icon: <Plane size={15} /> }))} />
            </Field>
            <Field label={t('flight_no')}><Input value={form.flight_no} onChange={(v) => setForm({ ...form, flight_no: v.toUpperCase() })} /></Field>
          </div>
          <Field label={t('budget_total') + ` (${form.base_currency})`}>
            <Input type="number" inputMode="decimal" value={form.budget_total} onChange={(v) => setForm({ ...form, budget_total: v })} icon={<Wallet size={16} />} />
          </Field>
          <Field label={t('hotel')}><Input value={form.hotel} onChange={(v) => setForm({ ...form, hotel: v })} /></Field>
          <Button onClick={create} isLoading={isSaving} className="w-full mt-2">{t('save')}</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onConfirm={del} onCancel={() => setDeleteId(null)} isLoading={isDeleting} />
    </div>
  );
}
