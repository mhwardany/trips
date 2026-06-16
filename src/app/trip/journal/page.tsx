'use client';
import { NotebookPen } from 'lucide-react';
import CrudScreen from '@/components/shared/CrudScreen';
import { Card } from '@/components/ui/Primitives';
import { todayIso } from '@/lib/utils';

export default function JournalPage() {
  return (
    <CrudScreen
      entity="journal" titleKey="journal" titleIcon={<NotebookPen size={20} />}
      defaultValues={{ date: todayIso() }}
      fields={[
        { key: 'title', labelKey: 'title', required: true },
        { key: 'date', labelKey: 'date', type: 'date' },
        { key: 'body', labelKey: 'body', type: 'textarea' }
      ]}
      renderItem={(j, a) => (
        <Card flat onClick={a.edit} className="!p-4">
          <p className="font-display text-[15px] text-foreground">{String(j.title)}</p>
          <p className="text-[11px] text-royal-goldsoft/70 mt-0.5">{String(j.date).slice(0, 10)}</p>
          {Boolean(j.body) && <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-3 whitespace-pre-wrap leading-relaxed">{String(j.body)}</p>}
        </Card>
      )}
    />
  );
}
