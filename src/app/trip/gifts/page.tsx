'use client';
import { Gift, User } from 'lucide-react';
import CrudScreen from '@/components/shared/CrudScreen';
import { Badge, Card } from '@/components/ui/Primitives';
import { fmt } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function GiftsPage() {
  const t = useT();
  return (
    <CrudScreen
      entity="gifts" titleKey="gifts" titleIcon={<Gift size={20} />}
      fields={[
        { key: 'item', labelKey: 'item', required: true },
        { key: 'recipient', labelKey: 'recipient', required: true },
        { key: 'qty', labelKey: 'quantity', type: 'stepper' },
        { key: 'est_cost', labelKey: 'est_cost', type: 'number' },
        { key: 'actual_cost', labelKey: 'actual_price', type: 'number' },
        { key: 'delivery_status', labelKey: 'status', type: 'chips', options: [
          { value: 'pending', label: '⏳ Pending' }, { value: 'purchased', label: '🛍 Purchased' }, { value: 'delivered', label: '✓ Delivered' }
        ] }
      ]}
      renderItem={(g, a) => (
        <Card flat onClick={a.edit} className="!p-3.5">
          <div className="flex items-center gap-3">
            <span className="icon-tile"><Gift size={17} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-foreground truncate">{String(g.item)} {Number(g.qty) > 1 && <span className="text-zinc-500 text-[11px]">×{String(g.qty)}</span>}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1"><User size={10} />{String(g.recipient)}</p>
            </div>
            <div className="text-end">
              <Badge color={g.delivery_status === 'delivered' ? 'gold' : g.delivery_status === 'purchased' ? 'green' : 'muted'}>{String(g.delivery_status)}</Badge>
              <p className="text-[10px] text-zinc-600 mt-1">{fmt(Number(g.actual_cost) || Number(g.est_cost))}</p>
            </div>
          </div>
        </Card>
      )}
    />
  );
}
