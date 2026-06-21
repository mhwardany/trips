'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, Globe, KeyRound, Save, Settings as SettingsIcon, ShieldCheck, LogOut, ChevronRight, Crown } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { Button, Card, Field, Input, Segmented } from '@/components/ui/Primitives';
import { SECTION_ICONS } from '@/lib/icons';

const ADMIN_SECTIONS: Record<string, { href: string; roles?: string[] }> = {
  reports: { href: '/trip/reports/', roles: ['owner', 'manager'] },
  analytics: { href: '/trip/analytics/' },
  users: { href: '/admin/users/', roles: ['owner'] },
};

export default function SettingsPage() {
  const t = useT();
  const router = useRouter();
  const { lang, setLang, showToast } = useUiStore();
  const { user, setAuth, token, clear } = useAuthStore();
  const role = user?.role;
  
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [whatsapp, setWhatsapp] = useState((user as any)?.whatsapp || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const [geminiKey, setGeminiKey] = useState('');
  
  const logout = async () => { await api('auth.logout', { token }); clear(); router.replace('/'); };
  const initials = (user?.display_name || 'U').slice(0, 1).toUpperCase();

  const saveGeminiKey = async () => {
    setIsSaving(true);
    const res = await api('settings.setKey', { key: geminiKey });
    setIsSaving(false);
    if (res.ok) { showToast(t('save') + ' ✓'); setGeminiKey(''); }
    else showToast(res.error?.message || 'Error', 'error');
  };

  const changePin = async () => {
    if (newPin.length !== 6) { showToast(t('new_pin') + ' = 6', 'error'); return; }
    setIsSaving(true);
    const res = await api('auth.changePin', { current_pin: currentPin, new_pin: newPin });
    setIsSaving(false);
    if (res.ok) { showToast(t('save') + ' ✓'); setCurrentPin(''); setNewPin(''); }
    else showToast(res.error?.message || 'Error', 'error');
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    const res = await api('auth.updateProfile', { whatsapp });
    setIsSavingProfile(false);
    if (res.ok) {
      if (user && token) {
        setAuth(token, { ...user, whatsapp } as any);
      }
      showToast(t('save') + ' ✓');
    } else {
      showToast(res.error?.message || 'Error', 'error');
    }
  };

  return (
    <AppShell>
      <div className="space-y-4 pt-1 pb-10">
        <Card className="flex items-center gap-3.5 rise">
          <div className="w-12 h-12 flex items-center justify-center rounded-[14px] bg-zinc-800 text-royal-gold font-display text-xl">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-[17px] gold-text truncate">{user?.display_name}</p>
            <p className="text-[11px] text-zinc-500 capitalize flex items-center gap-1">
              {user?.role === 'owner' && <Crown size={11} className="text-royal-gold" />}{t('role') || 'Role'}: {user?.role}
            </p>
          </div>
          <button onClick={logout} className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 active:scale-95 transition">
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </Card>

        <div className="space-y-2 rise rise-1">
          <Card className="p-0 overflow-hidden">
            <Link href="/trips/" className="flex items-center gap-3 p-3.5 border-b border-zinc-200 dark:border-zinc-800/40 last:border-0 active:bg-zinc-100 dark:active:bg-zinc-800/50 transition">
              {SECTION_ICONS['trips']}
              <span className="flex-1 text-[14px] text-foreground font-medium">{lang === 'ar' ? 'كل الرحلات (تغيير الرحلة)' : 'All Trips (Switch Trip)'}</span>
              <ChevronRight size={18} className="text-zinc-400 dark:text-zinc-600" />
            </Link>
          </Card>
        </div>

        {Object.keys(ADMIN_SECTIONS).filter(k => !ADMIN_SECTIONS[k].roles || ADMIN_SECTIONS[k].roles?.includes(user?.role || '')).length > 0 && (
          <div className="space-y-2 rise rise-1">
            <h3 className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider px-2">{t('management') || 'Management & Analytics'}</h3>
            <Card className="p-0 overflow-hidden">
              {Object.keys(ADMIN_SECTIONS).filter(k => !ADMIN_SECTIONS[k].roles || ADMIN_SECTIONS[k].roles?.includes(user?.role || '')).map((k, i) => (
                <Link key={k} href={ADMIN_SECTIONS[k].href} className="flex items-center gap-3 p-3.5 border-b border-zinc-200 dark:border-zinc-800/40 last:border-0 active:bg-zinc-100 dark:active:bg-zinc-800/50 transition">
                  {SECTION_ICONS[k]}
                  <span className="flex-1 text-[14px] text-foreground font-medium">{t(k) || k}</span>
                  <ChevronRight size={18} className="text-zinc-400 dark:text-zinc-600" />
                </Link>
              ))}
            </Card>
          </div>
        )}

        <div className="space-y-2 rise rise-2">
          <h3 className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider px-2">{t('settings')}</h3>
          
          <Card className="space-y-3">
            <p className="text-[12px] gold-text font-semibold flex items-center gap-1.5"><Globe size={13} />{t('language')}</p>
            <Segmented value={lang} onChange={(v) => setLang(v as 'en' | 'ar')}
              options={[{ value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]} />
          </Card>

          <Card className="space-y-4">
            <p className="text-[12px] gold-text font-semibold flex items-center gap-1.5"><ShieldCheck size={13} /> Notifications (Beta)</p>
            <p className="text-[11px] text-zinc-400">Get notified when there are updates or requests.</p>
            <Button variant="ghost" className="w-full text-xs" onClick={async () => {
              const { requestPushPermission } = await import('@/lib/push');
              const granted = await requestPushPermission();
              if (granted) showToast('Push enabled ✓', 'success');
              else showToast('Push not supported or denied', 'error');
            }}>Enable Push Notifications</Button>
          </Card>

          {role === 'owner' && (
            <Card className="space-y-4">
              <p className="text-[12px] gold-text font-semibold flex items-center gap-1.5"><Bot size={13} /> Gemini AI Settings</p>
              <p className="text-[11px] text-zinc-400">Add a Gemini API key to enable Smart OCR for receipt line items.</p>
              <Field label="Gemini API Key">
                <Input type="password" value={geminiKey} onChange={setGeminiKey} icon={<KeyRound size={15} />} placeholder="AIzaSy..." />
              </Field>
              <Button onClick={saveGeminiKey} isLoading={isSaving} className="w-full" variant="ghost">Save API Key</Button>
            </Card>
          )}

          <Card className="space-y-4">
            <p className="text-[12px] gold-text font-semibold flex items-center gap-1.5"><ShieldCheck size={13} />{t('change_pin')}</p>
            <Field label={t('current_pin')}>
              <Input type="password" inputMode="numeric" maxLength={6} value={currentPin} onChange={setCurrentPin} icon={<KeyRound size={15} />} />
            </Field>
            <Field label={t('new_pin')}>
              <Input type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={setNewPin} icon={<KeyRound size={15} />} />
            </Field>
            <Button onClick={changePin} isLoading={isSaving} className="w-full"><Save size={17} />{t('save')}</Button>
          </Card>

          <Card className="space-y-4">
            <p className="text-[12px] gold-text font-semibold flex items-center gap-1.5"><ShieldCheck size={13} />{lang === 'ar' ? 'الملف الشخصي' : 'Profile'}</p>
            <Field label={lang === 'ar' ? 'رقم الواتساب (بالكود الدولي)' : 'WhatsApp Number (with country code)'}>
              <Input type="text" inputMode="numeric" value={whatsapp} onChange={setWhatsapp} placeholder={lang === 'ar' ? 'مثال: 201001234567' : 'e.g. 201001234567'} dir="ltr" />
            </Field>
            <Button onClick={saveProfile} isLoading={isSavingProfile} className="w-full"><Save size={17} />{t('save')}</Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
