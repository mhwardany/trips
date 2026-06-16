'use client';
import { StickyNote } from 'lucide-react';
import CrudScreen from '@/components/shared/CrudScreen';
import { Card } from '@/components/ui/Primitives';

export default function NotesPage() {
  return (
    <CrudScreen
      entity="notes" titleKey="notes" titleIcon={<StickyNote size={20} />}
      fields={[
        { key: 'title', labelKey: 'title', required: true },
        { key: 'body', labelKey: 'body', type: 'textarea' }
      ]}
      renderItem={(n, a) => (
        <Card flat onClick={a.edit} className="!p-4">
          <p className="text-[14px] text-foreground">{String(n.title)}</p>
          {Boolean(n.body) && <p className="text-[12px] text-zinc-500 mt-1 line-clamp-2 whitespace-pre-wrap">{String(n.body)}</p>}
        </Card>
      )}
    />
  );
}
