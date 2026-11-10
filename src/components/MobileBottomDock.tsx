import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Plus,
  Camera,
  Printer,
  FileSpreadsheet,
  Command,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const MobileBottomDock: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openKhataEntryModal,
    customers,
    setIsOCRScannerModalOpen,
    setIsThermalPrintModalOpen,
    setIsCommandPaletteOpen,
  } = useApp();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around">
        {/* Dashboard */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors ${
            activeTab === 'dashboard'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        {/* Accounts & Parties */}
        <button
          type="button"
          onClick={() => setActiveTab('suppliers')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors ${
            activeTab === 'suppliers'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Accounts</span>
        </button>

        {/* Center Quick Action Floating Button */}
        <div className="relative -top-3">
          <button
            type="button"
            onClick={() => {
              if (customers.length > 0) {
                openKhataEntryModal({
                  partyType: 'customer',
                  partyId: customers[0].id,
                  partyName: customers[0].name,
                  phone: customers[0].phone,
                  initialType: 'gave',
                });
              } else {
                setActiveTab('suppliers');
              }
            }}
            className="w-12 h-12 rounded-full bg-linear-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
            title="New Transaction"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* OCR Scanner */}
        <button
          type="button"
          onClick={() => setIsOCRScannerModalOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-500 transition-colors"
        >
          <Camera className="w-5 h-5 text-amber-500" />
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Scan OCR</span>
        </button>

        {/* POS Print */}
        <button
          type="button"
          onClick={() => setIsThermalPrintModalOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
        >
          <Printer className="w-5 h-5 text-blue-500" />
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">POS Print</span>
        </button>
      </div>
    </div>
  );
};
