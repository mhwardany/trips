'use client';
import type { ApiResponse } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { enqueue } from '@/lib/offlineQueue';
import { cacheSet, cacheGet } from '@/lib/db';

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || '';
const REQUEST_TIMEOUT_MS = 20000;

/** Mutating actions are queued when offline (offline-first) */
const QUEUEABLE = /\.(create|update|delete|markPurchased|markDelivered|updateStatus|set|submit)$/;
/** Auth error codes that should clear the local session (unified backend/frontend contract). */
const AUTH_ERROR_CODES = ['AUTH_REQUIRED', 'UNAUTHORIZED'];

function cacheKey(action: string, payload: Record<string, unknown>): string {
  return action + '::' + JSON.stringify(payload || {});
}

async function postJson<T>(action: string, payload: Record<string, unknown>): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().token;
  const body = JSON.stringify({ action, token, payload });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    // Forward everything to our secure proxy API
    const res = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    return (await res.json()) as ApiResponse<T>;
  } finally {
    clearTimeout(timer);
  }
}

export async function api<T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  if (!GAS_URL) {
    return { ok: false, data: null as T, error: { code: 'CONFIG', message: 'API URL not configured (NEXT_PUBLIC_GAS_URL).' }, meta: null };
  }

  const isMutation = QUEUEABLE.test(action);
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;

  // ---- Offline mutation: queue it ----
  if (offline && isMutation) {
    await enqueue({ action, payload, queued_at: Date.now() });
    return { ok: true, data: { queued: true } as T, error: null, meta: { offline: true } };
  }

  try {
    const json = await postJson<T>(action, payload);
    if (!json.ok && json.error && AUTH_ERROR_CODES.includes(json.error.code)) {
      useAuthStore.getState().clear();
    }
    // ---- Cache successful reads for offline fallback ----
    if (json.ok && !isMutation) {
      try { await cacheSet(cacheKey(action, payload), json.data); } catch { /* cache best-effort */ }
    }
    return json;
  } catch {
    // Network failure / timeout
    if (isMutation) {
      await enqueue({ action, payload, queued_at: Date.now() });
      return { ok: true, data: { queued: true } as T, error: null, meta: { offline: true } };
    }
    // Read fallback to last-known-good cached value
    const cached = await cacheGet<T>(cacheKey(action, payload));
    if (cached !== null) {
      return { ok: true, data: cached, error: null, meta: { offline: true, stale: true } };
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
  if (file.type === 'application/pdf') {
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      
      await page.render({ canvasContext: ctx, viewport }).promise;
      const out = canvas.toDataURL('image/jpeg', 0.9);
      return { base64: out.split(',')[1], mime: 'image/jpeg' };
    } catch (e) {
      console.error('PDF to Image conversion failed', e);
      return { base64: dataUrl.split(',')[1], mime: 'application/pdf' }; // Fallback to raw PDF
    }
  }

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
