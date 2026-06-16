'use client';
/** CRUD engine v2 — selection-first fields: chips, stepper, stars, pickers */
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useTripStore } from '@/stores/tripStore';
import { useUiStore } from '@/stores/uiStore';
import type { GenericRecord } from '@/types';
import { Button, ChipGroup, ConfirmDialog, EmptyState, Fab, Field, Input, Modal, Spinner, StarRating, Stepper, TextArea, ListSkeleton } from '@/components/ui/Primitives';
import { CurrencyPicker, ListPicker } from '@/components/ui/Pickers';
import { Save, Trash2, Plus } from 'lucide-react';

export interface FieldDef {
  key: string;
  labelKey: string;
  type?: 'text' | 'number' | 'date' | 'chips' | 'list' | 'textarea' | 'stepper' | 'rating' | 'currency';
  options?: { value: string; label: string; icon?: ReactNode }[];
  required?: boolean;
  suggestions?: (form: Record<string, string>) => string[];
  quickAdd?: boolean;
}

interface Props {
  entity: string;
  listEndpoint?: string;
  titleKey: string;
  titleIcon?: ReactNode;
  fields: FieldDef[];
  renderItem: (item: GenericRecord, actions: { edit: () => void; del: () => void; refresh: () => void }) => ReactNode;
  tripScoped?: boolean;
  defaultValues?: Record<string, unknown>;
  headerExtra?: ReactNode;
  extraContent?: ReactNode;
  emptyStateImage?: string;
}

export default function CrudScreen({ entity, listEndpoint, titleKey, titleIcon, fields, renderItem, tripScoped = true, defaultValues, headerExtra, extraContent, emptyStateImage }: Props) {
  const t = useT();
  const trip = useTripStore((s) => s.activeTrip);
  const showToast = useUiStore((s) => s.showToast);
  const [items, setItems] = useState<GenericRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<GenericRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api<GenericRecord[]>(listEndpoint || `${entity}.list`, tripScoped && trip ? { trip_id: trip.id } : {});
    if (res.ok && Array.isArray(res.data)) setItems(res.data);
    setLoading(false);
  }, [entity, listEndpoint, trip, tripScoped]);
  useEffect(() => { void load(); }, [load]);

  const initialFor = (item?: GenericRecord) => {
    const init: Record<string, string> = {};
    fields.forEach((f) => {
      const fallback = f.type === 'stepper' ? '1' : f.type === 'rating' ? '0'
        : (f.type === 'chips' || f.type === 'list') ? f.options?.[0]?.value ?? '' : '';
      init[f.key] = String(item?.[f.key] ?? defaultValues?.[f.key] ?? fallback);
    });
    return init;
  };

  const openCreate = () => { setForm(initialFor()); setEditing(null); setModal(true); };
  const openEdit = (item: GenericRecord) => { setForm(initialFor(item)); setEditing(item); setModal(true); };

  const save = async (keepOpen = false) => {
    for (const f of fields) if (f.required && !form[f.key]) { showToast(t(f.labelKey) + ' ؟', 'error'); return; }
    setIsSaving(true);
    const payload: Record<string, unknown> = editing
      ? { id: editing.id, patch: form }
      : { ...form, ...(tripScoped && trip ? { trip_id: trip.id } : {}) };
    const res = await api(editing ? `${entity}.update` : `${entity}.create`, payload);
    setIsSaving(false);
    if (res.ok) { 
      showToast(t('save') + ' ✓'); 
      if (keepOpen === true && !editing) {
        setForm(prev => ({ ...prev, [fields[0].key]: '' }));
        setTimeout(() => document.getElementById('quick-add-input')?.focus(), 50);
      } else {
        setModal(false); 
      }
      void load(); 
    }
    else showToast(res.error?.message || 'Error', 'error');
  };

  const del = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const res = await api(`${entity}.delete`, { id: deleteId });
    setIsDeleting(false);
    if (res.ok) { showToast(t('delete') + ' ✓'); void load(); }
    setDeleteId(null);
  };

  const renderField = (f: FieldDef) => {
    const v = form[f.key] || '';
    const set = (val: string) => setForm({ ...form, [f.key]: val });
    switch (f.type) {
      case 'chips': return <ChipGroup value={v} onChange={set} options={f.options || []} />;
      case 'list': return <ListPicker value={v} onChange={set} title={t(f.labelKey)} options={f.options || []} />;
      case 'currency': return <CurrencyPicker value={v} onChange={set} title={t(f.labelKey)} />;
      case 'stepper': return <Stepper value={parseInt(v) || 1} onChange={(n) => set(String(n))} />;
      case 'rating': return <StarRating value={parseInt(v) || 0} onChange={(n) => set(String(n))} />;
      case 'textarea': return <TextArea value={v} onChange={set} />;
      case 'number': return <Input type="number" inputMode="decimal" value={v} onChange={set} />;
      case 'date': return <Input type="date" value={v} onChange={set} />;
      default: return (
        <div className="space-y-2">
          {f.quickAdd && !editing ? (
            <div className="flex gap-2 items-center">
              <div className="flex-1"><Input id="quick-add-input" value={v} onChange={set} onKeyDown={(e) => e.key === 'Enter' && save(true)} /></div>
              <button type="button" onClick={() => save(true)} disabled={isSaving} className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-royal-gold text-white active:scale-95 transition-transform disabled:opacity-50">
                {isSaving ? <div className="w-5 h-5 rounded-full animate-spin border-[2px] border-white/20 border-t-white" /> : <Plus size={20} strokeWidth={2.5} />}
              </button>
            </div>
          ) : (
            <Input value={v} onChange={set} />
          )}
          {f.suggestions && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {f.suggestions(form).map(s => (
                <button key={s} type="button" onClick={() => set(s)}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg transition-all active:scale-95 text-zinc-600 dark:text-zinc-300 hover:text-foreground"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                  + {s}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 rise">
        {titleIcon && <span>{titleIcon}</span>}
        <h1 className="font-display text-[22px] gold-text">{t(titleKey)}</h1>
        <span className="ms-auto">{headerExtra}</span>
      </div>
      {loading ? <ListSkeleton /> : items.length === 0 ? <EmptyState imageSrc={emptyStateImage || "/illustrations/empty-generic.svg"} /> : (
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <div key={item.id} className={i < 4 ? `rise rise-${i + 1}` : ''}>
              {renderItem(item, { edit: () => openEdit(item), del: () => setDeleteId(item.id), refresh: () => void load() })}
            </div>
          ))}
        </div>
      )}
      {extraContent}
      <Fab onClick={openCreate} />
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t('edit') : t('add')}>
        <div className="space-y-4">
          {fields.map((f) => <Field key={f.key} label={t(f.labelKey)}>{renderField(f)}</Field>)}
          {!fields.some(f => f.quickAdd && !editing) && (
            <Button onClick={() => save(false)} isLoading={isSaving} className="w-full mt-1"><Save size={17} />{t('save')}</Button>
          )}
          {editing && <Button variant="danger" onClick={() => { setModal(false); setDeleteId(editing.id); }} disabled={isSaving} className="w-full"><Trash2 size={16} />{t('delete')}</Button>}
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onConfirm={del} onCancel={() => setDeleteId(null)} isLoading={isDeleting} />
    </div>
  );
}
