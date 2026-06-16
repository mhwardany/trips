'use client';
import { useUiStore } from '@/stores/uiStore';

export default function Toast() {
  const toast = useUiStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div className={`fixed top-5 inset-x-4 z-[60] max-w-md mx-auto rounded-xl px-4 py-3 text-sm text-center border backdrop-blur
      ${toast.type === 'success' ? 'bg-royal-success/15 border-royal-success/40 text-royal-success' : 'bg-royal-error/15 border-royal-error/40 text-royal-error'}`}>
      {toast.message}
    </div>
  );
}
