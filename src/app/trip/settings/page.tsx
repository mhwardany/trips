'use client';
import { useState } from 'react';
import { FileBarChart2, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useTripStore } from '@/stores/tripStore';
import { useUiStore } from '@/stores/uiStore';
import { Button, Card, ChipGroup } from '@/components/ui/Primitives';

export default function TripSettingsPage() {
  const t = useT();
  const trip = useTripStore((s) => s.activeTrip);
  const showToast = useUiStore((s) => s.showToast);
  const [dataset, setDataset] = useState('expenses');
  const [busy, setBusy] = useState('');

  const run = async (kind: 'pdf' | 'excel' | 'csv') => {
    if (!trip) return;
    setBusy(kind);
    if (kind === 'csv') {
      const res = await api<{ filename: string; content: string }>('reports.csv', { trip_id: trip.id, dataset });
      if (res.ok && res.data) {
        const blob = new Blob([res.data.content], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = res.data.filename;
        a.click();
        URL.revokeObjectURL(a.href);
      } else showToast(res.error?.message || 'Error', 'error');
    } else {
      const res = await api<{ url: string }>('reports.' + kind, { trip_id: trip.id });
      if (res.ok && res.data?.url) window.open(res.data.url, '_blank');
      else showToast(res.error?.message || 'Error', 'error');
    }
    setBusy('');
  };

  const blocks = [
    { kind: 'pdf' as const, Icon: FileText, title: 'Trip Report (PDF)', desc: 'Enterprise-grade printable report', label: t('export_pdf'), gold: true },
    { kind: 'excel' as const, Icon: FileSpreadsheet, title: 'Trip Workbook (Excel)', desc: 'Detailed data + Summary', label: t('export_excel'), gold: false }
  ];

  return (
    <div className="max-w-md mx-auto space-y-6 pt-2 pb-10 px-4">
      <div className="flex items-center gap-3 rise">
        <span className="icon-tile"><FileBarChart2 size={20} /></span>
        <div>
          <h1 className="font-display text-[22px] gold-text">Trip Settings & Reports</h1>
          <p className="text-[12px] text-zinc-500">Settings and exports for {trip?.name}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider px-1">Reports & Exports</h3>
      {blocks.map(({ kind, Icon, title, desc, label, gold }, i) => (
        <Card key={kind} className={`rise rise-${i + 1}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="icon-tile"><Icon size={19} /></span>
            <div>
              <p className="text-[14px] text-foreground">{title}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{desc}</p>
            </div>
          </div>
          <Button onClick={() => run(kind)} disabled={busy === kind} variant={gold ? 'gold' : 'ghost'} className="w-full">
            <FileDown size={16} />{busy === kind ? t('loading') : label}
          </Button>
        </Card>
      ))}
      <Card className="rise rise-3">
        <div className="flex items-center gap-3 mb-4">
          <span className="icon-tile"><FileDown size={19} /></span>
          <p className="text-[14px] text-foreground">CSV Dataset</p>
        </div>
        <div className="mb-4">
          <ChipGroup value={dataset} onChange={setDataset} options={[
            { value: 'expenses', label: 'Expenses' }, { value: 'shopping', label: 'Shopping' },
            { value: 'gifts', label: 'Gifts' }, { value: 'rates', label: 'FX Rates' }
          ]} />
        </div>
        <Button onClick={() => run('csv')} disabled={busy === 'csv'} variant="ghost" className="w-full">
          <FileDown size={16} />{busy === 'csv' ? t('loading') : t('export_csv')}
        </Button>
      </Card>
      </div>
    </div>
  );
}
