'use client';
import { useCallback, useEffect, useState } from 'react';
import { Crown, Mail, Save, ShieldOff, ShieldCheck, User, UserCog, KeyRound, Trash2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import type { GenericRecord, Profile } from '@/types';
import { Badge, Button, Card, Fab, Field, Input, Modal, Segmented, Spinner } from '@/components/ui/Primitives';
import { ListPicker } from '@/components/ui/Pickers';

const ROLE_OPTS = [
  { value: 'owner', label: 'Owner', icon: <Crown size={15} /> },
  { value: 'manager', label: 'Manager', icon: <UserCog size={15} /> },
  { value: 'family', label: 'Family', icon: <User size={15} /> }
];

export default function UsersPage() {
  const t = useT();
  const me = useAuthStore((s) => s.user);
  const { lang, showToast } = useUiStore();
  const [tab, setTab] = useState<'users'|'profiles'>('users');
  const [items, setItems] = useState<GenericRecord[]>([]);
  const [profiles, setProfiles] = useState<GenericRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<GenericRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ username: '', display_name: '', role: 'family', pin: '', email: '' });

  const load = useCallback(async () => {
    setLoading(true);
    if (tab === 'users') {
      const res = await api<GenericRecord[]>('users.list', {});
      if (res.ok && Array.isArray(res.data)) setItems(res.data);
    } else {
      const res = await api<GenericRecord[]>('profiles.adminList', {});
      if (res.ok && Array.isArray(res.data)) setProfiles(res.data);
    }
    setLoading(false);
  }, [tab]);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!editing && (!form.username || form.pin.length !== 6)) { showToast('username + 6-digit PIN', 'error'); return; }
    setIsSaving(true);
    const res = editing
      ? await api('users.update', { id: editing.id, display_name: form.display_name, role: form.role, email: form.email, ...(form.pin.length === 6 ? { pin: form.pin } : {}) })
      : await api('users.create', form);
    setIsSaving(false);
    if (res.ok) { showToast(t('save') + ' ✓'); setModal(false); void load(); }
    else showToast(res.error?.message || 'Error', 'error');
  };

  const disable = async (id: string) => { const res = await api('users.disable', { id }); if (res.ok) void load(); else showToast(res.error?.message || 'Error', 'error'); };
  const enable = async (id: string) => { const res = await api('users.enable', { id }); if (res.ok) void load(); else showToast(res.error?.message || 'Error', 'error'); };

  const delProfile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    const res = await api('profiles.adminDelete', { id });
    if (res.ok) { showToast('Deleted'); void load(); } else { showToast(res.error?.message || 'Error', 'error'); }
  };

  return (
    <AppShell>
      <div className="pt-1">
        <div className="flex items-center gap-3 mb-4 rise">
          <span className="icon-tile"><Crown size={20} /></span>
          <h1 className="font-display text-[22px] gold-text">{t('users')}</h1>
        </div>
        
        <div className="mb-4">
          <Segmented value={tab} onChange={(v) => setTab(v as any)} options={[
            { value: 'users', label: t('users') },
            { value: 'profiles', label: lang === 'ar' ? 'العائلة' : 'Family' }
          ]} />
        </div>

        {loading ? <Spinner /> : (
          <div className="space-y-2.5">
            {tab === 'users' ? items.map((u) => (
              <Card key={u.id} flat className="!p-3.5">
                <div className="flex items-center gap-3">
                  <span className="icon-tile">{ROLE_OPTS.find((r) => r.value === u.role)?.icon || <User size={16} />}</span>
                  <div className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => { setEditing(u); setForm({ username: String(u.username), display_name: String(u.display_name), role: String(u.role), pin: '', email: String(u.email || '') }); setModal(true); }}>
                    <p className="text-[14px] text-foreground truncate">{String(u.display_name)} <span className="text-zinc-500 text-[11px]">@{String(u.username)}</span></p>
                    <p className="text-[11px] mt-1 flex items-center gap-1.5">
                      <Badge color={u.role === 'owner' ? 'gold' : u.role === 'manager' ? 'green' : 'muted'}>{String(u.role)}</Badge>
                      {u.status === 'disabled' && <Badge color="red">disabled</Badge>}
                    </p>
                  </div>
                  {u.id !== me?.id && (
                    u.status === 'active' ? (
                      <button onClick={(e) => { e.stopPropagation(); disable(String(u.id)); }} className="icon-tile !w-10 !h-10 !text-red-400 !border-red-500/25 shrink-0"><ShieldOff size={15} /></button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); enable(String(u.id)); }} className="icon-tile !w-10 !h-10 !text-green-400 !border-green-500/25 shrink-0"><ShieldCheck size={15} /></button>
                    )
                  )}
                </div>
              </Card>
            )) : profiles.map((p) => (
              <Card key={p.id} flat className="!p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-display uppercase">{String(p.name).charAt(0)}</div>
                  <div>
                    <p className="text-[14px] text-foreground font-medium">{String(p.name)}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Family Account: {String(p.family_name)} {Boolean(p.whatsapp) && `• WA: ${String(p.whatsapp)}`}</p>
                  </div>
                </div>
                <button onClick={() => delProfile(String(p.id))} className="icon-tile !w-10 !h-10 !text-red-400 !border-red-500/25 shrink-0">
                  <Trash2 size={15} />
                </button>
              </Card>
            ))}
          </div>
        )}
        {tab === 'users' && <Fab onClick={() => { setEditing(null); setForm({ username: '', display_name: '', role: 'family', pin: '', email: '' }); setModal(true); }} />}
        <Modal open={modal} onClose={() => setModal(false)} title={editing ? t('edit') : t('add')}>
          <div className="space-y-4">
            {!editing && <Field label={t('username')}><Input value={form.username} onChange={(v) => setForm({ ...form, username: v.toLowerCase() })} icon={<User size={15} />} /></Field>}
            <Field label={t('name')}><Input value={form.display_name} onChange={(v) => setForm({ ...form, display_name: v })} /></Field>
            <Field label={t('role')}><ListPicker value={form.role} title={t('role')} onChange={(v) => setForm({ ...form, role: v })} options={ROLE_OPTS} /></Field>
            <Field label="Email (notifications)"><Input value={form.email} onChange={(v) => setForm({ ...form, email: v })} icon={<Mail size={15} />} /></Field>
            <Field label={editing ? t('new_pin') + ' (optional)' : t('pin')}>
              <Input type="password" inputMode="numeric" maxLength={6} value={form.pin} onChange={(v) => setForm({ ...form, pin: v })} icon={<KeyRound size={15} />} />
            </Field>
            <Button onClick={save} isLoading={isSaving} className="w-full"><Save size={17} />{t('save')}</Button>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
