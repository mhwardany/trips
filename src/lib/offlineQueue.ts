'use client';
/** Offline mutation queue with sync-on-reconnect (and on app open for iOS) */
import { idbGetAll, idbDelete, idbPut } from '@/lib/db';
import { useSyncStore } from '@/stores/syncStore';

interface QueueItem { id?: number; action: string; payload: Record<string, unknown>; queued_at: number; }

export async function enqueue(item: QueueItem): Promise<void> {
  await idbPut('queue', item);
  useSyncStore.getState().refreshCount();
}

export async function pendingCount(): Promise<number> {
  return (await idbGetAll<QueueItem>('queue')).length;
}

let syncing = false;

export async function syncQueue(): Promise<void> {
  if (syncing || typeof navigator === 'undefined' || !navigator.onLine) return;
  const initialPending = await pendingCount();
  if (initialPending === 0) return;
  
  syncing = true;
  useSyncStore.getState().setSyncing(true);
  let syncSuccess = false;
  
  try {
    const { useAuthStore } = await import('@/stores/authStore');
    const token = useAuthStore.getState().token;
    const url = process.env.NEXT_PUBLIC_GAS_URL || '';
    const items = await idbGetAll<QueueItem>('queue');
    for (const item of items.sort((a, b) => a.queued_at - b.queued_at)) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: item.action, token, payload: item.payload })
        });
        const json = await res.json();
        if (json.ok || (json.error && !['UNAUTHORIZED', 'NETWORK'].includes(json.error.code))) {
          await idbDelete('queue', item.id!);
          syncSuccess = true;
        } else if (json.error?.code === 'UNAUTHORIZED') break;
      } catch { break; } 
    }
  } finally {
    syncing = false;
    useSyncStore.getState().setSyncing(false);
    useSyncStore.getState().refreshCount();
    if (syncSuccess) {
      const { useUiStore } = await import('@/stores/uiStore');
      useUiStore.getState().showToast('Offline changes synced to server ✓', 'success');
    }
  }
}

export function initSyncListeners(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => { void syncQueue(); });
  void syncQueue(); // iOS Safari: sync on app open
}
