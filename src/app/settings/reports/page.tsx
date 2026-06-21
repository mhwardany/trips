'use client';
import { useState } from 'react';
import { FileBarChart2, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useUiStore } from '@/stores/uiStore';
import { Button, Card } from '@/components/ui/Primitives';
import AppShell from '@/components/layout/AppShell';

export default function GlobalReportsPage() {
  const t = useT();
  const showToast = useUiStore((s) => s.showToast);
  const [busy, setBusy] = useState('');

  const run = async (kind: 'globalPdf' | 'globalExcel' | 'globalCsv') => {
    setBusy(kind);
    if (kind === 'globalCsv') {
      const res = await api<{ filename: string; content: string }>('reports.globalCsv', {});
      if (res.ok && res.data) {
        const blob = new Blob([res.data.content], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = res.data.filename;
        a.click();
        URL.revokeObjectURL(a.href);
      } else showToast(res.error?.message || 'Error', 'error');
    } else {
      const res = await api<{ url: string }>('reports.' + kind, {});
      if (res.ok && res.data?.url) window.open(res.data.url, '_blank');
      else showToast(res.error?.message || 'Error', 'error');
    }
    setBusy('');
  };

  const blocks = [
    { kind: 'globalPdf' as const, Icon: FileText, title: 'Global Master Report (PDF)', desc: 'Enterprise aggregate report of all trips', label: t('export_pdf'), gold: true },
    { kind: 'globalExcel' as const, Icon: FileSpreadsheet, title: 'Global Workbook (Excel)', desc: 'Cross-trip expenses data & Summary', label: t('export_excel'), gold: false }
  ];

  return (
    <AppShell>
      <div className="max-w-md mx-auto space-y-6 pt-2 pb-10 px-4">
      <div className="flex items-center gap-3 rise">
        <span className="icon-tile"><FileBarChart2 size={20} /></span>
        <div>
          <h1 className="font-display text-[22px] gold-text">Global Reports</h1>
          <p className="text-[12px] text-zinc-500">Aggregate reports across all your trips</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider px-1">Master Exports</h3>
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
            <p className="text-[14px] text-foreground">All Expenses Dataset (CSV)</p>
          </div>
          <Button onClick={() => run('globalCsv')} disabled={busy === 'globalCsv'} variant="ghost" className="w-full">
            <FileDown size={16} />{busy === 'globalCsv' ? t('loading') : t('export_csv')}
          </Button>
        </Card>
      </div>
    </div>
    </AppShell>
  );
}
