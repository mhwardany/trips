'use client';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Minus, Star, Trash2, Inbox } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { hapticLight } from '@/lib/haptics';

export function Card({ children, className, onClick, flat }: { children: ReactNode; className?: string; onClick?: () => void; flat?: boolean }) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.985 } : undefined}
      onClick={() => { if (onClick) { hapticLight(); onClick(); } }}
      className={cn(flat ? 'card-flat' : 'card-luxe', 'p-4', onClick && 'cursor-pointer', className)}>
      {children}
    </motion.div>
  );
}

export function Button({ children, onClick, variant = 'gold', className, disabled, type = 'button', isLoading }: {
  children: ReactNode; onClick?: () => void; variant?: 'gold' | 'ghost' | 'danger';
  className?: string; disabled?: boolean; type?: 'button' | 'submit'; isLoading?: boolean;
}) {
  const base = variant === 'gold' ? 'btn-gold' : variant === 'danger'
    ? 'h-[52px] px-[22px] rounded-2xl text-[15px] bg-red-500/10 text-red-400 border border-red-500/30 active:scale-[0.97] transition'
    : 'btn-ghost';
  return (
    <motion.button whileTap={{ scale: 0.97 }} type={type} disabled={disabled || isLoading} onClick={() => { hapticLight(); onClick?.(); }} className={cn(base, 'inline-flex items-center justify-center gap-2', className)}>
      {isLoading && <div className="w-4 h-4 rounded-full animate-spin border-[2px] border-current border-t-transparent opacity-70" />}
      {children}
    </motion.button>
  );
}

export function Input({ value, onChange, placeholder, type = 'text', inputMode, maxLength, className, icon, list, autoFocus, onKeyDown, id, dir }: {
  value: string | number; onChange: (v: string) => void; placeholder?: string;
  type?: string; inputMode?: 'numeric' | 'decimal' | 'text'; maxLength?: number; className?: string; icon?: ReactNode; list?: string; autoFocus?: boolean; onKeyDown?: (e: any) => void; id?: string; dir?: string;
}) {
  return (
    <div className="relative">
      {icon && <span className="absolute start-4 top-1/2 -translate-y-1/2 text-zinc-500">{icon}</span>}
      <input id={id} dir={dir} className={cn('input-luxe', icon ? 'ps-12' : '', className)} type={type} inputMode={inputMode} maxLength={maxLength}
        value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} list={list} autoFocus={autoFocus} onKeyDown={onKeyDown} />
    </div>
  );
}

export function TextArea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return <textarea className="input-luxe resize-none" rows={rows} value={value} placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)} />;
}

export function Badge({ children, color = 'gold' }: { children: ReactNode; color?: 'gold' | 'green' | 'red' | 'amber' | 'muted' }) {
  const map = {
    gold: 'bg-royal-gold/15 text-royal-goldsoft border-royal-gold/30',
    green: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
    red: 'bg-red-500/12 text-red-400 border-red-500/25',
    amber: 'bg-amber-500/12 text-amber-500 dark:text-amber-400 border-amber-500/25',
    muted: 'bg-black/5 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border-royal-border'
  };
  return <span className={cn('inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border', map[color])}>{children}</span>;
}

