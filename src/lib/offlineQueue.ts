'use client';
/** Offline mutation queue with sync-on-reconnect (and on app open for iOS) */
import { idbGetAll, idbDelete, idbPut } from '@/lib/db';
import { useSyncStore } from '@/stores/syncStore';

interface QueueItem { id?: number; action: string; payload: Record<string, unknown>; queued_at: number; }

const AUTH_ERROR_CODES = ['AUTH_REQUIRED', 'UNAUTHORIZED'];

export async function enqueue(item: QueueItem): Promise<void> {
  await idbPut('queue', item);
  useSyncStore.getState().refreshCount();
  
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const sw = await navigator.serviceWorker.ready;
      await (sw as any).sync.register('sync-offline-queue');
    } catch (e) {
      console.error('Background Sync registration failed', e);
    }
  }
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
  let movedToFailed = 0;

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
          body: JSON.stringify({ action: item.action, token, payload: item.payload }),
        });
        const json = await res.json();

        if (json.ok) {
          // Only remove on confirmed success — prevents silent data loss.
          await idbDelete('queue', item.id!);
          syncSuccess = true;
        } else if (json.error && AUTH_ERROR_CODES.includes(json.error.code)) {
          // Session expired: stop, keep items, force re-auth.
          useAuthStore.getState().clear();
          break;
        } else if (json.error && json.error.code === 'NETWORK') {
          break; // transient; retry later
        } else {
          // Permanent server-side rejection (e.g. validation): move to dead-letter
          // so the user can review it instead of losing it OR blocking the queue.
          await idbPut('failed', { action: item.action, payload: item.payload, queued_at: item.queued_at, error: json.error, failed_at: Date.now() });
          await idbDelete('queue', item.id!);
          movedToFailed++;
        }
      } catch {
        break; // network error: stop and retry later
      }
    }
  } finally {
    syncing = false;
    useSyncStore.getState().setSyncing(false);
    useSyncStore.getState().refreshCount();
    const { useUiStore } = await import('@/stores/uiStore');
    if (syncSuccess) useUiStore.getState().showToast('Offline changes synced ✓', 'success');
    if (movedToFailed > 0) useUiStore.getState().showToast(`${movedToFailed} change(s) were rejected by the server — please review`, 'error');
  }
}

/** Items the server rejected; surfaced to the user for manual review. */
export async function failedItems(): Promise<unknown[]> {
  return idbGetAll('failed');
}

export function initSyncListeners(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => { void syncQueue(); });
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        useSyncStore.getState().refreshCount();
        void import('@/stores/uiStore').then(m => m.useUiStore.getState().showToast('Background sync complete ✓', 'success'));
      }
    });
  }

  void syncQueue(); // iOS Safari: sync on app open
}
