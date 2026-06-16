'use client';
import { Building2, Clock, MapPin } from 'lucide-react';
import CrudScreen from '@/components/shared/CrudScreen';
import { Card } from '@/components/ui/Primitives';

export default function MallsPage() {
  return (
    <CrudScreen
      entity="malls" titleKey="malls" titleIcon={<Building2 size={20} />}
      fields={[
        { key: 'name', labelKey: 'name', required: true },
        { key: 'location', labelKey: 'location' },
        { key: 'opening_hours', labelKey: 'opening_hours' },
        { key: 'notes', labelKey: 'notes_field', type: 'textarea' }
      ]}
      renderItem={(m, a) => (
        <Card flat onClick={a.edit} className="!p-3.5">
          <div className="flex items-center gap-3">
            <span className="icon-tile"><Building2 size={17} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-foreground truncate">{String(m.name)}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2 truncate">
                {Boolean(m.location) && <span className="inline-flex items-center gap-1"><MapPin size={10} />{String(m.location)}</span>}
                {Boolean(m.opening_hours) && <span className="inline-flex items-center gap-1"><Clock size={10} />{String(m.opening_hours)}</span>}
              </p>
            </div>
          </div>
        </Card>
      )}
    />
  );
}
