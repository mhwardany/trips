'use client';
import { safeExternalUrl } from '@/lib/utils';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Boxes, Camera, Flag, Link2, Save, MessageCircle, Trash2, Plus } from 'lucide-react';
import { api, compressImage } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useTripStore } from '@/stores/tripStore';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import type { FamilyRequest } from '@/types';
import { REQUEST_STATUSES } from '@/types';
import { Badge, Button, Card, ChipGroup, EmptyState, Field, Input, Modal, Segmented, Spinner, TextArea, ListSkeleton } from '@/components/ui/Primitives';

const STATUS_COLORS: Record<string, 'muted' | 'gold' | 'amber' | 'green' | 'red'> = {
  requested: 'muted', planned: 'gold', searching: 'amber', available: 'amber',
  purchased: 'green', packed: 'green', delivered: 'green', closed: 'muted'
};

const SUGGESTIONS = ['Perfume 🧴', 'Makeup 💄', 'Skincare 💆‍♀️', 'Clothes 👗', 'Shoes 👟', 'Bag 👜', 'Watch ⌚', 'Chocolate 🍫', 'Coffee ☕', 'Electronics 📱', 'Souvenirs 🎁', 'Toys 🧸'];

export default function RequestsPage() {
  const t = useT();
  const trip = useTripStore((s) => s.activeTrip);
  const role = useAuthStore((s) => s.user?.role);
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const showToast = useUiStore((s) => s.showToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<FamilyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [modal, setModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFor, setStatusFor] = useState<FamilyRequest | null>(null);
  const [imageB64, setImageB64] = useState<{ base64: string; mime: string; name: string } | null>(null);
  const [form, setForm] = useState({ item_name: '', link: '', priority: 'medium', notes: '' });

  const load = useCallback(async () => {
    if (!trip) return;
    setLoading(true);
    const endpoint = role === 'family' ? 'requests.listMine' : 'requests.list';
    const payload: any = { trip_id: trip.id };
    if (role === 'family' && activeProfile) payload.profile_id = activeProfile.id;
    const res = await api<FamilyRequest[]>(endpoint, payload);
    if (res.ok && Array.isArray(res.data)) {
      setItems([...res.data].sort((a, b) => String(b.id).localeCompare(String(a.id))));
    }
    setLoading(false);
  }, [trip, role, activeProfile]);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!form.item_name) { showToast(t('item') + ' ؟', 'error'); return; }
    setIsSaving(true);
    let image_file_id = '';
    if (imageB64) {
      const up = await api<{ file_id: string }>('files.upload', { trip_id: trip!.id, sub: 'requests', filename: imageB64.name, mime: imageB64.mime, base64: imageB64.base64 });
      if (up.ok && up.data) image_file_id = up.data.file_id;
    }
    const payload: any = { ...form, trip_id: trip!.id, image_file_id };
    if (role === 'family' && activeProfile) {
      payload.profile_id = activeProfile.id;
      payload.profile_name = activeProfile.name;
    }
    const res = await api('requests.create', payload);
    setIsSaving(false);
    if (res.ok) { 
      setItems(prev => [res.data as FamilyRequest, ...prev]);
      showToast(t('save') + ' ✓'); 
      setModal(false); 
      setImageB64(null); 
      setForm({ item_name: '', link: '', priority: 'medium', notes: '' }); 
    }
  };

  const openWa = (r: any, e: any) => {
    e.stopPropagation();
    if (!r.requester_whatsapp) return;
    const num = String(r.requester_whatsapp).replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`مرحباً ${r.requester_name}، بخصوص طلبك (${r.item_name})... `);
    window.location.href = `https://wa.me/${num}?text=${msg}`;
  };


  const move = async (status: string) => {
    if (!statusFor) return;
    await api('requests.updateStatus', { id: statusFor.id, status });
    if (status === 'planned' || status === 'searching') {
        showToast(t('save') + ' ✓ (Shopping List)');
    }
    setStatusFor(null); void load();
  };

  const del = async (id: string) => {
    if (!confirm(t('delete') + '؟')) return;
    setIsDeleting(true);
    await api('requests.delete', { id });
    setIsDeleting(false);
    setStatusFor(null);
    void load();
  };

  const shown = useMemo(() => tab === 'all' ? items : items.filter((r) => r.status === tab), [tab, items]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 rise">
        <span className="icon-tile"><Boxes size={20} /></span>
        <h1 className="font-display text-[22px] gold-text flex-1">{t('requests')}</h1>
        <button onClick={() => setModal(true)} className="w-10 h-10 bg-royal-gold text-zinc-900 rounded-[12px] flex items-center justify-center shadow-[0_4px_16px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition shrink-0">
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>
      <div className="mb-4 rise rise-1">
        <ChipGroup value={tab} onChange={setTab}
          options={[{ value: 'all', label: t('all') }, ...REQUEST_STATUSES.map((s) => ({ value: s, label: s }))]} />
      </div>
      {loading ? <ListSkeleton /> : shown.length === 0 ? <EmptyState imageSrc="/illustrations/empty-requests.svg" /> : (
        <div className="space-y-2.5">
          {shown.map((r) => (
            <Card key={r.id} flat className="!p-3.5"
              onClick={() => role !== 'family' && setStatusFor(r)}>
              <div className="flex items-start gap-3">
                <span className="icon-tile"><Boxes size={17} /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-foreground">{r.item_name}</p>
                  <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-2 flex-wrap">
                    {r.requester_name}
                    {(r as any).requester_whatsapp && (
                      <button onClick={(e) => openWa(r, e)} className="text-emerald-500 hover:text-emerald-600 transition p-1 rounded-full bg-emerald-500/10">
                        <MessageCircle size={12} />
                      </button>
                    )}
                    <Badge color={r.priority === 'high' ? 'red' : r.priority === 'medium' ? 'amber' : 'muted'}><Flag size={9} />{r.priority}</Badge>
                    {r.link && <a href={safeExternalUrl(r.link)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-royal-goldsoft"><Link2 size={11} />{t('link')}</a>}
                  </p>
                  {r.notes && <p className="text-[11px] text-zinc-600 mt-1.5">{r.notes}</p>}
                </div>
                <Badge color={STATUS_COLORS[r.status] || 'muted'}>{r.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0];
        if (f) { const c = await compressImage(f); setImageB64({ ...c, name: f.name }); }
      }} />
      <Modal open={modal} onClose={() => setModal(false)} title={t('add')}>
        <div className="space-y-4">
          <Field label={t('item')}>
            <Input value={form.item_name} onChange={(v) => setForm({ ...form, item_name: v })} />
            {form.item_name.length === 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => setForm({ ...form, item_name: s.split(' ')[0] })} 
                    className="text-[11px] px-2.5 py-1.5 rounded-lg transition-transform active:scale-95 text-zinc-600 dark:text-zinc-300"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </Field>
          <Field label={t('link') + ' (optional)'}><Input value={form.link} onChange={(v) => setForm({ ...form, link: v })} icon={<Link2 size={15} />} /></Field>
          <Field label={t('priority')}>
            <Segmented value={form.priority} onChange={(v) => setForm({ ...form, priority: v })}
              options={[{ value: 'low', label: '🟢 Low' }, { value: 'medium', label: '🟡 Medium' }, { value: 'high', label: '🔴 High' }]} />
          </Field>
          <Field label={t('notes_field')}><TextArea value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} rows={2} /></Field>
          <Button variant="ghost" onClick={() => fileRef.current?.click()} className="w-full">
            <Camera size={17} />{imageB64 ? '✓ ' + imageB64.name.slice(0, 24) : t('upload_image')}
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setModal(false)} className="flex-1">{t('cancel') || 'Cancel'}</Button>
            <Button onClick={create} isLoading={isSaving} className="flex-[2]"><Save size={17} />{t('save')}</Button>
          </div>
        </div>
      </Modal>
      <Modal open={!!statusFor} onClose={() => setStatusFor(null)} title={statusFor?.item_name || ''}>
        <div className="flex flex-col gap-3">
          <p className="text-center text-[13px] text-zinc-500 mb-2">Update Request Status</p>
          <div className="grid grid-cols-2 gap-2">
            {REQUEST_STATUSES.filter(s => !['closed', 'requested'].includes(s)).map((s) => (
              <button key={s} onClick={() => move(s)}
                className={`card-flat !rounded-2xl py-3.5 text-[13px] capitalize active:scale-95 transition ${statusFor?.status === s ? 'gold-text !border-royal-gold/50' : 'text-zinc-600 dark:text-zinc-300'}`}>
                {s === 'planned' ? 'Approve (Planned)' : s}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
             <Button variant="danger" className="flex-1" onClick={() => del(statusFor!.id)} isLoading={isDeleting}><Trash2 size={16}/> {t('delete')}</Button>
             <Button variant="ghost" className="flex-1 border border-zinc-800" onClick={() => move('closed')}>Reject / Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
