'use client';
import { useCallback, useEffect, useState } from 'react';
import { Check, ListChecks, Plus, Save, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useTripStore } from '@/stores/tripStore';
import { useUiStore } from '@/stores/uiStore';
import type { GenericRecord } from '@/types';
import { CHECKLIST_PHASES } from '@/types';
import { Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, ProgressBar, ListSkeleton } from '@/components/ui/Primitives';
import { isTrue, cn } from '@/lib/utils';

export default function ChecklistPage() {
  const t = useT();
  const trip = useTripStore((s) => s.activeTrip);
  const showToast = useUiStore((s) => s.showToast);
  const [items, setItems] = useState<GenericRecord[]>([]);
  const [phase, setPhase] = useState<string>('before_travel');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!trip) return;
    setLoading(true);
    const res = await api<GenericRecord[]>('checklist.list', { trip_id: trip.id });
    if (res.ok && Array.isArray(res.data)) setItems(res.data);
    setLoading(false);
  }, [trip]);
  useEffect(() => { void load(); }, [load]);

  const toggle = async (item: GenericRecord) => {
    const done = !isTrue(item.done);
    setItems(items.map((i) => (i.id === item.id ? { ...i, done } : i)));
    await api('checklist.update', { id: item.id, done });
  };

  const add = async () => {
    if (!newItem) return;
    setIsSaving(true);
    const res = await api('checklist.create', { trip_id: trip!.id, phase, item: newItem });
    setIsSaving(false);
    if (res.ok) { showToast(t('save') + ' ✓'); setModal(false); setNewItem(''); void load(); }
  };

  const del = async () => { 
    if (deleteId) { 
      setIsDeleting(true);
      await api('checklist.delete', { id: deleteId }); 
      setIsDeleting(false);
      setDeleteId(null); 
      void load(); 
    } 
  };

  const phaseItems = items.filter((i) => i.phase === phase).sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
  const done = phaseItems.filter((i) => isTrue(i.done)).length;
  const phaseCount = (p: string) => {
    const list = items.filter((i) => i.phase === p);
    return `${list.filter((i) => isTrue(i.done)).length}/${list.length}`;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 rise">
        <span className="icon-tile"><ListChecks size={20} /></span>
        <h1 className="font-display text-[22px] gold-text flex-1">{t('checklist')}</h1>
        <button onClick={() => setModal(true)} className="w-10 h-10 bg-royal-gold text-zinc-900 rounded-[12px] flex items-center justify-center shadow-[0_4px_16px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition shrink-0">
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4 rise rise-1">
        {CHECKLIST_PHASES.map((p) => (
          <button key={p} onClick={() => setPhase(p)}
            className={cn('card-flat !rounded-2xl p-3 text-start transition active:scale-[0.97]',
              phase === p && '!border-royal-gold/50')}
            style={phase === p ? { background: 'linear-gradient(150deg, rgba(37, 99, 235,0.12), rgba(37, 99, 235,0.03))' } : undefined}>
            <span className={cn('block text-[12.5px]', phase === p ? 'text-royal-goldsoft' : 'text-zinc-500 dark:text-zinc-400')}>{t(p)}</span>
            <span className="block text-[10px] text-zinc-600 mt-1">{phaseCount(p)}</span>
          </button>
        ))}
      </div>
      <Card className="mb-4 rise rise-2 !py-3.5">
        <ProgressBar value={done} max={phaseItems.length || 1} />
        <p className="text-[11px] text-zinc-500 mt-2">{done}/{phaseItems.length} · {t(phase)}</p>
      </Card>
      {loading ? <ListSkeleton /> : phaseItems.length === 0 ? <EmptyState imageSrc="/illustrations/empty-checklist.svg" /> : (
        <div className="space-y-2">
          {phaseItems.map((item) => (
            <Card key={item.id} flat className="flex items-center gap-3 !py-3 !px-3.5">
              <button onClick={() => toggle(item)}
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition active:scale-90"
                style={isTrue(item.done)
                  ? { background: 'linear-gradient(135deg,#3B82F6,#0284C7)', color: '#000' }
                  : { border: '1.5px solid #2A2A36' }}>
                {isTrue(item.done) && <Check size={15} strokeWidth={3} />}
              </button>
              <p className={cn('text-[14px] flex-1', isTrue(item.done) ? 'text-zinc-600 line-through' : 'text-foreground')}>{String(item.item)}</p>
              <button onClick={() => setDeleteId(item.id)} className="text-zinc-700 p-1"><X size={16} /></button>
            </Card>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={t('add')}>
        <div className="space-y-4">
          <Field label={t('item')}><Input value={newItem} onChange={setNewItem} icon={<Plus size={16} />} /></Field>
          <Button onClick={add} isLoading={isSaving} className="w-full"><Save size={17} />{t('save')}</Button>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onConfirm={del} onCancel={() => setDeleteId(null)} isLoading={isDeleting} />
    </div>
  );
}
