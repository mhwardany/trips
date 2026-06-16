'use client';

import { useEffect } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  const t = useT();

  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
        <ShieldAlert size={32} className="text-red-500 dark:text-red-400" />
      </div>
      <h2 className="text-xl font-bold mb-2 text-zinc-800 dark:text-zinc-100">{t('error_occurred') || 'An Error Occurred'}</h2>
      <p className="text-sm text-zinc-500 mb-8 max-w-xs">{error.message || 'Something went wrong while rendering the page. Please try again.'}</p>
      <button onClick={() => reset()} className="btn-primary w-full max-w-[200px] flex items-center justify-center gap-2">
        <RefreshCw size={18} />
        {t('retry') || 'Try Again'}
      </button>
    </div>
  );
}
