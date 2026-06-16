'use client';
import type { ApiResponse } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { enqueue } from '@/lib/offlineQueue';

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || '';

/** Mutating actions are queued when offline (offline-first) */
const QUEUEABLE = /\.(create|update|delete|markPurchased|markDelivered|updateStatus)$/;

export async function api<T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().token;
  const body = JSON.stringify({ action, token, payload });

  if (typeof navigator !== 'undefined' && !navigator.onLine && QUEUEABLE.test(action)) {
    await enqueue({ action, payload, queued_at: Date.now() });
    return { ok: true, data: { queued: true } as T, error: null, meta: { offline: true } };
  }

  try {
    // text/plain avoids CORS preflight against Google Apps Script
    const res = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body });
    const json: ApiResponse<T> = await res.json();
    if (!json.ok && json.error?.code === 'UNAUTHORIZED') useAuthStore.getState().clear();
    return json;
  } catch {
    if (QUEUEABLE.test(action)) {
      await enqueue({ action, payload, queued_at: Date.now() });
      return { ok: true, data: { queued: true } as T, error: null, meta: { offline: true } };
    }
    return { ok: false, data: null as T, error: { code: 'NETWORK', message: 'Network error' }, meta: null };
  }
}

/** Client-side image compression before upload (max 1600px, JPEG 80%) */
export async function compressImage(file: File): Promise<{ base64: string; mime: string }> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  if (!file.type.startsWith('image/')) return { base64: dataUrl.split(',')[1], mime: file.type };

  const img = document.createElement('img');
  await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = dataUrl; });
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const out = canvas.toDataURL('image/jpeg', 0.8);
  return { base64: out.split(',')[1], mime: 'image/jpeg' };
}
