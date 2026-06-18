'use client';
import { safeExternalUrl } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { PackageSearch, MessageCircle, ExternalLink, Image as ImageIcon, CheckCircle2, ChevronRight, Share2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useTripStore } from '@/stores/tripStore';
import { useAuthStore } from '@/stores/authStore';
import { Input, Button, Modal, Badge, Spinner, EmptyState, ListSkeleton } from '@/components/ui/Primitives';
import { useT, useIsRtl } from '@/lib/i18n';

export default function ClientOrdersPage() {
  const trip = useTripStore(s => s.activeTrip);
  const trip_id = trip?.id;
  const user = useAuthStore(s => s.user);
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<any>(null);
  
  const t = useT();
  const isRtl = useIsRtl();

  // Edit Form state
  const [status, setStatus] = useState('');
  const [price, setPrice] = useState('');
  const [commission, setCommission] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await api('clientOrders.list', { trip_id });
    if (res.ok) setItems(res.data as any[]);
    setLoading(false);
  };

  useEffect(() => {
    if (trip_id) load();
  }, [trip_id]);

  const save = async () => {
    if (!editItem) return;
    const res = await api('clientOrders.update', {
      id: editItem.id,
      status, price, commission
    });
    if (res.ok) {
      setEditItem(null);
      load();
    } else {
      alert('Error saving order');
    }
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/order?id=${trip_id}`;
    if (navigator.share) {
      await navigator.share({
        title: isRtl ? 'اطلب منتجات من سفري' : 'Order from my trip',
        text: isRtl ? 'يسعدني توفير طلباتكم وتوصيلها لكم، يمكنكم الطلب من هنا:' : 'I can bring items for you! Order here:',
        url: url
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert(isRtl ? 'تم نسخ رابط الطلبات!' : 'Order link copied!');
    }
  };

  const openWa = (phone: string, item: any) => {
    if (!phone) return;
    // Sanitize phone number (convert to string first to avoid errors)
    const num = String(phone).replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      isRtl 
        ? `مرحباً ${item.customer_name}، بخصوص طلبك (${item.item_name})... `
        : `Hello ${item.customer_name}, regarding your order (${item.item_name})... `
    );
    window.location.href = `https://wa.me/${num}?text=${msg}`;
  };

  const initDb = async () => {
    setLoading(true);
    await api('admin.setup');
    alert('تم تهيئة قاعدة البيانات بنجاح!');
    setLoading(false);
  };

  const statusColors: any = {
    new: 'amber',
    priced: 'gold',
    purchased: 'green',
    delivered: 'muted',
    cancelled: 'red'
  };
  const statusLabels: any = {
    new: isRtl ? 'جديد' : 'New',
    priced: isRtl ? 'تم التسعير' : 'Priced',
    purchased: isRtl ? 'تم الشراء' : 'Purchased',
    delivered: isRtl ? 'مكتمل' : 'Delivered',
    cancelled: isRtl ? 'ملغي' : 'Cancelled'
  };

  const content = items.map(o => (
    <div key={o.id} className="card-flat p-4 mb-3">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-foreground text-lg">{o.item_name}</h3>
          <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1.5">
            👤 {o.customer_name}
          </p>
        </div>
        <Badge color={statusColors[o.status] || 'muted'}>{statusLabels[o.status] || o.status}</Badge>
      </div>

      {(o.price || o.commission) && (
        <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-3 rounded-xl mb-3">
          <div className="flex-1">
            <p className="text-[11px] text-zinc-500">{isRtl ? 'التكلفة' : 'Cost'}</p>
            <p className="font-display font-medium text-foreground">{o.price || '-'}</p>
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-zinc-500">{isRtl ? 'العمولة' : 'Commission'}</p>
            <p className="font-display font-medium text-emerald-500">{o.commission || '-'}</p>
          </div>
        </div>
      )}

      {o.details && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4 bg-royal-gold/10 p-2.5 rounded-lg border border-royal-gold/20">
          {o.details}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        <Button variant="ghost" onClick={() => openWa(o.customer_whatsapp, o)} className="flex-1 !bg-emerald-500/10 !text-emerald-500 hover:!bg-emerald-500/20">
          <MessageCircle size={16} /> {isRtl ? 'واتساب' : 'WhatsApp'}
        </Button>
        {o.link && (
          <Button variant="ghost" onClick={() => window.open(safeExternalUrl(o.link), '_blank', 'noopener,noreferrer')} className="px-3">
            <ExternalLink size={16} />
          </Button>
        )}
        <Button onClick={() => {
          setEditItem(o);
          setStatus(o.status || 'new');
          setPrice(o.price || '');
          setCommission(o.commission || '');
        }} className="px-5">
          {isRtl ? 'تعديل' : 'Edit'}
        </Button>
      </div>
    </div>
  ));

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-b from-royal-dark to-background pt-12 pb-6 px-5 rounded-b-[40px] shadow-sm mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-royal-gold to-yellow-400 flex items-center justify-center shadow-lg shrink-0">
          <PackageSearch size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">{isRtl ? 'طلبات العملاء' : 'Client Orders'}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{isRtl ? 'إدارة الطلبات والتسعير' : 'Manage shopper orders'}</p>
        </div>
      </div>

      <div className="px-5 space-y-4 pb-24">
        {loading ? (
          <div className="flex justify-center p-12"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState imageSrc="/illustrations/empty-client-orders.svg" label={isRtl ? 'لا يوجد طلبات عملاء حتى الآن' : 'No client orders yet'} />
        ) : (
          content
        )}

        {/* DB Init button (only needed once) */}
        {items.length === 0 && !loading && (
          <div className="flex justify-center mt-4">
            <Button variant="ghost" onClick={initDb} className="text-xs px-4">
              {isRtl ? 'تهيئة قاعدة البيانات (لأول مرة فقط)' : 'Init DB (Once)'}
            </Button>
          </div>
        )}

        {/* Spacer to ensure the FAB doesn't permanently cover the last item */}
        <div className="h-32"></div>
      </div>
      
      {/* Floating share button */}
      <button onClick={shareLink}
        className="btn-gold !w-[60px] !h-[60px] !p-0 !rounded-[22px] !fixed z-[60] flex items-center justify-center bottom-[85px] right-6 lg:right-[calc(50%-19rem)] shadow-xl shadow-royal-gold/20">
        <Share2 size={24} strokeWidth={2.5} className="text-white" />
      </button>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title={isRtl ? 'تحديث الطلب' : 'Update Order'}>
        <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
          <div>
            <label className="block text-sm font-medium text-zinc-500 mb-1">{isRtl ? 'حالة الطلب' : 'Order Status'}</label>
            <div className="flex gap-2 flex-wrap">
              {['new', 'priced', 'purchased', 'delivered', 'cancelled'].map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-xl text-sm transition ${status === s ? 'bg-royal-gold/20 text-royal-gold border border-royal-gold/30' : 'bg-black/5 dark:bg-white/5 text-zinc-500 border border-transparent'}`}>
                  {statusLabels[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-500 mb-1">{isRtl ? 'سعر الشراء' : 'Price'}</label>
              <Input value={price} onChange={setPrice} placeholder={isRtl ? 'مثال: 250 KWD' : 'e.g. 250 KWD'} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-500 mb-1">{isRtl ? 'العمولة' : 'Commission'}</label>
              <Input value={commission} onChange={setCommission} placeholder={isRtl ? `مثال: 50 ${trip?.base_currency || 'EGP'}` : `e.g. 50 ${trip?.base_currency || 'EGP'}`} />
            </div>
          </div>
          <Button onClick={save} className="w-full mt-2">{isRtl ? 'حفظ التغييرات' : 'Save Changes'}</Button>
        </div>
      </Modal>
    </>
  );
}
