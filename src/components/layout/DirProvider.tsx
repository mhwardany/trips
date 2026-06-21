'use client';
import { useEffect } from 'react';
import { useUiStore } from '@/stores/uiStore';

export function DirProvider() {
  const lang = useUiStore((s) => s.lang);
  
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  return null;
}
