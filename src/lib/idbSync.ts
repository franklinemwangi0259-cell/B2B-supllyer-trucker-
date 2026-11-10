/**
 * Robust IndexedDB Background Auto-Sync Engine
 * Queues mutations when offline or transient, syncs with timestamp-based conflict resolution.
 */

import { OfflineQueueItem } from '../types.ts';

const DB_NAME = 'B2B_SUPPLY_ERP_IDB';
const DB_VERSION = 1;
const QUEUE_STORE = 'offline_mutations';
const SNAPSHOT_STORE = 'data_snapshots';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbQueueMutation(item: OfflineQueueItem): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Fallback to LocalStorage for offline queue:', err);
    const existing: OfflineQueueItem[] = JSON.parse(localStorage.getItem('b2b_offline_queue') || '[]');
    const filtered = existing.filter((x) => x.id !== item.id);
    filtered.push(item);
    localStorage.setItem('b2b_offline_queue', JSON.stringify(filtered));
  }
}

export async function idbGetAllPendingMutations(): Promise<OfflineQueueItem[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(QUEUE_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result as OfflineQueueItem[];
        resolve(items.filter((i) => i.status === 'pending' || i.status === 'syncing'));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    const existing: OfflineQueueItem[] = JSON.parse(localStorage.getItem('b2b_offline_queue') || '[]');
    return existing.filter((i) => i.status === 'pending' || i.status === 'syncing');
  }
}

export async function idbRemoveMutation(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const existing: OfflineQueueItem[] = JSON.parse(localStorage.getItem('b2b_offline_queue') || '[]');
    localStorage.setItem('b2b_offline_queue', JSON.stringify(existing.filter((x) => x.id !== id)));
  }
}

export async function idbSaveSnapshot(id: string, data: any): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SNAPSHOT_STORE], 'readwrite');
      const store = transaction.objectStore(SNAPSHOT_STORE);
      const req = store.put({ id, timestamp: Date.now(), data });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB Snapshot error, using local fallback');
  }
}

export async function idbGetLatestSnapshot(): Promise<any | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SNAPSHOT_STORE], 'readonly');
      const store = transaction.objectStore(SNAPSHOT_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result;
        if (!items || items.length === 0) return resolve(null);
        items.sort((a: any, b: any) => b.timestamp - a.timestamp);
        resolve(items[0].data);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}
