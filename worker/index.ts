/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

import { idbGetAll, idbDelete, idbPut } from '../src/lib/db';

self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(processQueueFromBackground());
  }
});

async function processQueueFromBackground() {
  const pending = await idbGetAll<{ id?: number; action: string; payload: Record<string, unknown> }>('queue');
  if (pending.length === 0) return;

  for (const item of pending) {
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: item.action, token: 'PROXY_AUTH', payload: item.payload })
      });
      const json = await res.json();
      if (json.ok || (json.error && !['AUTH_REQUIRED', 'UNAUTHORIZED'].includes(json.error.code))) {
        await idbDelete('queue', item.id!);
      } else {
        await idbDelete('queue', item.id!);
        await idbPut('failed', item);
      }
    } catch (err) {
      // Network failed again, keep in queue
      console.error('Background sync failed for item', item, err);
    }
  }

  // Notify clients (the open tabs) to refresh their sync state
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'SYNC_COMPLETE' }));
}
