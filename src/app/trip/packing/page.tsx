'use client';
import { Luggage, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useTripStore } from '@/stores/tripStore';
import { useAuthStore } from '@/stores/authStore';
import { isTrue } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import CrudScreen from '@/components/shared/CrudScreen';
import { Badge, Card } from '@/components/ui/Primitives';
import { PACKING_CATEGORIES, type ShoppingItem } from '@/types';
import { PACKING_ICONS } from '@/lib/icons';

const PACKING_SUGGESTIONS: Record<string, string[]> = {
  clothes: ['T-shirts', 'Shirts', 'Pants', 'Shorts', 'Underwear', 'Socks', 'Jacket', 'Pajamas', 'Shoes', 'Slippers', 'Swimwear'],
  electronics: ['Phone Charger', 'Power Bank', 'Travel Adapter', 'Laptop', 'Headphones', 'Smartwatch', 'Camera'],
  documents: ['Passport', 'ID', 'Visa', 'Tickets', 'Hotel Reservation', 'Cash', 'Credit Cards', 'Driver License'],
  personal: ['Toothbrush', 'Toothpaste', 'Deodorant', 'Perfume', 'Hairbrush', 'Shaving Kit', 'Face Wash', 'Sunscreen', 'IQOS', 'Heets'],
  medicines: ['Painkillers', 'Band-aids', 'Vitamins', 'Allergy Pills', 'Stomach Meds'],
  gifts: ['Souvenirs', 'Chocolates', 'Local Treats']
};

export default function PackingPage() {
  const trip = useTripStore((s) => s.activeTrip);
  const t = useT();
  const [purchasedShopping, setPurchasedShopping] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    if (!trip || useAuthStore.getState().user?.role === 'family') return;
    api<ShoppingItem[]>('shopping.list', { trip_id: trip.id }).then(res => {
      if (res.ok && Array.isArray(res.data)) {
        setPurchasedShopping(res.data.filter(s => isTrue(s.purchased)));
      }
    });
  }, [trip]);

  return (
    <CrudScreen
      entity="packing"
      listEndpoint={useAuthStore(s => s.user?.role) === 'family' ? 'packing.listMine' : 'packing.list'}
      titleKey="packing" titleIcon={<Luggage size={20} />}
      fields={[
        { key: 'item', labelKey: 'item', required: true, quickAdd: true, suggestions: (f) => PACKING_SUGGESTIONS[String(f.category)] || [] },
        { key: 'category', labelKey: 'category', type: 'chips', options: PACKING_CATEGORIES.map((c) => ({ value: c, label: c, icon: PACKING_ICONS[c] })) },
        { key: 'qty', labelKey: 'quantity', type: 'stepper' },
        { key: 'status', labelKey: 'status', type: 'chips', options: [
          { value: 'missing', label: '✗ Missing' }, { value: 'purchased', label: '🛍 Purchased' }, { value: 'packed', label: '✓ Packed' }
        ] }
      ]}
      renderItem={(p, a) => {
        const isPacked = p.status === 'packed';
        return (
          <Card flat onClick={a.edit} className="!p-3.5 flex items-center gap-3">
            <button 
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                // Optimistic UI could be added here, but a quick refresh is fine for now
                await api('packing.update', { id: p.id, patch: { status: isPacked ? 'missing' : 'packed' } });
                a.refresh();
              }}
              className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isPacked ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-500 text-transparent hover:border-zinc-400'}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg>
            </button>
            <div className="text-zinc-400">
              {PACKING_ICONS[String(p.category)] || PACKING_ICONS.personal}
            </div>
            <div className={`flex-1 min-w-0 transition-opacity ${isPacked ? 'opacity-40 line-through' : ''}`}>
              <p className="text-[14px] text-foreground truncate">{String(p.item)} {Number(p.qty) > 1 && <span className="text-zinc-500 text-[11px]">×{String(p.qty)}</span>}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 capitalize">{String(p.category)}</p>
            </div>
            <Badge color={isPacked ? 'green' : p.status === 'purchased' ? 'gold' : 'red'}>{String(p.status)}</Badge>
          </Card>
        );
      }}
      extraContent={
        purchasedShopping.length > 0 && (
          <div className="mt-8 rise rise-5">
            <h2 className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
              <ShoppingBag size={14} className="text-royal-gold" /> {t('purchased')} ({t('shopping')})
            </h2>
            <div className="space-y-2.5 opacity-80">
              {purchasedShopping.map((s) => (
                <Card key={s.id} flat className="!p-3.5 border-l-2 !border-l-royal-gold">
                  <div className="flex items-center gap-3">
                    <span className="icon-tile text-royal-gold"><ShoppingBag size={18} /></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-foreground truncate">{String(s.item)} {Number(s.qty) > 1 && <span className="text-zinc-500 text-[11px]">×{String(s.qty)}</span>}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 capitalize">{String(s.group_name || 'Shopping')}</p>
                    </div>
                    <Badge color="gold">{t('purchased')}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      }
    />
  );
}
