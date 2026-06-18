'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BookUser, FileText, Plane, Hotel, Shield, Siren, Save, Trash2, Upload, Eye, CalendarClock, Coffee } from 'lucide-react';
import { api, compressImage } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useTripStore } from '@/stores/tripStore';
import { useUiStore } from '@/stores/uiStore';
import type { GenericRecord } from '@/types';
import { Badge, Button, Card, ChipGroup, ConfirmDialog, EmptyState, Fab, Field, Input, Modal, Spinner, ListSkeleton } from '@/components/ui/Primitives';

const DOC_OPTS = [
  { value: 'passport', label: 'Passport', icon: <BookUser size={14} /> },
  { value: 'visa', label: 'Visa', icon: <FileText size={14} /> },
  { value: 'boarding_pass', label: 'Boarding', icon: <Plane size={14} /> },
  { value: 'hotel_booking', label: 'Hotel', icon: <Hotel size={14} /> },
  { value: 'insurance', label: 'Insurance', icon: <Shield size={14} /> },
  { value: 'emergency', label: 'Emergency', icon: <Siren size={14} /> },
  { value: 'lounge', label: 'Lounge', icon: <Coffee size={14} /> },
  { value: 'other', label: 'Other', icon: <FileText size={14} /> }
];

export default function DocumentsPage() {
  const t = useT();
  const trip = useTripStore((s) => s.activeTrip);
  const showToast = useUiStore((s) => s.showToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<GenericRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: '', type: 'passport', expiry_date: '' });

  const load = useCallback(async () => {
    if (!trip) return;
    setLoading(true);
    const res = await api<GenericRecord[]>('documents.list', { trip_id: trip.id });
    if (res.ok && Array.isArray(res.data)) setItems(res.data);
    setLoading(false);
  }, [trip]);
  useEffect(() => { void load(); }, [load]);

  const upload = async () => {
    if (!pendingFile) { showToast(t('upload_image'), 'error'); return; }
    setBusy(true);
    const { base64, mime } = await compressImage(pendingFile);
    const res = await api('documents.upload', { trip_id: trip!.id, filename: pendingFile.name, mime, base64, title: form.title || pendingFile.name, type: form.type, expiry_date: form.expiry_date });
    setBusy(false);
    if (res.ok) { showToast(t('save') + ' ✓'); setModal(false); setPendingFile(null); void load(); }
    else showToast(res.error?.message || 'Error', 'error');
  };

  const open = async (doc: GenericRecord) => {
    const res = await api<{ url: string }>('documents.getLink', { id: doc.id });
    if (res.ok && res.data) window.open(res.data.url, '_blank');
    else showToast(res.error?.message || 'Error', 'error');
  };
  const del = async () => { 
    if (deleteId) { 
      setIsDeleting(true);
      await api('documents.delete', { id: deleteId }); 
      setIsDeleting(false);
      setDeleteId(null); 
      void load(); 
    } 
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-1 rise">
        <span className="icon-tile"><FileText size={20} /></span>
        <h1 className="font-display text-[22px] gold-text">{t('documents')}</h1>
      </div>
      <p className="text-[11px] text-zinc-500 mb-4 ps-1 rise rise-1">Secure links expire after 30 minutes.</p>
      {loading ? <ListSkeleton /> : items.length === 0 ? <EmptyState imageSrc="/illustrations/empty-documents.svg" /> : (
        <div className="space-y-2.5">
          {items.map((d) => {
            const opt = DOC_OPTS.find((o) => o.value === d.type);
            return (
              <Card key={d.id} flat className="!p-3.5">
                <div className="flex items-center gap-3">
                  <span className="icon-tile">{opt?.icon || <FileText size={16} />}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-foreground truncate">{String(d.title)}</p>
                    <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-2">
                      <Badge color="muted">{String(d.type)}</Badge>
                      {Boolean(d.expiry_date) && <span className="inline-flex items-center gap-1"><CalendarClock size={10} />{String(d.expiry_date)}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => open(d)} className="icon-tile !w-10 !h-10"><Eye size={16} /></button>
                    <button onClick={() => setDeleteId(d.id)} className="icon-tile !w-10 !h-10 !text-red-400 !border-red-500/25"><Trash2 size={15} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Fab onClick={() => { setForm({ title: '', type: 'passport', expiry_date: '' }); setPendingFile(null); setModal(true); }} />
      <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => setPendingFile(e.target.files?.[0] || null)} />
      <Modal open={modal} onClose={() => setModal(false)} title={t('add')}>
        <div className="space-y-4">
          <Field label={t('title')}><Input value={form.title} onChange={(v) => setForm({ ...form, title: v })} /></Field>
          <Field label={t('type')}><ChipGroup value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={DOC_OPTS} /></Field>
          <Field label="Expiry (optional)"><Input type="date" value={form.expiry_date} onChange={(v) => setForm({ ...form, expiry_date: v })} /></Field>
          <Button variant="ghost" onClick={() => fileRef.current?.click()} className="w-full"><Upload size={16} />{pendingFile ? '✓ ' + pendingFile.name.slice(0, 26) : t('upload_image') + ' / PDF'}</Button>
          <Button onClick={upload} isLoading={busy} className="w-full"><Save size={17} />{t('save')}</Button>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onConfirm={del} onCancel={() => setDeleteId(null)} isLoading={isDeleting} />
    </div>
  );
}
