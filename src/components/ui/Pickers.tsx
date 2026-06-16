'use client';
/** Sheet-based pickers: zero typing where possible */
import { useState } from 'react';
import { Search, ChevronDown, Store } from 'lucide-react';
import { Modal } from '@/components/ui/Primitives';
import { COUNTRIES, CURRENCIES, STORE_CATEGORIES } from '@/lib/catalog';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export function PickerTrigger({ value, placeholder, onClick, icon }: {
  value: string; placeholder: string; onClick: () => void; icon?: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick}
      className="input-luxe flex items-center justify-between text-start w-full">
      <span className={cn('flex items-center gap-2.5 truncate', !value && 'text-zinc-500')}>{icon}{value || placeholder}</span>
      <ChevronDown size={17} className="text-zinc-500 shrink-0" />
    </button>
  );
}

export function CountryPicker({ value, onChange, title }: {
  value: string; onChange: (country: string, currency: string, flag: string) => void; title: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const lang = useUiStore((s) => s.lang);
  const selected = COUNTRIES.find((c) => c.name === value);
  const list = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) || c.ar.includes(q));
  return (
    <>
      <PickerTrigger value={selected ? `${selected.flag}  ${lang === 'ar' ? selected.ar : selected.name}` : value} placeholder={title} onClick={() => setOpen(true)} />
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <div className="relative mb-4">
          <Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input className="input-luxe ps-12" value={q} onChange={(e) => setQ(e.target.value)} placeholder="…" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {list.map((c) => (
            <button key={c.name} type="button"
              onClick={() => { onChange(c.name, c.currency, c.flag); setOpen(false); setQ(''); }}
              className={cn('card-flat !rounded-2xl p-3 text-start flex items-center gap-2.5 active:scale-[0.97] transition',
                value === c.name && '!border-royal-gold/50')}>
              <span className="text-2xl">{c.flag}</span>
              <span>
                <span className="block text-[13px] text-foreground">{lang === 'ar' ? c.ar : c.name}</span>
                <span className="block text-[10px] text-zinc-500">{c.currency}</span>
              </span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}

export function CurrencyPicker({ value, onChange, title, extra = [] }: {
  value: string; onChange: (v: string) => void; title: string; extra?: string[];
}) {
  const [open, setOpen] = useState(false);
  const list = Array.from(new Set([...extra, ...CURRENCIES]));
  return (
    <>
      <PickerTrigger value={value} placeholder={title} onClick={() => setOpen(true)} />
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <div className="grid grid-cols-3 gap-2">
          {list.map((c) => (
            <button key={c} type="button" onClick={() => { onChange(c); setOpen(false); }}
              className={cn('card-flat !rounded-2xl py-4 font-display text-[15px] active:scale-95 transition',
                value === c ? 'gold-text !border-royal-gold/50' : 'text-zinc-600 dark:text-zinc-300')}>
              {c}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}

export function ListPicker({ value, onChange, title, options }: {
  value: string; onChange: (v: string) => void; title: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <>
      <PickerTrigger value={selected?.label || ''} placeholder={title} onClick={() => setOpen(true)} icon={selected?.icon} />
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <div className="space-y-2">
          {options.map((o) => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
              className={cn('card-flat !rounded-2xl p-4 w-full text-start flex items-center gap-3 active:scale-[0.98] transition',
                value === o.value && '!border-royal-gold/50')}>
              {o.icon && o.icon}
              <span className="text-[14px] text-foreground">{o.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}

export function StorePicker({ value, onChange, title }: {
  value: string; onChange: (v: string) => void; title: string;
}) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState('Clothes');
  const [custom, setCustom] = useState('');

  const cats = Object.keys(STORE_CATEGORIES);
  const list = STORE_CATEGORIES[cat] || [];

  return (
    <>
      <PickerTrigger value={value} placeholder={title} onClick={() => setOpen(true)} icon={<Store size={15} />} />
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-2">
          {cats.map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)}
              className={cn('shrink-0 px-3 py-1.5 rounded-full text-[12px] transition', 
                cat === c ? 'bg-royal-gold/20 text-royal-gold border border-royal-gold/30' : 'bg-black/5 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border border-transparent')}>
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4 max-h-[40vh] overflow-y-auto no-scrollbar">
          {list.map((s) => (
            <button key={s} type="button" onClick={() => { onChange(s); setOpen(false); }}
              className={cn('card-flat !rounded-2xl p-3 text-start text-[13px] active:scale-[0.97] transition',
                value === s && '!border-royal-gold/50 gold-text')}>
              {s}
            </button>
          ))}
        </div>
        <div className="relative mt-2">
          <input className="input-luxe" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Or type custom store..." />
          {custom.trim() && (
            <button type="button" onClick={() => { onChange(custom.trim()); setOpen(false); setCustom(''); }}
              className="absolute end-1.5 top-1.5 bottom-1.5 px-4 bg-royal-gold text-black rounded-xl text-[12px] font-semibold active:scale-95 transition">
              Use
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}
