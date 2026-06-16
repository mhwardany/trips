'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Delete, Plane, User } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { useT } from '@/lib/i18n';
import type { User as TUser } from '@/types';
import { cn } from '@/lib/utils';

const USERS = [
  { username: 'wardany', label: 'Wardany', ar: 'الورداني' },
  { username: 'rani', label: 'Rani', ar: 'راني' },
  { username: 'family', label: 'Family', ar: 'العائلة' }
];

export default function LoginPage() {
  const router = useRouter();
  const t = useT();
  const { token, setAuth } = useAuthStore();
  const { lang, setLang, showToast } = useUiStore();
  const [username, setUsername] = useState('wardany');
  const [custom, setCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (token) router.replace('/trips/'); }, [token, router]);
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const activeUser = custom ? customName.toLowerCase().trim() : username;

  const submit = async (fullPin: string) => {
    if (!activeUser || fullPin.length !== 6) return;
    setBusy(true);
    const res = await api<{ token: string; user: TUser }>('auth.login', { username: activeUser, pin: fullPin, device: navigator.userAgent.slice(0, 80) });
    setBusy(false);
    if (res.ok && res.data) { setAuth(res.data.token, res.data.user); router.replace('/trips/'); }
    else { showToast(res.error?.message || 'Login failed', 'error'); setPin(''); }
  };

  const press = (d: string) => {
    if (busy || pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 6) void submit(next);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 max-w-md mx-auto">
      <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
        className="absolute top-6 end-6 chip">{lang === 'en' ? 'العربية' : 'English'}</button>

      <div className="icon-tile !w-[72px] !h-[72px] !rounded-[24px] mb-5 rise"><Plane size={32} /></div>
      <h1 className="font-display text-[32px] gold-text rise rise-1">{t('app_name')}</h1>
      <p className="text-zinc-600 text-[11px] mb-8 tracking-[0.35em] uppercase rise rise-2">Enterprise</p>

      <div className="flex gap-2 mb-7 rise rise-2">
        {USERS.map((u) => (
          <button key={u.username} onClick={() => { setUsername(u.username); setCustom(false); setPin(''); }}
            className={cn('chip', !custom && username === u.username && 'chip-on')}>
            <User size={13} />{lang === 'ar' ? u.ar : u.label}
          </button>
        ))}
        <button onClick={() => { setCustom(true); setPin(''); }} className={cn('chip', custom && 'chip-on')}>…</button>
      </div>
      {custom && (
        <input className="input-luxe mb-6 text-center max-w-[260px]" value={customName}
          onChange={(e) => setCustomName(e.target.value)} placeholder={t('username')} />
      )}

      <div className="flex gap-3.5 mb-8 rise rise-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-3.5 h-3.5 rounded-full transition-all duration-200"
            style={i < pin.length
              ? { background: 'linear-gradient(135deg,#2563EB,#06B6D4)', boxShadow: '0 0 12px rgba(37, 99, 235,0.5)' }
              : { border: '1.5px solid var(--line)' }} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] rise rise-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((d, i) => (
          <button key={i} disabled={!d || busy}
            onClick={() => (d === 'del' ? setPin(pin.slice(0, -1)) : press(d))}
            className={cn('h-[68px] rounded-[22px] font-display text-[22px] text-foreground transition active:scale-90 flex items-center justify-center',
              !d && 'opacity-0 pointer-events-none')}
            style={d ? { background: 'var(--surface)', border: '1px solid var(--line)' } : undefined}>
            {d === 'del' ? <Delete size={22} className="text-zinc-500" /> : d}
          </button>
        ))}
      </div>
      {busy && <p className="text-royal-goldsoft text-xs mt-7 animate-pulse">{t('loading')}</p>}
    </div>
  );
}
