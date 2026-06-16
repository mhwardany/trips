'use client';

import { useEffect, useState } from 'react';
import { Plus, User as UserIcon, Lock, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import type { Profile } from '@/types';
import { Button, Card, Field, Input, Modal, Spinner } from '@/components/ui/Primitives';

export default function ProfileGate({ children }: { children: React.ReactNode }) {
  const t = useT();
  const { lang, showToast } = useUiStore();
  const { user } = useAuthStore();
  const { activeProfile, setProfile } = useProfileStore();
  
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', whatsapp: '', pin: '' });
  const [isSaving, setIsSaving] = useState(false);
  
  const [loginFor, setLoginFor] = useState<Profile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (user?.role !== 'family' || activeProfile) {
      setLoading(false);
      return;
    }
    
    // Load profiles
    api<Profile[]>('profiles.list', {}).then((res) => {
      if (res.ok) setProfiles(res.data);
      setLoading(false);
    });
  }, [user, activeProfile]);

  const handleAdd = async () => {
    if (!addForm.name) return showToast(lang === 'ar' ? 'الاسم مطلوب' : 'Name is required', 'error');
    if (addForm.pin.length !== 4) return showToast(lang === 'ar' ? 'الرمز يجب أن يكون 4 أرقام' : 'PIN must be 4 digits', 'error');
    
    setIsSaving(true);
    const res = await api<Profile>('profiles.create', addForm);
    setIsSaving(false);
    if (res.ok) {
      setProfiles([...profiles, res.data]);
      setIsAdding(false);
      setAddForm({ name: '', whatsapp: '', pin: '' });
      showToast(t('save') + ' ✓');
    } else {
      showToast(res.error?.message || 'Error', 'error');
    }
  };

  const handleLogin = async () => {
    if (!loginFor || pinInput.length !== 4) return;
    setIsLoggingIn(true);
    const res = await api<Profile>('profiles.login', { profile_id: loginFor.id, pin: pinInput });
    setIsLoggingIn(false);
    if (res.ok) {
      setProfile(res.data);
      setLoginFor(null);
      setPinInput('');
    } else {
      showToast(res.error?.message || 'Error', 'error');
    }
  };

  if (user?.role !== 'family' || activeProfile) {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="fixed inset-0 flex items-center justify-center bg-background"><Spinner /></div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-2">
          <h1 className="font-display text-3xl gold-text">
            {lang === 'ar' ? 'من يطلب الآن؟' : "Who's requesting?"}
          </h1>
          <p className="text-zinc-500 text-[14px]">
            {lang === 'ar' ? 'اختر ملفك الشخصي أو أضف واحداً جديداً' : 'Choose your profile or add a new one'}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {profiles.map(p => (
            <div key={p.id} className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => setLoginFor(p)}>
              <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent group-hover:border-royal-gold transition flex items-center justify-center shadow-sm">
                <span className="text-2xl font-display text-zinc-400 group-hover:text-royal-gold transition uppercase">
                  {p.name.charAt(0)}
                </span>
              </div>
              <span className="text-[13px] font-medium text-zinc-600 dark:text-zinc-300 group-hover:text-foreground transition">
                {p.name}
              </span>
            </div>
          ))}

          <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => setIsAdding(true)}>
            <div className="w-20 h-20 rounded-2xl bg-transparent border-2 border-dashed border-zinc-300 dark:border-zinc-700 group-hover:border-royal-gold transition flex items-center justify-center shadow-sm">
              <Plus className="text-zinc-400 group-hover:text-royal-gold transition" size={24} />
            </div>
            <span className="text-[13px] font-medium text-zinc-500 group-hover:text-foreground transition">
              {lang === 'ar' ? 'إضافة فرد' : 'Add Person'}
            </span>
          </div>
        </div>
      </div>

      <Modal open={isAdding} onClose={() => setIsAdding(false)} title={lang === 'ar' ? 'ملف شخصي جديد' : 'New Profile'}>
        <div className="space-y-4">
          <Field label={lang === 'ar' ? 'الاسم' : 'Name'}>
            <Input value={addForm.name} onChange={v => setAddForm({...addForm, name: v})} icon={<UserIcon size={16} />} />
          </Field>
          <Field label={lang === 'ar' ? 'رقم الواتساب (اختياري)' : 'WhatsApp Number (optional)'}>
            <Input value={addForm.whatsapp} onChange={v => setAddForm({...addForm, whatsapp: v})} inputMode="numeric" dir="ltr" />
          </Field>
          <Field label={lang === 'ar' ? 'رمز الدخول (4 أرقام)' : 'Internal PIN (4 digits)'}>
            <Input type="password" inputMode="numeric" maxLength={4} value={addForm.pin} onChange={v => setAddForm({...addForm, pin: v})} icon={<Lock size={16} />} className="text-center tracking-widest font-display text-lg" />
          </Field>
          <Button onClick={handleAdd} isLoading={isSaving} className="w-full">
            <Save size={18} /> {t('save')}
          </Button>
        </div>
      </Modal>

      <Modal open={!!loginFor} onClose={() => { setLoginFor(null); setPinInput(''); }} title={loginFor?.name || ''}>
        <div className="space-y-6 text-center">
          <p className="text-[14px] text-zinc-500">
            {lang === 'ar' ? 'الرجاء إدخال رمز الدخول الخاص بك' : 'Please enter your internal PIN'}
          </p>
          <Input 
            type="password" inputMode="numeric" maxLength={4} 
            value={pinInput} onChange={setPinInput} 
            className="text-center tracking-[1em] font-display text-2xl h-14" 
            autoFocus 
          />
          <Button onClick={handleLogin} isLoading={isLoggingIn} className="w-full h-12 text-lg">
            {lang === 'ar' ? 'دخول' : 'Enter'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