/** Bottom sheet (mobile-first) */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="sheet-anim w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-5 pb-8 rounded-t-[28px] sm:rounded-[28px]"
        style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[19px] font-display font-semibold gold-text">{title}</h3>
          <button onClick={onClose} className="icon-tile !w-9 !h-9 !rounded-xl"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function EmptyState({ label, icon, action, imageSrc }: { label?: string; icon?: ReactNode; action?: ReactNode; imageSrc?: string }) {
  const t = useT();
  return (
    <div className="text-center py-16 text-zinc-500 scale-in">
      {imageSrc ? (
        <div className="relative mx-auto mb-6 w-32 h-32">
          <div className="absolute inset-0 rounded-[28px] opacity-30 blur-2xl" style={{ background: 'radial-gradient(circle, rgba(37, 99, 235,0.4), transparent 70%)' }} />
          <img src={imageSrc} alt="empty" className="w-full h-full object-contain relative z-10 drop-shadow-2xl hover:-translate-y-2 transition-transform duration-500" />
        </div>
      ) : (
        <div className="relative mx-auto mb-5 w-20 h-20">
          <div className="absolute inset-0 rounded-[28px] opacity-30 blur-xl" style={{ background: 'radial-gradient(circle, rgba(37, 99, 235,0.5), transparent 70%)' }} />
          <div className="icon-tile !w-20 !h-20 !rounded-[28px] relative">{icon || <Inbox size={30} />}</div>
        </div>
      )}
      <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{label || t('no_data')}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function Fab({ onClick, extraAction }: { onClick: () => void; extraAction?: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed z-[60] bottom-[100px] right-6 lg:right-[calc(50%-19rem)] flex flex-col items-center gap-3">
      {extraAction}
      <button onClick={onClick} aria-label="Add"
        className="btn-gold !w-[60px] !h-[60px] !p-0 !rounded-[22px] flex items-center justify-center shadow-[0_8px_32px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-transform">
        <Plus size={28} strokeWidth={2.5} className="text-white" />
      </button>
    </div>,
    document.body
  );
}

export function ProgressBar({ value, max, color = '#2563EB' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: pct + '%', background: `linear-gradient(90deg, ${color}AA, ${color})` }} />
    </div>
  );
}

export function ConfirmDialog({ open, onConfirm, onCancel, isLoading }: { open: boolean; onConfirm: () => void; onCancel: () => void; isLoading?: boolean; }) {
  const t = useT();
  return (
    <Modal open={open} onClose={isLoading ? () => {} : onCancel} title={t('delete')}>
      <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-6">{t('confirm_delete')}</p>
      <div className="flex gap-3">
        <Button variant="danger" onClick={onConfirm} isLoading={isLoading} className="flex-1"><Trash2 size={16} />{t('delete')}</Button>
        <Button variant="ghost" onClick={onCancel} disabled={isLoading} className="flex-1">{t('cancel')}</Button>
      </div>
    </Modal>
  );
}

export function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-9 h-9 rounded-full animate-spin"
    style={{ border: '2.5px solid var(--line)', borderTopColor: 'var(--gold)' }} /></div>;
}

/* ============ Selection-first field components ============ */

export function ChipGroup({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string; icon?: ReactNode }[];
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn('chip', value === o.value && 'chip-on')}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

export function Segmented({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="flex p-1 rounded-2xl gap-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn('flex-1 h-11 rounded-xl text-[13px] transition',
            value === o.value ? 'text-white font-semibold' : 'text-zinc-500 dark:text-zinc-400')}
          style={value === o.value ? { background: 'linear-gradient(135deg, #2563EB, #06B6D4)', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' } : undefined}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ value, onChange, min = 1, max = 99 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="inline-flex items-center gap-4 rounded-2xl px-2 h-[52px]" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="icon-tile !w-9 !h-9 !rounded-xl"><Minus size={15} /></button>
      <span className="font-display text-xl min-w-[2ch] text-center text-royal-goldsoft">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="icon-tile !w-9 !h-9 !rounded-xl"><Plus size={15} /></button>
    </div>
  );
}

export function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n === value ? 0 : n)} className="active:scale-90 transition">
          <Star size={28} className={n <= value ? 'text-royal-gold' : 'text-zinc-700'}
            fill={n <= value ? '#2563EB' : 'none'} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-[12px] text-zinc-500 block mb-2 ps-1">{label}</label>
      {children}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3 mt-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3 items-center p-3.5 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40">
          <div className="w-11 h-11 rounded-xl skeleton shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 skeleton rounded w-3/4" />
            <div className="h-3 skeleton rounded w-1/2" />
          </div>
          <div className="w-8 h-8 rounded-full skeleton shrink-0" />
        </div>
      ))}
    </div>
  );
}
