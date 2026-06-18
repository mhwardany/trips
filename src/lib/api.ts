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
    // text/plain avoids CORS preflight against Google Apps Script
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
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
