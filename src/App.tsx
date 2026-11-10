import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { TopHeader } from './components/TopHeader.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { PurchaseOrdersView } from './components/PurchaseOrdersView.tsx';
import { SuppliersLedgerView } from './components/SuppliersLedgerView.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { PaymentsView } from './components/PaymentsView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { CashbookView } from './components/CashbookView.tsx';
import { POBuilderModal } from './components/POBuilderModal.tsx';
import { PODetailModal } from './components/PODetailModal.tsx';
import { SupplierModal } from './components/SupplierModal.tsx';
import { CustomerModal } from './components/CustomerModal.tsx';
import { KhataEntryModal } from './components/KhataEntryModal.tsx';
import { BulkImportModal } from './components/BulkImportModal.tsx';
import { InventoryModal } from './components/InventoryModal.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { CommandPaletteModal } from './components/CommandPaletteModal.tsx';
import { AutomatedReminderModal } from './components/AutomatedReminderModal.tsx';
import { ReconciliationModal } from './components/ReconciliationModal.tsx';
import { BatchReminderModal } from './components/BatchReminderModal.tsx';
import { TaxAuditModal } from './components/TaxAuditModal.tsx';
import { OCRScannerModal } from './components/OCRScannerModal.tsx';
import { ThermalPrintModal } from './components/ThermalPrintModal.tsx';
import { StaffManagementModal } from './components/StaffManagementModal.tsx';
import { BackupRestoreModal } from './components/BackupRestoreModal.tsx';
import { WhatsAppBusinessModal } from './components/WhatsAppBusinessModal.tsx';
import { CustomerPortalModal } from './components/CustomerPortalModal.tsx';
import { InstallAppModal } from './components/InstallAppModal.tsx';
import { OrganizationSetupModal } from './components/OrganizationSetupModal.tsx';
import { AuthView } from './components/AuthView.tsx';
import { MobileBottomDock } from './components/MobileBottomDock.tsx';
import logoImg from './assets/images/b2b_supply_tracker_logo_1787039083352.jpg';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react';

const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bg = 'bg-slate-900 text-white';
        let icon = <Info className="w-4 h-4 text-sky-400 shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-emerald-950/95 border-emerald-800/80 text-emerald-50';
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-rose-950/95 border-rose-800/80 text-rose-50';
          icon = <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-xs text-xs font-medium ${bg} transition-all transform duration-200 animate-in slide-in-from-bottom-2`}
          >
            {icon}
            <span className="flex-1">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};

const MainContent: React.FC = () => {
  const {
    user,
    authLoading,
    activeTab,
    loading,
    error,
    refreshData,
    isAutomatedReminderModalOpen,
    setIsAutomatedReminderModalOpen,
    automatedReminderTarget,
    isReconciliationModalOpen,
    setIsReconciliationModalOpen,
    isBatchReminderModalOpen,
    setIsBatchReminderModalOpen,
    batchReminderSelectedCustomers,
    isTaxAuditModalOpen,
    setIsTaxAuditModalOpen,
    customers,
    isCustomerPortalModalOpen,
    setIsCustomerPortalModalOpen,
    customerPortalTarget,
    openCustomerPortalModal,
    isOrgModalOpen,
    setIsOrgModalOpen,
  } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check URL Query for Direct Customer Portal Link (e.g. ?portal=customer&id=101)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const portalType = params.get('portal');
    const customerId = params.get('id') || params.get('customerId');
    if (portalType === 'customer' && customerId && customers.length > 0) {
      const match = customers.find((c) => String(c.id) === String(customerId));
      if (match) {
        openCustomerPortalModal(match);
      }
    }
  }, [customers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Initial Authentication Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        <div className="w-20 h-20 rounded-2xl bg-white p-2 flex items-center justify-center mb-5 shadow-2xl shadow-cyan-500/30 border border-slate-700 animate-pulse relative z-10">
          <img src={logoImg} alt="B2B Supply Tracker" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-cyan-400 mb-2 relative z-10" />
        <p className="text-xs text-slate-300 font-bold tracking-wide relative z-10">B2B SUPPLY TRACKER</p>
        <p className="text-[10px] text-slate-500 mt-0.5 relative z-10">Loading Enterprise Workspace...</p>
      </div>
    );
  }

  // 2. Authentication & Registration Gate (If user is not signed in)
  if (!user) {
    return (
      <>
        <AuthView />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex font-sans antialiased overflow-hidden relative">
      {/* 1. Dedicated Left Navigation Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* 2. Main Content View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        {/* Subtle Ambient Background Watermark Pattern */}
        <div className="fixed top-24 right-10 pointer-events-none opacity-[0.025] w-[550px] h-[550px] select-none z-0 hidden md:block">
          <img src={logoImg} alt="Watermark" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>

        {/* Top Header */}
        <TopHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        {/* Inner Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 relative z-10">
          {loading && (
            <div className="flex items-center justify-center py-2.5 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold space-x-2 shadow-2xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Synchronizing B2B Supply Tracker data...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-between p-4 mb-6 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 shadow-2xs">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => refreshData()}
                className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg font-bold transition-all"
              >
                Retry
              </button>
            </div>
          )}

          {/* Tab Views */}
          {activeTab === 'suppliers' && <SuppliersLedgerView />}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'purchase-orders' && <PurchaseOrdersView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'payments' && <PaymentsView />}
          {activeTab === 'reports' && <ReportsView />}
        </main>
      </div>

      {/* B2B Core Modals */}
      <CustomerModal />
      <KhataEntryModal />
      <BulkImportModal />
      <POBuilderModal />
      <PODetailModal />
      <SupplierModal />
      <InventoryModal />
      <PaymentModal />
      <CommandPaletteModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Enterprise Suite Modals */}
      <AutomatedReminderModal
        isOpen={isAutomatedReminderModalOpen}
        onClose={() => setIsAutomatedReminderModalOpen(false)}
        targetParty={automatedReminderTarget}
      />

      <ReconciliationModal
        isOpen={isReconciliationModalOpen}
        onClose={() => setIsReconciliationModalOpen(false)}
      />

      <BatchReminderModal
        isOpen={isBatchReminderModalOpen}
        onClose={() => setIsBatchReminderModalOpen(false)}
        selectedCustomers={batchReminderSelectedCustomers}
      />

      <TaxAuditModal
        isOpen={isTaxAuditModalOpen}
        onClose={() => setIsTaxAuditModalOpen(false)}
      />

      {/* POS & Hardware Modals */}
      <OCRScannerModal />
      <ThermalPrintModal />
      <StaffManagementModal />
      <BackupRestoreModal />
      <WhatsAppBusinessModal />
      <InstallAppModal />
      <OrganizationSetupModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
      />

      {/* Customer 1-Click Self-Service Portal Modal */}
      <CustomerPortalModal
        isOpen={isCustomerPortalModalOpen}
        onClose={() => setIsCustomerPortalModalOpen(false)}
        customer={customerPortalTarget}
      />

      {/* Mobile Responsive Bottom Dock */}
      <MobileBottomDock />

      {/* Floating Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
