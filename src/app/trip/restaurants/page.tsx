'use client';
import { MapPin, Store } from 'lucide-react';
import CrudScreen from '@/components/shared/CrudScreen';
import { Card } from '@/components/ui/Primitives';
import { fmt } from '@/lib/utils';
import { Star } from 'lucide-react';

export default function RestaurantsPage() {
  return (
    <CrudScreen
      entity="restaurants" titleKey="restaurants" titleIcon={<Store size={20} />}
      fields={[
        { key: 'name', labelKey: 'name', required: true },
        { key: 'location', labelKey: 'location' },
        { key: 'rating', labelKey: 'rating', type: 'rating' },
        { key: 'est_cost', labelKey: 'est_cost', type: 'number' },
        { key: 'currency', labelKey: 'currency', type: 'currency' },
        { key: 'notes', labelKey: 'notes_field', type: 'textarea' }
      ]}
      renderItem={(r, a) => (
        <Card flat onClick={a.edit} className="!p-3.5">
          <div className="flex items-center gap-3">
            <span className="icon-tile"><Store size={17} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-foreground truncate">{String(r.name)}</p>
              {Boolean(r.location) && <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1 truncate"><MapPin size={10} />{String(r.location)}</p>}
            </div>
            <div className="text-end shrink-0">
              <p className="flex gap-0.5 justify-end">
                {[1,2,3,4,5].map((n) => <Star key={n} size={12} className={n <= Number(r.rating) ? 'text-royal-gold' : 'text-zinc-700'} fill={n <= Number(r.rating) ? '#2563EB' : 'none'} />)}
              </p>
              {Number(r.est_cost) > 0 && <p className="text-[10px] text-zinc-500 mt-1">~{fmt(Number(r.est_cost))} {String(r.currency)}</p>}
            </div>
          </div>
        </Card>
      )}
    />
  );
}
