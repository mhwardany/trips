'use client';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Check, MessageCircle, Save, ShoppingBag, ShoppingCart, Store, Trash2, Truck, Users, PlusCircle, Boxes } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useTripStore } from '@/stores/tripStore';
import { useUiStore } from '@/stores/uiStore';
import type { GenericRecord, ShoppingItem } from '@/types';
import { Badge, Button, Card, ChipGroup, ConfirmDialog, EmptyState, Fab, Field, Input, Modal, Spinner, Stepper, TextArea, ListSkeleton } from '@/components/ui/Primitives';
import { CurrencyPicker, StorePicker } from '@/components/ui/Pickers';
import { fmt, isTrue, parseNumInput } from '@/lib/utils';
import { waShare, purchaseUpdateMessage } from '@/lib/wa';

interface Group extends GenericRecord { name_en: string; name_ar: string }

export default function ShoppingPage() {
  const t = useT();
  const trip = useTripStore((s) => s.activeTrip);
  const { lang, showToast } = useUiStore();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tab, setTab] = useState<'wishlist' | 'cart' | 'purchased'>('wishlist');
  const [groupBy, setGroupBy] = useState<'store' | 'person'>('person');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [actualPricePrompt, setActualPricePrompt] = useState<ShoppingItem | null>(null);
  const [actualPriceInput, setActualPriceInput] = useState('');
  const [actualCurrencyInput, setActualCurrencyInput] = useState('');
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const [editingVirtual, setEditingVirtual] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({ item: '', group_name: 'Personal', qty: 1, est_price: '', actual_price: '', currency: '', actual_currency: '', store: '', notes: '', request_id: '', client_order_id: '', gift_id: '' });

  const load = useCallback(async () => {
    if (!trip) return;
    setLoading(true);
    const [itemsRes, groupsRes] = await Promise.all([
      api<any>('shopping.list', { trip_id: trip.id }),
      api<Group[]>('groups.list', {})
    ]);
    
    if (itemsRes.ok && itemsRes.data) {
      const data = itemsRes.data;
      const rawItems: ShoppingItem[] = Array.isArray(data) ? data : (data.items || []);
      const requests: any[] = data.requests || [];
      const orders: any[] = data.client_orders || [];
      const gifts: any[] = data.gifts || [];
      
      const linkedReqs = new Set(rawItems.map(i => i.request_id ? String(i.request_id) : null).filter(Boolean));
      const linkedOrders = new Set(rawItems.map(i => i.client_order_id ? String(i.client_order_id) : null).filter(Boolean));
      const linkedGifts = new Set(rawItems.map(i => (i as any).gift_id ? String((i as any).gift_id) : null).filter(Boolean));
      
      const pendingReqs = requests.filter(r => !linkedReqs.has(String(r.id)) && ['planned','searching'].includes(String(r.status)));
      const pendingOrders = orders.filter(co => !linkedOrders.has(String(co.id)) && ['new','searching'].includes(String(co.status)));
      const pendingGifts = gifts.filter(g => !linkedGifts.has(String(g.id)) && g.delivery_status !== 'purchased' && g.delivery_status !== 'delivered');
      
      
      const virtualItems = [
        ...pendingReqs.map(r => ({
          id: 'REQ_' + r.id, trip_id: r.trip_id,
          request_id: r.id, item: r.item_name, qty: 1,
          currency: trip?.base_currency || 'EGP', actual_currency: trip?.currency_code || 'USD',
          requester: r.requester_name, requester_whatsapp: r.requester_whatsapp,
          is_virtual: true, source: 'request', requester_user_id: r.requester_user_id, profile_id: r.profile_id
        } as unknown as ShoppingItem)),
        ...pendingOrders.map(co => ({
          id: 'ORD_' + co.id, trip_id: co.trip_id,
          client_order_id: co.id, item: co.item_name, qty: 1,
          currency: trip?.base_currency || 'EGP', actual_currency: trip?.currency_code || 'USD',
          requester: co.customer_name, requester_whatsapp: co.customer_whatsapp,
          is_virtual: true, source: 'order'
        } as unknown as ShoppingItem)),
        ...pendingGifts.map(g => ({
          id: 'GFT_' + g.id, trip_id: g.trip_id,
          gift_id: g.id, item: g.item, qty: g.qty, est_price: g.est_cost,
          currency: trip?.base_currency || 'EGP', actual_currency: trip?.currency_code || 'USD',
          requester: g.recipient || g.requested_by, requester_whatsapp: '',
          group_name: 'Gifts',
          is_virtual: true, source: 'gift'
        } as unknown as ShoppingItem))
      ];
      setItems([...virtualItems, ...rawItems]);
    }
    if (groupsRes.ok && Array.isArray(groupsRes.data)) setGroups(groupsRes.data);
    setLoading(false);
  }, [trip]);
  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setForm({ item: '', group_name: groups[0]?.name_en || 'Personal', qty: 1, est_price: '', actual_price: '', currency: trip?.base_currency || 'EGP', actual_currency: trip?.currency_code || 'USD', store: '', notes: '', request_id: '', client_order_id: '', gift_id: '' });
    setEditing(null); setEditingVirtual(null); setModal(true);
  };
  const openVirtual = (s: any) => {
    setForm({ 
      item: s.item, group_name: s.group_name || groups[0]?.name_en || 'Personal', qty: s.qty || 1, est_price: s.est_price || '', actual_price: '', 
      currency: trip?.base_currency || 'EGP', actual_currency: trip?.currency_code || 'USD', 
      store: '', notes: '', request_id: s.request_id || '', client_order_id: s.client_order_id || '', gift_id: s.gift_id || '' 
    });
    setEditing(null); setEditingVirtual(s); setModal(true);
  };
  const openEdit = (s: any) => {
    if (s.is_virtual) { openVirtual(s); return; }
    setForm({ item: s.item, group_name: s.group_name, qty: Number(s.qty) || 1, est_price: String(s.est_price || ''), actual_price: String(s.actual_price || ''), currency: s.currency, actual_currency: s.actual_currency || trip?.currency_code || s.currency, store: s.store, notes: s.notes, request_id: s.request_id || '', client_order_id: s.client_order_id || '', gift_id: s.gift_id || '' });
    setEditing(s); setEditingVirtual(null); setModal(true);
  };

  const save = async () => {
    if (!form.item) { showToast(t('item') + ' ؟', 'error'); return; }
    setIsSaving(true);
    const isPurchased = form.actual_price !== '';
    const payload = editing ? { id: editing.id, patch: { ...form, purchased: isPurchased } } : { ...form, trip_id: trip!.id, purchased: isPurchased };
    
    // Optimistic Update
    const tempId = editing ? editing.id : `TEMP_${Date.now()}`;
    const optItem = (editing ? { ...editing, ...form, purchased: isPurchased } : { ...form, id: tempId, trip_id: trip!.id, purchased: isPurchased }) as unknown as ShoppingItem;
    setItems(prev => editing ? prev.map(i => i.id === editing.id ? optItem : i) : [...prev, optItem]);
    setModal(false);

    const res = await api(editing ? 'shopping.update' : 'shopping.create', payload);
    setIsSaving(false);
    if (res.ok) { 
      showToast(t('save') + ' ✓'); 
      if (res.data && (res.data as any).id && !editing) {
        setItems(prev => prev.map(i => i.id === tempId ? { ...optItem, ...(res.data as any) } : i));
      }
      setTimeout(() => void load(), 2000); 
    } else {
      showToast(res.error?.message || 'Error', 'error');
      // Revert on failure
      void load();
    }
  };

  const confirmPurchase = async () => {
    if (!actualPricePrompt) return;
    const sId = actualPricePrompt.id;
    const aPrice = actualPriceInput;
    const aCurr = actualCurrencyInput || actualPricePrompt.currency;
    setItems((prev) => prev.map((item) => item.id === sId ? { ...item, purchased: true, actual_price: Number(aPrice), actual_currency: aCurr } : item));
    setActualPricePrompt(null);
    api('shopping.markPurchased', { id: sId, actual_price: aPrice, actual_currency: aCurr }).then(() => load());
  };

  const moveToCart = async (s: ShoppingItem) => {
    if ((s as any).is_virtual) { openVirtual(s); return; }
    setItems((prev) => prev.map((item) => item.id === s.id ? { ...item, in_cart: true } : item));
    api('shopping.update', { id: s.id, patch: { in_cart: true } }).then(() => load());
  };

  const markDelivered = async (s: ShoppingItem) => { 
    if ((s as any).is_virtual) return;
    setItems((prev) => prev.map((item) => item.id === s.id ? { ...item, delivered: true } : item));
    const res = await api('shopping.markDelivered', { id: s.id });
    if (!res.ok) showToast('Error updating item', 'error');
  };

  const openWa = (s: any, e: any) => {
    e.stopPropagation();
    if (!s.requester_whatsapp) return;
    const num = String(s.requester_whatsapp).replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`مرحباً ${s.requester}، بخصوص طلبك (${s.item})... `);
    window.location.href = `https://wa.me/${num}?text=${msg}`;
  };

  const del = async () => { 
    if (deleteId) { 
      setIsDeleting(true);
      let res;
      if (deleteId.startsWith('REQ_')) {
        res = await api('requests.updateStatus', { id: deleteId.replace('REQ_', ''), status: 'requested' });
      } else if (deleteId.startsWith('ORD_')) {
        res = await api('clientOrders.update', { id: deleteId.replace('ORD_', ''), status: 'cancelled' });
      } else if (deleteId.startsWith('GFT_')) {
        if (!window.confirm('هذا العنصر مرتبط بقائمة الهدايا. هل تريد حذفه من الهدايا أيضاً؟ (إذا اخترت لا، فلن يتم حذفه)')) {
          setIsDeleting(false); setDeleteId(null); return;
        }
        res = await api('gifts.delete', { id: deleteId.replace('GFT_', '') });
      } else {
        res = await api('shopping.delete', { id: deleteId }); 
      }
      setIsDeleting(false);
      
      if (!res.ok) {
        const errorMsg = res.error?.message || JSON.stringify(res);
        showToast(`Backend Error: ${errorMsg}`, 'error');

      } else {
        setDeleteId(null); 
        // Optimistic UI update
        setItems(prev => prev.filter(i => i.id !== deleteId));
        
        // Delay full load to give CacheService time to invalidate across all nodes
        setTimeout(() => void load(), 2500); 
      }
    } 
  };

  const groupOpts = useMemo(() => groups.map((g) => ({ value: g.name_en, label: lang === 'ar' ? g.name_ar : g.name_en })), [groups, lang]);
  
  const { wishlistItems, cartItems, purchasedItems } = useMemo(() => ({
    wishlistItems: items.filter((s) => !isTrue(s.purchased) && !isTrue(s.in_cart)),
    cartItems: items.filter((s) => !isTrue(s.purchased) && isTrue(s.in_cart) && !(s as any).is_virtual),
    purchasedItems: items.filter((s) => isTrue(s.purchased) && !(s as any).is_virtual)
  }), [items]);

  const shown = tab === 'wishlist' ? wishlistItems : tab === 'cart' ? cartItems : purchasedItems;

  const grouped = useMemo(() => shown.reduce((acc, s) => {
    let key = 'Other';
    if (groupBy === 'store') {
      key = s.store ? String(s.store).trim() : 'Other Stores';
    } else {
      key = s.requester ? String(s.requester).trim() : 'بدون اسم (Unknown)';
    }
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<string, ShoppingItem[]>), [shown, groupBy]);

  const getRate = (fromCurr: string, toCurr: string) => {
    if (!fromCurr || !toCurr || fromCurr === toCurr) return 1;
    const rate = Number(trip?.snapshot_rate) || 1;
    if (fromCurr === trip?.currency_code && toCurr === trip?.base_currency) return rate;
    if (fromCurr === trip?.base_currency && toCurr === trip?.currency_code) return 1 / rate;
    return 1;
  };

  const totalEst = useMemo(() => wishlistItems.reduce((acc, s) => {
    const val = parseFloat(String(s.est_price)) || 0;
    const qty = Number(s.qty) || 1;
    return acc + (val * qty * getRate(s.currency || trip?.currency_code || 'USD', trip?.base_currency || 'EGP'));
  }, 0), [wishlistItems, trip]);

  const totalActual = useMemo(() => purchasedItems.reduce((acc, s) => {
    const val = parseFloat(String(s.actual_price)) || 0;
    const qty = Number(s.qty) || 1;
    return acc + (val * qty * getRate(s.actual_currency || trip?.currency_code || 'USD', trip?.currency_code || 'USD'));
  }, 0), [purchasedItems, trip]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 rise">
        <span className="icon-tile"><ShoppingBag size={20} /></span>
        <h1 className="font-display text-[22px] gold-text">{t('shopping')}</h1>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4 rise rise-1">
        <Card flat className="!p-3.5 text-center">
          <p className="text-[10px] text-zinc-500 mb-1">Total Estimated ({trip?.base_currency || 'EGP'})</p>
          <p className="font-display text-[18px] text-foreground">{fmt(totalEst)}</p>
        </Card>
        <Card flat className="!p-3.5 text-center">
          <p className="text-[10px] text-zinc-500 mb-1">Total Actual ({trip?.currency_code || 'USD'})</p>
          <p className="font-display text-[18px] gold-text">{fmt(totalActual)}</p>
        </Card>
      </div>
      
      <div className="flex items-center gap-2 mb-4 rise rise-2">
        <div className="flex-1">
          <ChipGroup value={tab} onChange={(v) => setTab(v as any)} 
            options={[{ value: 'wishlist', label: 'Wishlist' }, { value: 'cart', label: 'Cart 🛒' }, { value: 'purchased', label: 'Purchased' }]} />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-full p-1 flex items-center shrink-0">
          <button onClick={() => setGroupBy('store')} className={`p-1.5 rounded-full transition ${groupBy === 'store' ? 'bg-royal-gold text-black' : 'text-zinc-500'}`}><Store size={14} /></button>
          <button onClick={() => setGroupBy('person')} className={`p-1.5 rounded-full transition ${groupBy === 'person' ? 'bg-royal-gold text-black' : 'text-zinc-500'}`}><Users size={14} /></button>
        </div>
      </div>

      {loading ? <ListSkeleton /> : shown.length === 0 ? <EmptyState imageSrc="/illustrations/empty-shopping.svg" /> : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)).map(([groupName, groupItems]) => (
            <div key={groupName}>
              <h3 className="text-[13px] font-semibold text-royal-gold/80 mb-2.5 px-2 flex items-center gap-2">
                {groupBy === 'store' ? <Store size={14} /> : <Users size={14} />} {groupName}
              </h3>
              <div className="space-y-2.5">
                {groupItems.map((s) => (
                  <Card key={s.id} flat className={`!p-3.5 ${(s as any).is_virtual ? 'border-dashed border-zinc-700 bg-zinc-900/50' : ''}`}>
                    <div className="flex items-center gap-3" onClick={() => openEdit(s)}>
                      <button onClick={(e) => { 
                        e.stopPropagation(); 
                        if ((s as any).is_virtual) { openVirtual(s); return; }
                        if (!isTrue(s.purchased) && !isTrue(s.in_cart)) { 
                          void moveToCart(s); 
                        } else if (!isTrue(s.purchased) && isTrue(s.in_cart)) { 
                          setActualPriceInput(String(s.est_price || '')); setActualCurrencyInput(trip?.currency_code || s.currency); setActualPricePrompt(s); 
                        } else if (!isTrue(s.delivered)) {
                          void markDelivered(s); 
                        }
                      }}
                        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition active:scale-90"
                        style={isTrue(s.delivered) ? { background: 'linear-gradient(135deg,#3B82F6,#0284C7)', color: '#000' }
                          : isTrue(s.purchased) ? { background: 'rgba(16,185,129,0.18)', color: '#34D399', border: '1px solid rgba(16,185,129,0.35)' }
                          : isTrue(s.in_cart) ? { background: 'rgba(59,130,246,0.18)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.35)' }
                          : (s as any).is_virtual ? { background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px border-dashed #D4AF37' }
                          : { border: '1.5px solid #2A2A36', color: 'transparent' }}>
                        {(s as any).is_virtual ? <PlusCircle size={14} /> 
                          : isTrue(s.delivered) ? <Truck size={14} /> 
                          : isTrue(s.purchased) ? <Check size={15} strokeWidth={3} /> 
                          : isTrue(s.in_cart) ? <Check size={15} strokeWidth={3} /> 
                          : <ShoppingCart size={13} strokeWidth={2.5} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[14px] truncate ${isTrue(s.delivered) ? 'text-zinc-500 line-through' : 'text-foreground'}`}>
                          {s.item} {Number(s.qty) > 1 && <span className="text-zinc-500 text-[11px]">×{s.qty}</span>}
                          {(s as any).is_virtual && <span className="ml-2 text-[9px] bg-royal-gold/20 text-royal-gold px-1.5 py-0.5 rounded">Pending</span>}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate flex items-center gap-1">
                          {s.group_name || 'Request'}
                          {groupBy === 'store' && s.requester ? ' · ' + s.requester : ''}
                          {(s as any).requester_whatsapp && (
                            <button onClick={(e) => openWa(s, e)} className="text-emerald-500 hover:text-emerald-600 transition p-0.5 rounded-full bg-emerald-500/10 ml-1">
                              <MessageCircle size={10} />
                            </button>
                          )}
                        </p>
                      </div>
                      <div className="text-end shrink-0">
                        {!(s as any).is_virtual && (
                          <p className="font-display text-[13px] text-foreground">
                            {fmt(isTrue(s.purchased) ? s.actual_price : s.est_price)} 
                            <span className="text-[9px] text-zinc-500 ml-1">{isTrue(s.purchased) ? (s.actual_currency || s.currency) : s.currency}</span>
                          </p>
                        )}
                        {isTrue(s.purchased) && (
                          <a href={waShare(purchaseUpdateMessage(s.item, isTrue(s.delivered) ? 'Delivered ✓' : 'Purchased ✓', trip?.name || ''))}
                            target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-400 mt-1"><MessageCircle size={11} />WA</a>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <Fab onClick={openCreate} />
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t('edit') : t('add')}>
        <div className="space-y-4">
          <Field label={t('item')}><Input value={form.item} onChange={(v) => setForm({ ...form, item: v })} /></Field>
          <Field label={t('group')}><ChipGroup value={form.group_name} onChange={(v) => setForm({ ...form, group_name: v })} options={groupOpts} /></Field>
          <div className="flex items-end gap-4">
            <Field label={t('quantity')}><Stepper value={form.qty} onChange={(n) => setForm({ ...form, qty: n })} /></Field>
            <div className="flex-1"><Field label={t('currency')}>
              <CurrencyPicker value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} title={t('currency')} extra={trip ? [trip.currency_code] : []} /></Field></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('est_price')}><Input type="text" inputMode="decimal" value={form.est_price} onChange={(v) => setForm({ ...form, est_price: parseNumInput(v) })} /></Field>
            <Field label={t('actual_price')}>
              <div className="flex gap-2">
                <Input type="text" inputMode="decimal" value={form.actual_price} onChange={(v) => setForm({ ...form, actual_price: parseNumInput(v) })} className="flex-1" />
                <div className="w-[85px]"><CurrencyPicker value={form.actual_currency} onChange={(v) => setForm({ ...form, actual_currency: v })} title={t('currency')} extra={trip ? [trip.currency_code] : []} /></div>
              </div>
            </Field>
          </div>
          <Field label={t('store')}>
            <StorePicker title={t('store')} value={form.store} onChange={(v) => setForm({ ...form, store: v })} />
          </Field>
          <Field label={t('notes_field')}><TextArea value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} rows={2} /></Field>
          <Button onClick={save} isLoading={isSaving} className="w-full"><Save size={17} />{t('save')}</Button>
          {editing && (isTrue(editing.purchased) || isTrue(editing.in_cart)) && (
            <Button variant="ghost" onClick={() => {
              setItems(prev => prev.map(i => i.id === editing.id ? { ...i, purchased: false, in_cart: false, delivered: false } as ShoppingItem : i));
              setModal(false);
              api('shopping.update', { id: editing.id, patch: { purchased: false, in_cart: false, delivered: false } }).then(() => void load());
            }} disabled={isSaving} className="w-full bg-zinc-800 text-white">
              <Boxes size={16} /> Return to Wishlist
            </Button>
          )}
          {editing && <Button variant="danger" onClick={() => { setModal(false); setDeleteId(editing.id); }} disabled={isSaving} className="w-full"><Trash2 size={16} />{t('delete')}</Button>}
          {editingVirtual && <Button variant="danger" onClick={() => { setModal(false); setDeleteId(editingVirtual.id); }} disabled={isSaving} className="w-full bg-zinc-900 text-rose-500 border border-rose-500/30"><Trash2 size={16} />Remove Request from List</Button>}
        </div>
      </Modal>

      <Modal open={!!actualPricePrompt} onClose={() => setActualPricePrompt(null)} title="Actual Price & Currency">
        <div className="space-y-4">
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400">Enter the final price you paid for: <strong className="text-foreground">{actualPricePrompt?.item}</strong></p>
          <div className="flex gap-3">
            <div className="flex-1">
              <Field label={t('actual_price')}>
                <Input type="text" inputMode="decimal" value={actualPriceInput} onChange={(v) => setActualPriceInput(parseNumInput(v))} autoFocus />
              </Field>
            </div>
            <div className="w-[100px]">
              <Field label={t('currency')}>
                <CurrencyPicker value={actualCurrencyInput} onChange={setActualCurrencyInput} title={t('currency')} extra={trip ? [trip.currency_code] : []} />
              </Field>
            </div>
          </div>
          <Button onClick={confirmPurchase} isLoading={isSaving} className="w-full"><Check size={17} /> Confirm Purchase</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onConfirm={del} onCancel={() => setDeleteId(null)} isLoading={isDeleting} />
    </div>
  );
}
