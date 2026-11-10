import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Camera,
  Printer,
  FileSpreadsheet,
  Users,
  Building2,
  Package,
  Database,
  HelpCircle,
  X,
  Sparkles,
  Command,
  ArrowRight,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface CommandPaletteModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setActiveTab,
    openKhataEntryModal,
    openCustomerModal,
    openNewPO,
    openInventoryModal,
    openCustomerPortalModal,
    setIsOCRScannerModalOpen,
    setIsThermalPrintModalOpen,
    setIsReconciliationModalOpen,
    setIsTaxAuditModalOpen,
    setIsBackupModalOpen,
    setIsStaffModalOpen,
    openOrgModal,
    customers,
  } = useApp();

  const [query, setQuery] = useState('');

  const isOpen = propIsOpen !== undefined ? propIsOpen : isCommandPaletteOpen;
  const handleClose = () => {
    if (propOnClose) propOnClose();
    setIsCommandPaletteOpen(false);
  };

  // Global Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette on Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // If typing in input or textarea, don't hijack simple keys
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      // Alt shortcuts
      if (e.altKey) {
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          if (customers.length > 0) {
            openKhataEntryModal({
              partyType: 'customer',
              partyId: customers[0].id,
              partyName: customers[0].name,
              phone: customers[0].phone,
              initialType: 'gave',
            });
          }
        } else if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          openCustomerModal();
        } else if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          openNewPO();
        } else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          setIsOCRScannerModalOpen(true);
        } else if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          setIsThermalPrintModalOpen(true);
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          setIsReconciliationModalOpen(true);
        } else if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          setIsBackupModalOpen(true);
        }
      }

      // '?' key opens shortcuts guide
      if (e.key === '?' && !e.shiftKey) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [customers, openKhataEntryModal, openCustomerModal, openNewPO, setIsOCRScannerModalOpen, setIsThermalPrintModalOpen, setIsReconciliationModalOpen, setIsBackupModalOpen, setIsCommandPaletteOpen]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'new_entry',
      title: 'New Transaction Entry (Credit Sale / Payment Received)',
      shortcut: 'Alt + N',
      icon: Plus,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50',
      run: () => {
        setIsCommandPaletteOpen(false);
        if (customers.length > 0) {
          openKhataEntryModal({
            partyType: 'customer',
            partyId: customers[0].id,
            partyName: customers[0].name,
            phone: customers[0].phone,
            initialType: 'gave',
          });
        }
      },
    },
    {
      id: 'scan_ocr',
      title: 'Smart OCR Receipt & Bill Camera Scanner',
      shortcut: 'Alt + S',
      icon: Camera,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
      run: () => {
        setIsCommandPaletteOpen(false);
        setIsOCRScannerModalOpen(true);
      },
    },
    {
      id: 'thermal_print',
      title: 'Print POS Thermal Receipt (58mm / 80mm)',
      shortcut: 'Alt + T',
      icon: Printer,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50',
      run: () => {
        setIsCommandPaletteOpen(false);
        setIsThermalPrintModalOpen(true);
      },
    },
    {
      id: 'new_customer',
      title: 'Add New Customer Account',
      shortcut: 'Alt + C',
      icon: Users,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
      run: () => {
        setIsCommandPaletteOpen(false);
        openCustomerModal();
      },
    },
    {
      id: 'new_po',
      title: 'Create Purchase Order (Supplier PO)',
      shortcut: 'Alt + P',
      icon: FileSpreadsheet,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50',
      run: () => {
        setIsCommandPaletteOpen(false);
        openNewPO();
      },
    },
    {
      id: 'reconciliation',
      title: 'Smart Auto-Reconciliation Engine',
      shortcut: 'Alt + R',
      icon: Sparkles,
      color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50',
      run: () => {
        setIsCommandPaletteOpen(false);
        setIsReconciliationModalOpen(true);
      },
    },
    {
      id: 'backup_data',
      title: 'Automated Database Backup & Restore',
      shortcut: 'Alt + B',
      icon: Database,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
      run: () => {
        setIsCommandPaletteOpen(false);
        setIsBackupModalOpen(true);
      },
    },
    {
      id: 'switch_staff',
      title: 'Switch Staff Role & Terminal PIN',
      shortcut: 'Alt + U',
      icon: Shield,
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50',
      run: () => {
        setIsCommandPaletteOpen(false);
        setIsStaffModalOpen(true);
      },
    },
    {
      id: 'tax_audit',
      title: 'Tax & GST/VAT Audit Statement',
      shortcut: 'Alt + G',
      icon: FileSpreadsheet,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50',
      run: () => {
        setIsCommandPaletteOpen(false);
        setIsTaxAuditModalOpen(true);
      },
    },
    {
      id: 'org_setup',
      title: 'Zoho Books Organization, Phone & Digital Signature Setup',
      shortcut: 'Alt + O',
      icon: Building2,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50',
      run: () => {
        setIsCommandPaletteOpen(false);
        openOrgModal();
      },
    },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.shortcut.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
            ESC
          </span>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="p-2 max-h-80 overflow-y-auto divide-y divide-slate-100/50 dark:divide-slate-800/50">
          {filtered.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={action.run}
                className="w-full p-3 rounded-xl flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {action.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                    {action.shortcut}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Global Quick-Keys enabled on all screens</span>
          <span>Press <strong className="font-mono text-slate-700 dark:text-slate-300">?</strong> anytime</span>
        </div>
      </div>
    </div>
  );
};
