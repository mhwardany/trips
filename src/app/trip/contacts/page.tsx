'use client';
import { useState } from 'react';
import { HeartHandshake, MessageCircle, Phone, Siren, Users, Building } from 'lucide-react';
import CrudScreen from '@/components/shared/CrudScreen';
import { Card, ChipGroup } from '@/components/ui/Primitives';
import { CONTACT_CATEGORIES } from '@/types';
import { useT } from '@/lib/i18n';
import { waChat } from '@/lib/wa';

const CAT_ICONS: Record<string, React.ReactNode> = {
  family: <Users size={14} />, friends: <HeartHandshake size={14} />,
  kuwait: <Building size={14} />, emergency: <Siren size={14} />
};

export default function ContactsPage() {
  const t = useT();
  const [cat, setCat] = useState<string>('family');
  return (
    <div>
      <div className="mb-1 rise">
        <ChipGroup value={cat} onChange={setCat}
          options={CONTACT_CATEGORIES.map((c) => ({ value: c, label: t(c), icon: CAT_ICONS[c] }))} />
      </div>
      <CrudScreen
        key={cat} entity="contacts" titleKey="contacts" titleIcon={<Phone size={20} />}
        tripScoped={false} defaultValues={{ category: cat }}
        fields={[
          { key: 'name', labelKey: 'name', required: true },
          { key: 'category', labelKey: 'category', type: 'chips', options: CONTACT_CATEGORIES.map((c) => ({ value: c, label: t(c), icon: CAT_ICONS[c] })) },
          { key: 'phone', labelKey: 'phone' },
          { key: 'whatsapp', labelKey: 'whatsapp' },
          { key: 'notes', labelKey: 'notes_field' }
        ]}
        renderItem={(c, a) => {
          if (c.category !== cat) return null;
          return (
            <Card flat className="!p-3.5">
              <div className="flex items-center gap-3">
                <div onClick={a.edit} className="flex-1 min-w-0 cursor-pointer flex items-center gap-3">
                  <span className="icon-tile">{CAT_ICONS[String(c.category)] || <Phone size={16} />}</span>
                  <span className="min-w-0">
                    <span className="block text-[14px] text-foreground truncate">{String(c.name)}</span>
                    <span className="block text-[11px] text-zinc-500 mt-0.5" dir="ltr">{String(c.phone)}</span>
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  {Boolean(c.phone) && (
                    <a href={'tel:' + String(c.phone)} className="icon-tile !w-11 !h-11"><Phone size={17} /></a>
                  )}
                  {Boolean(c.whatsapp) && (
                    <a href={waChat(String(c.whatsapp))} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center w-11 h-11 rounded-2xl"
                      style={{ background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.3)', color: '#34D399' }}>
                      <MessageCircle size={17} />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          );
        }}
      />
    </div>
  );
}
