'use client';
import { useState } from 'react';
import { Globe, KeyRound, Save, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { Button, Card, Field, Input, Segmented } from '@/components/ui/Primitives';

export default function SettingsPage() {
  const t = useT();
  const { lang, setLang, showToast } = useUiStore();
  const { user, setAuth, token } = useAuthStore();
  
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [whatsapp, setWhatsapp] = useState((user as any)?.whatsapp || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-3 rise">
          <span className="icon-tile"><SettingsIcon size={20} /></span>
          <h1 className="font-display text-[22px] gold-text">{t('settings')}</h1>
        </div>

        <Card className="space-y-3 rise rise-1">
          <p className="text-[12px] gold-text font-semibold flex items-center gap-1.5"><Globe size={13} />{t('language')}</p>
          <Segmented value={lang} onChange={(v) => setLang(v as 'en' | 'ar')}
            options={[{ value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]} />
        </Card>

        <Card className="space-y-4 rise rise-2">
          <p className="text-[12px] gold-text font-semibold flex items-center gap-1.5"><ShieldCheck size={13} /> Notifications (Beta)</p>
          <p className="text-[11px] text-zinc-400">Get notified when there are updates or requests.</p>
          <Button variant="ghost" className="w-full text-xs" onClick={async () => {
            const { requestPushPermission } = await import('@/lib/push');
            const granted = await requestPushPermission();
            if (granted) showToast('Push enabled ✓', 'success');
            else showToast('Push not supported or denied', 'error');
          }}>Enable Push Notifications</Button>
        </Card>

        <Card className="space-y-4 rise rise-3">
          <p className="text-[12px] gold-text font-semibold flex items-center gap-1.5"><ShieldCheck size={13} />{t('change_pin')}</p>
          <Field label={t('current_pin')}>
            <Input type="password" inputMode="numeric" maxLength={6} value={currentPin} onChange={setCurrentPin} icon={<KeyRound size={15} />} />
          </Field>
          <Field label={t('new_pin')}>
            <Input type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={setNewPin} icon={<KeyRound size={15} />} />
          </Field>
          <Button onClick={changePin} isLoading={isSaving} className="w-full"><Save size={17} />{t('save')}</Button>
        </Card>

        <Card className="space-y-4 rise rise-3">
          <p className="text-[12px] gold-text font-semibold flex items-center gap-1.5"><ShieldCheck size={13} />{lang === 'ar' ? 'الملف الشخصي' : 'Profile'}</p>
          <Field label={lang === 'ar' ? 'رقم الواتساب (بالكود الدولي)' : 'WhatsApp Number (with country code)'}>
            <Input type="text" inputMode="numeric" value={whatsapp} onChange={setWhatsapp} placeholder={lang === 'ar' ? 'مثال: 201001234567' : 'e.g. 201001234567'} dir="ltr" />
          </Field>
          <Button onClick={saveProfile} isLoading={isSavingProfile} className="w-full"><Save size={17} />{t('save')}</Button>
        </Card>
      </div>
    </AppShell>
  );
}
