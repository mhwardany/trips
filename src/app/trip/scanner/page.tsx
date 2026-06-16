'use client';
import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, ScanLine, Save } from 'lucide-react';
import { api, compressImage } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useTripStore } from '@/stores/tripStore';
import { useUiStore } from '@/stores/uiStore';
import { EXPENSE_CATEGORIES } from '@/types';
import { EXPENSE_ICONS } from '@/lib/icons';
import { Button, Card, ChipGroup, Field, Input, Spinner } from '@/components/ui/Primitives';
import { CurrencyPicker } from '@/components/ui/Pickers';
import { todayIso } from '@/lib/utils';

interface ReceiptDraft { receipt_id: string; ocr_store?: string; ocr_date?: string; ocr_amount?: string | number; ocr_currency?: string; }

export default function ScannerPage() {
  const t = useT();
  const trip = useTripStore((s) => s.activeTrip);
  const showToast = useUiStore((s) => s.showToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'' | 'upload' | 'ocr' | 'save'>('');
  const [preview, setPreview] = useState('');
  const [draft, setDraft] = useState<ReceiptDraft | null>(null);
  const [form, setForm] = useState({ store: '', amount: '', currency: '', date: todayIso(), category: 'food' });

  const handleFile = async (file: File | null) => {
    if (!file || !trip) return;
    setPreview(URL.createObjectURL(file));
    setBusy('upload');
    const { base64, mime } = await compressImage(file);
    const up = await api<{ receipt_id: string }>('receipts.upload', { trip_id: trip.id, filename: file.name, mime, base64 });
    if (!up.ok || !up.data) { showToast(up.error?.message || 'Upload failed', 'error'); setBusy(''); return; }
    setBusy('ocr');
    const ocr = await api<ReceiptDraft>('receipts.ocr', { receipt_id: up.data.receipt_id });
    setBusy('');
    if (ocr.ok && ocr.data) {
      setDraft({ ...ocr.data, receipt_id: up.data.receipt_id });
      setForm({
        store: String(ocr.data.ocr_store || ''), amount: String(ocr.data.ocr_amount || ''),
        currency: String(ocr.data.ocr_currency || trip.currency_code),
        date: String(ocr.data.ocr_date || todayIso()).slice(0, 10), category: 'food'
      });
    } else {
      setDraft({ receipt_id: up.data.receipt_id });
      setForm({ store: '', amount: '', currency: trip.currency_code, date: todayIso(), category: 'food' });
      showToast(ocr.error?.message || 'OCR unavailable — enter manually', 'error');
    }
  };

  const confirm = async () => {
    if (!draft || !form.amount) return;
    setBusy('save');
    const res = await api('receipts.toExpense', { receipt_id: draft.receipt_id, ...form });
    setBusy('');
    if (res.ok) { showToast(t('save') + ' ✓'); setDraft(null); setPreview(''); }
    else showToast(res.error?.message || 'Error', 'error');
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2 rise">
        <span className="icon-tile"><ScanLine size={20} /></span>
        <h1 className="font-display text-[22px] gold-text">{t('scanner')}</h1>
      </div>
      <p className="text-[12px] text-zinc-500 mb-5 rise rise-1">{t('scan_hint')}</p>
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleFile(e.target.files?.[0] || null)} />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0] || null)} />
      {!draft && !busy && (
        <div className="grid grid-cols-2 gap-3 mt-4 rise rise-2">
          <button onClick={() => camRef.current?.click()} className="card-luxe py-12 text-center active:scale-[0.97] transition">
            <span className="icon-tile !w-14 !h-14 mx-auto mb-3"><Camera size={24} /></span>
            <p className="text-[13px] text-foreground">{t('take_photo')}</p>
          </button>
          <button onClick={() => fileRef.current?.click()} className="card-luxe py-12 text-center active:scale-[0.97] transition">
            <span className="icon-tile !w-14 !h-14 mx-auto mb-3"><ImageIcon size={24} /></span>
            <p className="text-[13px] text-foreground">{t('upload_image')}</p>
          </button>
        </div>
      )}
      {preview && <img src={preview} alt="receipt" className="rounded-3xl border border-royal-gold/20 max-h-56 mx-auto my-5" />}
      {busy && busy !== 'save' && <div className="text-center"><Spinner /><p className="text-[12px] text-royal-goldsoft -mt-5 animate-pulse">{busy === 'upload' ? 'Uploading…' : 'OCR…'}</p></div>}
      {draft && (
        <Card className="space-y-4">
          <p className="text-[12px] gold-text font-semibold">Draft — review & confirm</p>
          <Field label={t('amount')}>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <Input type="number" inputMode="decimal" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} className="!text-[22px] font-display" />
              <CurrencyPicker value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} title={t('currency')} extra={trip ? [trip.currency_code, trip.base_currency || 'EGP'] : []} />
            </div>
          </Field>
          <Field label={t('store')}><Input value={form.store} onChange={(v) => setForm({ ...form, store: v })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('date')}><Input type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></Field>
          </div>
          <Field label={t('category')}>
            <ChipGroup value={form.category} onChange={(v) => setForm({ ...form, category: v })}
              options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c, icon: EXPENSE_ICONS[c] }))} />
          </Field>
          <Button onClick={confirm} isLoading={busy === 'save'} className="w-full"><Save size={17} />{t('save')}</Button>
        </Card>
      )}
    </div>
  );
}
