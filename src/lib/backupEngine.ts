/**
 * Automated Data Backup & Cloud Sync Engine
 * Handles full-database snapshots, daily automated cron exports, and JSON/CSV restore.
 */

import { BackupSnapshot } from '../types.ts';

const BACKUP_STORAGE_KEY = 'b2b_erp_backup_snapshots';

export function getLocalBackups(): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBackupSnapshot(snapshot: BackupSnapshot): void {
  const list = getLocalBackups();
  const updated = [snapshot, ...list.slice(0, 19)]; // Keep latest 20 snapshots
  localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(updated));
}

export function deleteBackupSnapshot(id: string): void {
  const list = getLocalBackups();
  localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(list.filter((b) => b.id !== id)));
}

export function exportFullBackupBundle(dataBundle: any, type: 'manual' | 'auto_daily' | 'cloud_drive' = 'manual'): BackupSnapshot {
  const counts = {
    customers: dataBundle.customers?.length || 0,
    suppliers: dataBundle.suppliers?.length || 0,
    purchaseOrders: dataBundle.purchaseOrders?.length || 0,
    inventoryItems: dataBundle.inventory?.length || 0,
    customerTransactions: dataBundle.customerTransactions?.length || 0,
    payments: dataBundle.payments?.length || 0,
    cashbookEntries: dataBundle.cashbookEntries?.length || 0,
  };

  const str = JSON.stringify(dataBundle);
  const sizeKb = Math.round((str.length * 2) / 1024);

  const snapshot: BackupSnapshot = {
    id: `bkp_${Date.now()}`,
    timestamp: new Date().toISOString(),
    formattedDate: new Date().toLocaleString(),
    sizeKb,
    type,
    counts,
    dataPayload: dataBundle,
  };

  saveBackupSnapshot(snapshot);
  return snapshot;
}

export function downloadBackupFile(snapshot: BackupSnapshot): void {
  const jsonStr = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `B2B_Supply_Tracker_Backup_${new Date().toISOString().slice(0, 10)}_${snapshot.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
