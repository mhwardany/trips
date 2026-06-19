'use client';
import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LayoutDashboard, Wallet, MapPin, Boxes, Settings as SettingsIcon, Search, CloudOff, RefreshCw, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTripStore } from '@/stores/tripStore';
import { useUiStore } from '@/stores/uiStore';
import { useSyncStore } from '@/stores/syncStore';
import { useT } from '@/lib/i18n';
import { initSyncListeners } from '@/lib/offlineQueue';
import { cn, formatDateLocal } from '@/lib/utils';
import { hapticLight } from '@/lib/haptics';
import { JoyIcon, type JoyColor } from '@/components/ui/JoyIcon';
import ProfileGate from '@/components/auth/ProfileGate';

const NAV: { href: string; key: string; Icon: any; color: JoyColor }[] = [
  { href: '/trip/', key: 'dashboard', Icon: LayoutDashboard, color: 'gold' },
  { href: '/trip/shopping/', key: 'shopping', Icon: ShoppingBag, color: 'coral' },
  { href: '/trip/finances/', key: 'finances', Icon: Wallet, color: 'emerald' },
  { href: '/trip/explore/', key: 'places', Icon: MapPin, color: 'amethyst' },
  { href: '/settings/', key: 'settings', Icon: SettingsIcon, color: 'ocean' }
];

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.user?.role);
  const trip = useTripStore((s) => s.activeTrip);
  const lang = useUiStore((s) => s.lang);
  const { online, pending, setOnline, refreshCount } = useSyncStore();
  const t = useT();

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    initSyncListeners();
    refreshCount();
    const update = () => setOnline(navigator.onLine);
    update();
    const handleOnline = () => {
      update();
      useUiStore.getState().showToast(t('online_restored') || 'Internet connection restored', 'success');
    };
    const handleOffline = () => {
      update();
      useUiStore.getState().showToast(t('offline_mode') || 'You are offline. Changes will be saved locally.', 'error');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    

    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [refreshCount, setOnline, t]);

  useEffect(() => {
    if (!token) { router.replace('/'); return; }
    if (!trip && pathname?.startsWith('/trip')) router.replace('/trips/');
    
    if (role === 'family') {
      const blocked = ['/budget', '/expenses', '/shopping', '/gifts', '/analytics', '/receipts', '/planner'];
      if (blocked.some(b => pathname?.includes(b))) {
        router.replace('/trip/');
      }
    }
  }, [token, role, trip, pathname, router]);

  if (!token) return null;

  return (
    <div className="min-h-screen pb-28 max-w-2xl mx-auto">
      {(!online || pending > 0) && (
        <div className="sticky top-0 z-40 flex items-center justify-center gap-2 text-amber-400 text-[12px] py-2 px-4"
          style={{ background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
          {!online ? <CloudOff size={13} /> : <RefreshCw size={13} className="animate-spin" />}
          {!online ? t('offline') : `${pending} ${t('pending_sync')}`}
        </div>
      )}
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {pathname !== '/trip/' && pathname !== '/trips/' && (
            <button onClick={() => {
              if (window.history.length > 2) router.back();
              else router.push('/trip/');
            }} className="p-1 -ml-2 text-zinc-400 hover:text-white transition active:scale-95 shrink-0">
              {lang === 'ar' ? <ChevronRight size={26} /> : <ChevronLeft size={26} />}
            </button>
          )}
          <Link href={trip ? "/trip/" : "/trips/"} className="min-w-0">
            {trip ? (
              <>
                <p className="font-display text-[17px] gold-text truncate leading-tight">{trip.name}</p>
                <p className="text-[11px] text-zinc-500">{trip.country} · {formatDateLocal(trip.depart_date)}</p>
              </>
            ) : <p className="text-[13px] text-zinc-500">{t('select_trip')}</p>}
          </Link>
        </div>
        <Link href="/search/"><JoyIcon icon={Search} color="coral" size="sm" className="rounded-full" /></Link>
      </header>
      <main className="px-4">
        <ProfileGate>{children}</ProfileGate>
      </main>
      
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe pt-2 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-2xl border-t border-black/5 dark:border-white/5 flex justify-center">
        <div className="flex items-center w-full max-w-md px-2 pb-2">
          {NAV.filter(n => role !== 'family' || ['dashboard', 'requests', 'settings'].includes(n.key)).map(({ href, key, Icon, color }) => {
            const active = href === '/trip/' ? pathname === '/trip' || pathname === '/trip/' : pathname?.startsWith(href.slice(0, -1));
            return (
              <Link key={href} href={href} onClick={() => hapticLight()} className="relative flex-1 py-1 flex flex-col items-center gap-1 tap-highlight-transparent z-10">
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {active ? (
                  <JoyIcon icon={Icon} color={color} size="sm" className="!w-8 !h-8 !rounded-full shadow-md" />
                ) : (
                  <Icon size={22} className="text-zinc-500 dark:text-zinc-400 mt-1" strokeWidth={1.8} />
                )}
                <span className={cn('text-[10px] font-medium transition-colors duration-300', active ? 'gold-text' : 'text-zinc-500')}>{t(key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
