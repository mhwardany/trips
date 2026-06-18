'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Save, Star, Trash2, UtensilsCrossed, Coffee, Building2, Landmark, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useTripStore } from '@/stores/tripStore';
import { useUiStore } from '@/stores/uiStore';
import type { GenericRecord } from '@/types';
import { Button, Card, ChipGroup, ConfirmDialog, EmptyState, Fab, Field, Input, Modal, Spinner, StarRating, TextArea, ListSkeleton } from '@/components/ui/Primitives';
import 'leaflet/dist/leaflet.css';

const CAT_OPTS = [
  { value: 'restaurants', label: 'Restaurants', icon: <UtensilsCrossed size={14} /> },
  { value: 'cafes', label: 'Cafés', icon: <Coffee size={14} /> },
  { value: 'malls', label: 'Malls', icon: <Building2 size={14} /> },
  { value: 'attractions', label: 'Attractions', icon: <Landmark size={14} /> }
];

export default function PlacesPage() {
  const t = useT();
  const trip = useTripStore((s) => s.activeTrip);
  const showToast = useUiStore((s) => s.showToast);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import('leaflet').Map | null>(null);
  const [items, setItems] = useState<GenericRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<GenericRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({ name: '', category: 'attractions', rating: 0, notes: '', map_url: '' });

  const load = useCallback(async () => {
    if (!trip) return;
    setLoading(true);
    const res = await api<GenericRecord[]>('places.list', { trip_id: trip.id });
    if (res.ok && Array.isArray(res.data)) setItems(res.data);
    setLoading(false);
  }, [trip]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!mapRef.current || mapInstance.current) return;
      const L = (await import('leaflet')).default;
      if (cancelled || !mapRef.current) return;
      const map = L.map(mapRef.current, { zoomControl: false }).setView([29.3759, 47.9774], 11);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© OSM © CARTO', maxZoom: 19 }).addTo(map);
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => { setPicked({ lat: e.latlng.lat, lng: e.latlng.lng }); setEditing(null); setForm({ name: '', category: 'attractions', rating: 0, notes: '', map_url: '' }); setModal(true); });
      mapInstance.current = map;
    })();
    return () => { cancelled = true; mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  useEffect(() => {
    void (async () => {
      const map = mapInstance.current;
      if (!map) return;
      const L = (await import('leaflet')).default;
      const icon = L.divIcon({ className: '', html: '<div style="width:14px;height:14px;border-radius:50%;background:#2563EB;border:2px solid #07070B;box-shadow:0 0 10px #2563EB"></div>' });
      const group: import('leaflet').Marker[] = [];
      items.forEach((p) => {
        const lat = Number(p.lat), lng = Number(p.lng);
        if (!lat && !lng) return;
        group.push(L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<b>${String(p.name)}</b><br>${String(p.category)}`));
      });
      if (group.length) map.fitBounds(L.featureGroup(group).getBounds().pad(0.3));
    })();
  }, [items]);

  const save = async () => {
    if (!form.name) { showToast(t('name') + ' ؟', 'error'); return; }
    setIsSaving(true);
    const payload = editing ? { id: editing.id, patch: form } : { ...form, trip_id: trip!.id, lat: picked?.lat || 0, lng: picked?.lng || 0 };
    const res = await api(editing ? 'places.update' : 'places.create', payload);
    setIsSaving(false);
    if (res.ok) { showToast(t('save') + ' ✓'); setModal(false); setPicked(null); setEditing(null); void load(); }
  };
  const del = async () => { 
    if (deleteId) { 
      setIsDeleting(true);
      await api('places.delete', { id: deleteId }); 
      setIsDeleting(false);
      setDeleteId(null); 
      void load(); 
    } 
  };

  const openCreate = () => {
    setPicked(null);
    setEditing(null);
    setForm({ name: '', category: 'attractions', rating: 0, notes: '', map_url: '' });
    setModal(true);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 rise">
        <span className="icon-tile"><MapPin size={20} /></span>
        <h1 className="font-display text-[22px] gold-text">{t('places')}</h1>
      </div>
      <p className="text-[11px] text-zinc-500 mb-3 ps-1 rise rise-1">{t('tap_map_hint')}</p>
      <div ref={mapRef} className="h-60 rounded-3xl border border-royal-gold/15 mb-4 z-0 rise rise-1" />
      {loading ? <ListSkeleton /> : items.length === 0 ? <EmptyState imageSrc="/illustrations/empty-places.svg" /> : (
        <div className="space-y-2.5">
          {items.map((p) => {
            const opt = CAT_OPTS.find((o) => o.value === p.category);
            return (
              <Card key={p.id} flat className="!p-3.5">
                <div className="flex items-center gap-3" onClick={() => { setEditing(p); setForm({ name: String(p.name||''), category: String(p.category||'attractions'), rating: Number(p.rating||0), notes: String(p.notes||''), map_url: String(p.map_url||'') }); setModal(true); }}>
                  <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-royal-gold shrink-0">
                    {opt?.icon || <MapPin size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-foreground font-semibold truncate">{String(p.name)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {Number(p.rating) > 0 && <span className="flex items-center text-[11px] text-amber-400 font-medium"><Star size={10} className="fill-amber-400 mr-0.5" />{p.rating}</span>}
                      {String(p.notes) && <span className="text-[11px] text-zinc-500 truncate max-w-[120px]">{String(p.notes)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {(Boolean(p.map_url) || (Number(p.lat) && Number(p.lng))) && (
                      <button onClick={(e) => { e.stopPropagation(); window.open(String(p.map_url) || `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`, '_blank'); }} className="icon-tile !w-8 !h-8 !bg-zinc-800">
                        <ExternalLink size={14} className="text-royal-gold" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }} className="icon-tile !w-8 !h-8 !text-red-400 !bg-red-500/10"><Trash2 size={14} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Fab onClick={openCreate} />
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t('edit') : t('add')}>
        <div className="space-y-4">
          <Field label={t('name')}><Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} autoFocus /></Field>
          <Field label="Google Maps Link (Optional)"><Input value={form.map_url} onChange={(v) => setForm({ ...form, map_url: v })} placeholder="https://goo.gl/maps/..." /></Field>
          <Field label={t('category')}><ChipGroup value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CAT_OPTS} /></Field>
          <Field label={t('rating')}><div className="flex justify-center py-2"><StarRating value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} /></div></Field>
          <Field label={t('notes')}><TextArea value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} /></Field>
          <Button onClick={save} isLoading={isSaving} className="w-full"><Save size={17} />{t('save')}</Button>
          {editing && <Button variant="danger" onClick={() => { setModal(false); setDeleteId(editing.id); }} disabled={isSaving} className="w-full"><Trash2 size={16} />{t('delete')}</Button>}
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onConfirm={del} onCancel={() => setDeleteId(null)} isLoading={isDeleting} />
    </div>
  );
}
