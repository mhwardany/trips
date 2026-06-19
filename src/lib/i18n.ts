'use client';
import en from '@/lib/locales/en.json';
import ar from '@/lib/locales/ar.json';
import { useUiStore } from '@/stores/uiStore';

import { useCallback } from 'react';

const DICTS: Record<string, Record<string, string>> = { en, ar };

export function useT() {
  const lang = useUiStore((s) => s.lang);
  return useCallback((key: string): string => {
    const translations: Record<string, { en: string; ar: string }> = {
      management: { en: 'Management', ar: 'الإدارة' },
      finances: { en: 'Finances', ar: 'المالية والميزانية' },
      activities: { en: 'Activities', ar: 'الأنشطة والأماكن' },
      tools: { en: 'Tools & Info', ar: 'أدوات ومعلومات' },
      destination: { en: 'Destination', ar: 'الوجهة' },
      origin_country: { en: 'Origin Country', ar: 'بلد الانطلاق' },
      destination_country: { en: 'Destination Country', ar: 'دولة الوجهة' },
    };

    if (translations[key]) {
      return translations[key][lang as 'en' | 'ar'] || translations[key].en;
    }

    return DICTS[lang]?.[key] || DICTS.en[key] || key;
  }, [lang]);
}

export function useIsRtl() {
  return useUiStore((s) => s.lang) === 'ar';
}
