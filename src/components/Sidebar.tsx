import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Receipt,
  FileText,
  DollarSign,
  BarChart3,
  Wallet,
  Building2,
  PlusCircle,
  LogOut,
  LogIn,
  RotateCw,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  ChevronRight,
  Sparkles,
  X,
  CreditCard,
  ShieldCheck,
  Briefcase,
  Layers,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  Bell,
  Scale,
  Send,
  Zap,
  Camera,
  Printer,
  Database,
  Shield,
  Command,
  Download,
} from 'lucide-react';
import { getRoleBadgeInfo } from '../lib/rbac.ts';

import logoImg from '../assets/images/b2b_supply_tracker_logo_1787039083352.jpg';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenSearch }) => {
  const {
    activeTab,
    setActiveTab,
    currency,
    setCurrency,
    stats,
    user,
    signInWithGoogle,
    signOut,
    refreshData,
    loading,
    openNewPO,
    openSupplierModal,
    openCustomerModal,
    openKhataEntryModal,
    openInventoryModal,
    openPaymentModal,
    openBulkImportModal,
    openReconciliationModal,
    openTaxAuditModal,
    openBatchReminderModal,
    setIsOCRScannerModalOpen,
    setIsThermalPrintModalOpen,
    setIsStaffModalOpen,
    setIsBackupModalOpen,
    setIsCommandPaletteOpen,
    openInstallAppModal,
    organizationProfile,
    openOrgModal,
    activeRole,
    customers,
    suppliers,
    purchaseOrders,
  } = useApp();

  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [salesOpen, setSalesOpen] = useState(true);
  const [purchasesOpen, setPurchasesOpen] = useState(true);

  const urgentCount = (stats?.overdueCount || 0) + (stats?.dueIn3DaysCount || 0);
  const pendingReceivablesCount = customers.filter((c) => (c.currentBalance || 0) > 0).length;
  const overduePOsCount = purchaseOrders.filter((po) => {
    if (po.paymentStatus === 'paid' || po.status === 'cancelled') return false;
    const today = new Date().toISOString().slice(0, 10);
    return po.dueDate < today;
  }).length;

  const roleBadge = getRoleBadgeInfo(activeRole);

  const currencies = [
    { code: 'USD', symbol: '$', label: 'USD ($)' },
    { code: 'INR', symbol: '₹', label: 'INR (₹)' },
    { code: 'KES', symbol: 'KSh', label: 'KES (KSh)' },
    { code: 'NGN', symbol: '₦', label: 'NGN (₦)' },
    { code: 'EUR', symbol: '€', label: 'EUR (€)' },
    { code: 'GBP', symbol: '£', label: 'GBP (£)' },
    { code: 'ZAR', symbol: 'R', label: 'ZAR (R)' },
    { code: 'AED', symbol: 'AED', label: 'AED (د.إ)' },
    { code: 'CAD', symbol: 'C$', label: 'CAD (C$)' },
  ];

  const handleNavClick = (tab: any) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden backdrop-blur-xs animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Main Zoho Books Style Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-64 bg-[#0f172a] text-slate-200 flex flex-col border-r border-slate-800/80 transition-transform duration-200 ease-in-out shrink-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Organization Brand Header */}
        <div className="p-3 border-b border-slate-800/90 bg-[#0b1120] flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white p-0.5 shadow-md shrink-0 overflow-hidden flex items-center justify-center border border-slate-700">
              <img
                src={logoImg}
                alt="B2B Supply Tracker"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xs text-white tracking-tight truncate">
                  B2B Supply Tracker
                </span>
                <span className="text-[9px] font-bold uppercase bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded">
                  ERP
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">SUPPLY • INVENTORY • ACCOUNTS</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Organization Profile Card */}
        <div className="px-3 py-2.5 bg-slate-900 border-b border-slate-800/80">
          <button
            type="button"
            onClick={openOrgModal}
            className="w-full p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group flex items-start justify-between cursor-pointer"
            title="Configure Company Name, Phone, and Authorized Signature"
          >
            <div className="flex items-start space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-white truncate leading-tight group-hover:text-indigo-300 transition-colors">
                  {organizationProfile?.companyName || 'Set Company Name'}
                </p>
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <span className="truncate">{organizationProfile?.phone || 'Add Phone Number'}</span>
                </p>
              </div>
            </div>
            <span className="text-[9px] font-semibold text-indigo-400 uppercase bg-indigo-950/60 border border-indigo-800/50 px-1.5 py-0.5 rounded shrink-0">
              Edit
            </span>
          </button>
        </div>

        {/* Staff Role Switcher Ribbon */}
        <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800/70 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsStaffModalOpen(true)}
            className="w-full flex items-center justify-between p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] font-medium">Terminal Role:</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
              {roleBadge.label}
            </span>
          </button>
        </div>

        {/* Global Quick Action / + New Transaction Button */}
        <div className="p-3 border-b border-slate-800/60 relative space-y-2">
          <button
            id="sidebar-quick-entry-btn"
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="w-full flex items-center justify-between px-3 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-md shadow-blue-900/30 transition-all"
          >
            <div className="flex items-center space-x-2">
              <PlusCircle className="w-4 h-4" />
              <span>+ New Transaction</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Quick Shortcuts Trigger (Ctrl+K) */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 rounded-lg text-[11px] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Command className="w-3 h-3 text-slate-400" /> Quick-Keys
            </span>
            <span className="font-mono text-[9px] bg-slate-700/80 px-1.5 py-0.2 rounded text-slate-300">
              Alt+N / ?
            </span>
          </button>

          {/* Quick Menu Popover */}
          {showQuickMenu && (
            <div
              className="absolute left-3 right-3 top-12 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs"
              onClick={() => setShowQuickMenu(false)}
            >
              <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Sales & Customers
              </div>
              <button
                onClick={() => openCustomerModal()}
                className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Add Customer</span>
              </button>
              <button
                onClick={() => {
                  if (customers.length > 0) {
                    openKhataEntryModal({
                      partyType: 'customer',
                      partyId: customers[0].id,
                      partyName: customers[0].name,
                      initialType: 'got',
                      currentBalance: customers[0].currentBalance,
                      phone: customers[0].phone,
                    });
                  } else {
                    openCustomerModal();
                  }
                }}
                className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Customer Payment Received</span>
              </button>

              <div className="border-t border-slate-800 my-1"></div>

              <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Purchases & Suppliers
              </div>
              <button
                onClick={() => openNewPO()}
                className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
              >
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>Create Purchase Order</span>
              </button>
              <button
                onClick={() => openSupplierModal()}
                className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Add Vendor / Supplier</span>
              </button>
              <button
                onClick={() => openPaymentModal()}
                className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
              >
                <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                <span>Record Vendor Payment</span>
              </button>

              <div className="border-t border-slate-800 my-1"></div>

              <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Inventory & Hardware
              </div>
              <button
                onClick={() => setIsOCRScannerModalOpen(true)}
                className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-800 flex items-center space-x-2 text-amber-400"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Smart AI OCR Bill Scanner</span>
              </button>
              <button
                onClick={() => setIsThermalPrintModalOpen(true)}
                className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-800 flex items-center space-x-2 text-blue-400"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print POS Thermal Receipt</span>
              </button>
              <button
                onClick={() => openInventoryModal()}
                className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
              >
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Item to Inventory</span>
              </button>
              <button
                onClick={() => openBulkImportModal()}
                className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-800 flex items-center space-x-2 text-emerald-400"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bulk Import Samples</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tree */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 text-xs no-scrollbar">
          {/* Dashboard */}
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
          </button>

          {/* Items & Stock Radar */}
          <button
            onClick={() => handleNavClick('inventory')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'inventory'
                ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Package className="w-4 h-4" />
              <span>Items & Inventory</span>
            </div>
            {stats?.lowStockCount && stats.lowStockCount > 0 ? (
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {stats.lowStockCount} low
              </span>
            ) : null}
          </button>

          {/* Sales Group (Customers, Invoices) */}
          <div className="pt-2">
            <div
              onClick={() => setSalesOpen(!salesOpen)}
              className="flex items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-200"
            >
              <span>Sales (Receivables)</span>
              {salesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>

            {salesOpen && (
              <div className="mt-1 space-y-0.5 pl-2">
                <button
                  onClick={() => handleNavClick('suppliers')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'suppliers'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Customers & Accounts</span>
                  </div>
                  {pendingReceivablesCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[9px] font-black rounded-full bg-emerald-500/20 text-emerald-300">
                      {pendingReceivablesCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Purchases Group (Vendors, Purchase Orders, Bills, Payments) */}
          <div className="pt-2">
            <div
              onClick={() => setPurchasesOpen(!purchasesOpen)}
              className="flex items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-200"
            >
              <span>Purchases (Payables)</span>
              {purchasesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>

            {purchasesOpen && (
              <div className="mt-1 space-y-0.5 pl-2">
                <button
                  onClick={() => handleNavClick('purchase-orders')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'purchase-orders'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Purchase Orders & Bills</span>
                  </div>
                  {overduePOsCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[9px] font-black rounded-full bg-rose-500/20 text-rose-300">
                      {overduePOsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('payments')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'payments'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    <span>Payments Made</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Hardware & Fast POS Tools */}
          <div className="pt-2">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Hardware & Scanning
            </div>
            <div className="mt-1 space-y-0.5 pl-2">
              <button
                type="button"
                onClick={() => setIsOCRScannerModalOpen(true)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI OCR Bill Scanner</span>
                </div>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold">
                  Gemini
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsThermalPrintModalOpen(true)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  <span>POS Thermal Printer</span>
                </div>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded font-mono">
                  58/80mm
                </span>
              </button>
            </div>
          </div>

          {/* Advanced ERP Tools (Reconciliation, Tax Audit, Batch Action) */}
          <div className="pt-2">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Enterprise Tools
            </div>
            <div className="mt-1 space-y-0.5 pl-2">
              <button
                onClick={openReconciliationModal}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <Scale className="w-3.5 h-3.5 text-purple-400" />
                  <span>Auto Reconciliation</span>
                </div>
                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 py-0.2 rounded font-bold">
                  AI
                </span>
              </button>

              <button
                onClick={openTaxAuditModal}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <Receipt className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tax & Audit Filing</span>
                </div>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold">
                  GST/VAT
                </span>
              </button>

              <button
                onClick={() => {
                  const withBalance = customers.filter((c) => (c.currentBalance || 0) > 0);
                  openBatchReminderModal(withBalance.length > 0 ? withBalance : customers);
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Batch Invoicing & Reminders</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsBackupModalOpen(true)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Backups & Recovery</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-bold">
                  Auto
                </span>
              </button>

              <button
                type="button"
                onClick={() => openInstallAppModal()}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-950/40 border border-indigo-900/40 transition-all group"
              >
                <div className="flex items-center space-x-2">
                  <Download className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-indigo-200">Install App (PWA)</span>
                </div>
                <span className="text-[9px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.2 rounded font-bold">
                  Offline
                </span>
              </button>
            </div>
          </div>

          {/* Reports & Financial Intelligence */}
          <div className="pt-2">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Accountant & Reports
            </div>
            <div className="mt-1 space-y-0.5 pl-2">
              <button
                onClick={() => handleNavClick('reports')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'reports'
                    ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Financial Statements & Aging</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Utility Footer */}
        <div className="p-3 border-t border-slate-800/90 bg-[#0b1120] space-y-2.5 text-xs">
          {/* Urgent Overdue Alert Pill */}
          {urgentCount > 0 && (
            <div
              onClick={() => handleNavClick('purchase-orders')}
              className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-all"
            >
              <span className="text-[11px] font-bold text-amber-300 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>{urgentCount} Bills Due</span>
              </span>
              <span className="text-[10px] text-amber-400 underline font-semibold">View &gt;</span>
            </div>
          )}

          {/* Currency Switcher */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Base Currency:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* User Sign-In / Account status */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            {user ? (
              <>
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      (user.displayName || user.email || 'U')[0].toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">
                      {user.displayName || 'Authorized User'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-400" />
                <span>Google Sign In</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
