'use client';
import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ScanLine, Save, Trash2, Wallet, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useTripStore } from '@/stores/tripStore';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import type { Expense } from '@/types';
import { EXPENSE_CATEGORIES } from '@/types';
import { EXPENSE_ICONS } from '@/lib/icons';
import { Badge, Button, Card, ChipGroup, ConfirmDialog, EmptyState, Fab, Field, Input, Modal, Segmented, Spinner, TextArea, ListSkeleton } from '@/components/ui/Primitives';
import { CurrencyPicker } from '@/components/ui/Pickers';
import { fmt, todayIso } from '@/lib/utils';

export default function ExpensesPage() {
  const t = useT();
  const trip = useTripStore((s) => s.activeTrip);
  const role = useAuthStore((s) => s.user?.role);
  const showToast = useUiStore((s) => s.showToast);
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({ category: 'food', amount: '', currency: '', date: todayIso(), store: '', payment_method: 'cash', notes: '' });

  const load = useCallback(async () => {
    if (!trip) return;
    setLoading(true);
    const res = await api<Expense[]>('expenses.list', { trip_id: trip.id });
    if (res.ok && Array.isArray(res.data)) setItems(res.data);
    setLoading(false);
  }, [trip]);
  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setForm({ category: 'food', amount: '', currency: trip?.currency_code || 'USD', date: todayIso(), store: '', payment_method: 'cash', notes: '' });
    setEditing(null); setModal(true);
  };
  const openEdit = (e: Expense) => {
    setForm({ category: e.category, amount: String(e.amount), currency: e.currency, date: String(e.date).slice(0, 10), store: e.store, payment_method: e.payment_method, notes: e.notes });
    setEditing(e); setModal(true);
  };

  const save = async () => {
    if (!form.amount) { showToast(t('amount') + ' ؟', 'error'); return; }
    setIsSaving(true);
    const payload = editing ? { id: editing.id, patch: form } : { ...form, trip_id: trip!.id };
    const res = await api(editing ? 'expenses.update' : 'expenses.create', payload);
    setIsSaving(false);
    if (res.ok) { showToast(t('save') + ' ✓'); setModal(false); void load(); }
    else showToast(res.error?.message || 'Error', 'error');
  };

  const del = async () => { 
    if (deleteId) { 
      setIsDeleting(true);
      await api('expenses.delete', { id: deleteId }); 
      setIsDeleting(false);
      setDeleteId(null); 
      void load(); 
    } 
  };

  const shown = useMemo(() => filter === 'all' ? items : items.filter((e) => e.category === filter), [filter, items]);
  const total = useMemo(() => shown.reduce((s, e) => s + (parseFloat(String(e.amount_egp)) || 0), 0), [shown]);
  const catOpts = useMemo(() => [{ value: 'all', label: t('all') }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c, icon: EXPENSE_ICONS[c] }))], [t]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 rise">
        <span className="icon-tile"><Wallet size={20} /></span>
        <h1 className="font-display text-[22px] gold-text flex-1">{t('expenses')}</h1>
        <div className="flex gap-2 shrink-0">
          <Link href="/trip/scanner/" className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-[12px] flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 transition">
            <ScanLine size={18} />
          </Link>
          <button onClick={openCreate} className="w-10 h-10 bg-royal-gold text-zinc-900 rounded-[12px] flex items-center justify-center shadow-[0_4px_16px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition">
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div className="mb-4 rise rise-1"><ChipGroup value={filter} onChange={setFilter} options={catOpts} /></div>
      <Card className="mb-4 text-center !py-5 rise rise-2">
        <p className="font-display text-[30px] leading-none gold-text">{fmt(total)}</p>
        <p className="text-[10px] text-zinc-500 mt-1.5">{t('total')} {trip?.base_currency || 'EGP'} · {filter === 'all' ? t('all') : filter}</p>
      </Card>
      {loading ? <ListSkeleton /> : shown.length === 0 ? <EmptyState imageSrc="/illustrations/empty-expenses.svg" /> : (
        <div className="space-y-2.5">
          {shown.map((e) => (
            <Card key={e.id} flat onClick={() => openEdit(e)} className="!p-3.5">
              <div className="flex items-center gap-3">
                {EXPENSE_ICONS[e.category] || EXPENSE_ICONS.other}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-foreground truncate">{e.store || e.category}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{String(e.date).slice(0, 10)} · {e.payment_method}</p>
                </div>
                <div className="text-end shrink-0">
                  <p className="font-display text-[15px] text-foreground">{fmt(e.amount)} <span className="text-[10px] text-zinc-500">{e.currency}</span></p>
                  <p className="text-[10px] text-zinc-600">{fmt(e.amount_egp)} {trip?.base_currency || 'EGP'}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t('edit') : t('add')}>
        <div className="space-y-4">
          <Field label={t('amount')}>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <Input type="number" inputMode="decimal" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} className="!text-[22px] font-display" />
              <CurrencyPicker value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} title={t('currency')}
                extra={trip ? [trip.currency_code, trip.base_currency || 'EGP'] : []} />
            </div>
          </Field>
          <Field label={t('category')}>
            <ChipGroup value={form.category} onChange={(v) => setForm({ ...form, category: v })}
              options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c, icon: EXPENSE_ICONS[c] }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('date')}><Input type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></Field>
            <Field label="Payment">
              <Segmented value={form.payment_method} onChange={(v) => setForm({ ...form, payment_method: v })}
                options={[{ value: 'cash', label: '💵 Cash' }, { value: 'card', label: '💳 Card' }]} />
            </Field>
          </div>
          <Field label={t('store')}><Input value={form.store} onChange={(v) => setForm({ ...form, store: v })} /></Field>
          <Field label={t('notes_field')}><TextArea value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} rows={2} /></Field>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setModal(false)} className="flex-1">{t('cancel') || 'Cancel'}</Button>
            <Button onClick={save} isLoading={isSaving} className="flex-[2]"><Save size={17} />{t('save')}</Button>
          </div>
          {editing && role === 'owner' && (
            <Button variant="danger" onClick={() => { setModal(false); setDeleteId(editing.id); }} disabled={isSaving} className="w-full"><Trash2 size={16} />{t('delete')}</Button>
          )}
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onConfirm={del} onCancel={() => setDeleteId(null)} isLoading={isDeleting} />
    </div>
  );
}
