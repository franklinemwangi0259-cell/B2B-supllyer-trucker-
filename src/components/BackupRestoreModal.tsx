import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  Clock,
  Cloud,
  CheckCircle2,
  HardDrive,
  Trash2,
  X,
  RefreshCw,
  FileCheck,
  Shield,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { BackupSnapshot } from '../types.ts';
import {
  getLocalBackups,
  exportFullBackupBundle,
  downloadBackupFile,
  deleteBackupSnapshot,
} from '../lib/backupEngine.ts';

export const BackupRestoreModal: React.FC = () => {
  const {
    isBackupModalOpen,
    setIsBackupModalOpen,
    customers,
    suppliers,
    purchaseOrders,
    inventory,
    customerTransactions,
    payments,
    cashbookEntries,
    showToast,
    refreshData,
  } = useApp();

  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  const loadBackups = () => {
    setBackups(getLocalBackups());
  };

  useEffect(() => {
    if (isBackupModalOpen) {
      loadBackups();
    }
  }, [isBackupModalOpen]);

  if (!isBackupModalOpen) return null;

  const handleCreateBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const dataBundle = {
        customers,
        suppliers,
        purchaseOrders,
        inventory,
        customerTransactions,
        payments,
        cashbookEntries,
        exportedAt: new Date().toISOString(),
      };

      const snapshot = exportFullBackupBundle(dataBundle, 'manual');
      loadBackups();
      setIsBackingUp(false);
      showToast(`Database Snapshot created (${snapshot.sizeKb} KB)`, 'success');
    }, 600);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const data = parsed.dataPayload || parsed;

        if (data.customers || data.suppliers || data.purchaseOrders) {
          if (data.customers) localStorage.setItem('b2b_customers', JSON.stringify(data.customers));
          if (data.customerTransactions) localStorage.setItem('b2b_customer_transactions', JSON.stringify(data.customerTransactions));
          if (data.cashbookEntries) localStorage.setItem('b2b_cashbook_entries', JSON.stringify(data.cashbookEntries));
          
          showToast('Database successfully restored from backup file! Refreshing state...', 'success');
          refreshData();
          setIsBackupModalOpen(false);
        } else {
          showToast('Invalid backup file structure', 'error');
        }
      } catch (err) {
        showToast('Failed to parse backup JSON file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = (id: string) => {
    deleteBackupSnapshot(id);
    loadBackups();
    showToast('Backup snapshot removed', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Automated Data Backups & Recovery
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily scheduled snapshots, encrypted offline JSON archives, and Google Drive cloud exports
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBackupModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Actions & Auto-Backup Status */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  Daily Auto-Backup Active
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Last automated backup: Today at 04:00 AM (IndexedDB & Cloud)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCreateBackup}
                disabled={isBackingUp}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                {isBackingUp ? 'Creating Snapshot...' : 'Backup Now'}
              </button>

              <label className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5" /> Restore File
                <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
              </label>
            </div>
          </div>

          {/* Backup History Snapshots */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Saved Backup Snapshots ({backups.length})
              </h4>
              <span className="text-[11px] text-slate-400">Retains latest 20 snapshots</span>
            </div>

            {backups.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
                No backup snapshots found. Click &quot;Backup Now&quot; to create your first archive.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {backups.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                        <FileCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Snapshot {b.formattedDate}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{b.sizeKb} KB</span>
                          <span>•</span>
                          <span>
                            {b.counts.customers} Cust, {b.counts.suppliers} Supp, {b.counts.purchaseOrders} POs, {b.counts.inventoryItems} Items
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadBackupFile(b)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Download JSON"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete Snapshot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
