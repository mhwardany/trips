'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'en' | 'ar';

interface UiState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toast: { message: string; type: 'success' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  hideToast: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (lang) => {
        set({ lang });
        if (typeof document !== 'undefined') {
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = lang;
        }
      },
      toast: null,
      showToast: (message, type = 'success') => {
        set({ toast: { message, type } });
        setTimeout(() => set({ toast: null }), 3000);
      },
      hideToast: () => set({ toast: null })
    }),
    { name: 'wt_ui', partialize: (s) => ({ lang: s.lang }) as Partial<UiState> }
  )
);
