import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { CURRENCY_RATES } from '../lib/currency.ts';
import {
  Menu,
  Search,
  RotateCw,
  Plus,
  AlertTriangle,
  CreditCard,
  LayoutDashboard,
  FileText,
  Package,
  DollarSign,
  BarChart3,
  Users,
  Building2,
  Bell,
  Settings,
  ChevronDown,
  Sparkles,
  Wifi,
  WifiOff,
  Globe,
  Receipt,
  Scale,
  Download,
  LogOut,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';

interface TopHeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleSidebar, onOpenSearch }) => {
  const {
    activeTab,
    user,
    signOut,
    stats,
    loading,
    refreshData,
    openCustomerModal,
    openNewPO,
    openInventoryModal,
    openReconciliationModal,
    openTaxAuditModal,
    openInstallAppModal,
    organizationProfile,
    openOrgModal,
    currency,
    setCurrency,
    isOnline,
    offlineQueue,
    syncOfflineQueue,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const tabTitles: Record<string, { title: string; breadcrumb: string; icon: any }> = {
    dashboard: {
      title: 'Executive Dashboard & Risk Radar',
      breadcrumb: 'Home / Financial Intelligence',
      icon: LayoutDashboard,
    },
    suppliers: {
      title: 'Suppliers & Customer Accounts',
      breadcrumb: 'Supply Chain / Accounts',
      icon: Users,
    },
    'purchase-orders': {
      title: 'Purchase Orders & Bills',
      breadcrumb: 'Purchases / Purchase Orders',
      icon: FileText,
    },
    inventory: {
      title: 'Items & Stock Radar',
      breadcrumb: 'Inventory / Items Catalog',
      icon: Package,
    },
    payments: {
      title: 'Payments Made',
      breadcrumb: 'Purchases / Payments Made',
      icon: DollarSign,
    },
    reports: {
      title: 'Reports, Tax & Audit Center',
      breadcrumb: 'Reports / Financial Statements',
      icon: BarChart3,
    },
  };

  const current = tabTitles[activeTab] || tabTitles.dashboard;
  const urgentCount = (stats?.overdueCount || 0) + (stats?.dueIn3DaysCount || 0);
  const activeRateObj = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
              {current.breadcrumb}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
              {current.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Right: Organization Switcher, Currency, PWA Sync Badge, Search, ERP Tools & Quick Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Organization Selector & Profile Pill */}
        <button
          type="button"
          onClick={openOrgModal}
          className="hidden md:flex items-center space-x-2 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs border border-slate-800 transition-all cursor-pointer group"
          title="Manage Organization Profile & Signature"
        >
          <div className="w-5 h-5 rounded-md bg-indigo-500/30 text-indigo-300 flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-tight max-w-[150px] lg:max-w-[200px] truncate">
            <div className="text-[11px] font-bold text-white truncate">
              {organizationProfile?.companyName || 'Set Company Name'}
            </div>
            <div className="text-[9px] text-slate-400 truncate">
              {organizationProfile?.phone || 'Add Phone Number'}
            </div>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
        </button>

        {/* Offline / Online Status Badge */}
        <div
          onClick={!isOnline || offlineQueue.length > 0 ? () => syncOfflineQueue() : undefined}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${
            isOnline
              ? offlineQueue.length > 0
                ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-slate-100 text-slate-700 border-slate-300'
          }`}
          title={isOnline ? 'PWA Online & Ready' : 'Working Offline - Click to force sync'}
        >
          {isOnline ? (
            <Wifi className="w-3 h-3 text-emerald-600" />
          ) : (
            <WifiOff className="w-3 h-3 text-amber-600" />
          )}
          <span className="hidden md:inline">
            {isOnline
              ? offlineQueue.length > 0
                ? `${offlineQueue.length} Syncing...`
                : 'PWA Online'
              : 'PWA Offline'}
          </span>
        </div>

        {/* Real-time Multi-Currency Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
            title="Switch Active Currency"
          >
            <span>{activeRateObj.flag}</span>
            <span className="font-mono">{currency}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showCurrencyMenu && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 text-xs"
              onClick={() => setShowCurrencyMenu(false)}
            >
              <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                <span>Multi-Currency Auto-FX</span>
                <Globe className="w-3 h-3 text-slate-400" />
              </div>
              <div className="py-1 max-h-64 overflow-y-auto divide-y divide-slate-50">
                {Object.values(CURRENCY_RATES).map((rate) => (
                  <button
                    key={rate.code}
                    onClick={() => setCurrency(rate.code)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left rounded-lg text-xs transition-all ${
                      currency === rate.code
                        ? 'bg-blue-50 text-blue-800 font-black'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{rate.flag}</span>
                      <span className="font-bold">{rate.code}</span>
                      <span className="text-[11px] text-slate-400">({rate.symbol})</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {rate.rateToUSD.toFixed(rate.rateToUSD >= 10 ? 1 : 2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Smart Reconcile Tool */}
        <button
          onClick={openReconciliationModal}
          className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold transition-all shadow-2xs"
          title="Auto-Match Invoices & Receipts"
        >
          <Scale className="w-3.5 h-3.5 text-purple-600" />
          <span>Reconcile</span>
        </button>

        {/* Tax Audit & Compliance */}
        <button
          onClick={openTaxAuditModal}
          className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-all shadow-2xs"
          title="One-Click Tax & Audit Filing"
        >
          <Receipt className="w-3.5 h-3.5 text-amber-600" />
          <span>Tax & Audit</span>
        </button>

        {/* Global Search Bar */}
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-all"
          title="Search in Tracker (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline text-slate-500">Search...</span>
          <kbd className="hidden md:inline text-[10px] bg-white border border-slate-300 text-slate-600 px-1.5 py-0.2 rounded font-mono shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Install App (PWA) Button */}
        <button
          onClick={openInstallAppModal}
          className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          title="Install App on Device (PWA)"
        >
          <Download className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {/* Refresh / Sync button */}
        <button
          onClick={() => refreshData()}
          disabled={loading}
          className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all"
          title="Sync with Database"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all relative"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {urgentCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 text-xs"
              onClick={() => setShowNotifications(false)}
            >
              <div className="font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Reminders & Notifications</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full">
                  {urgentCount} Alert(s)
                </span>
              </div>
              <div className="py-2 space-y-2 max-h-60 overflow-y-auto">
                {urgentCount > 0 ? (
                  <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-800">
                    <p className="font-bold text-[11px]">Supplier Bills Due</p>
                    <p className="text-[10px] text-rose-600">
                      {urgentCount} purchase order(s) are overdue or due within 3 days.
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-2">No pending urgent alerts</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Sign Out Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-1.5 p-1 sm:px-2 sm:py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all text-xs font-semibold text-slate-700 cursor-pointer"
            title="User Account & Organization"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                (user?.displayName || organizationProfile?.signatoryName || 'U')[0].toUpperCase()
              )}
            </div>
            <span className="hidden md:inline max-w-[100px] truncate text-slate-900 font-bold">
              {user?.displayName || organizationProfile?.signatoryName || 'Director'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 text-xs"
              onClick={() => setShowUserMenu(false)}
            >
              <div className="pb-2.5 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {(user?.displayName || organizationProfile?.signatoryName || 'U')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {user?.displayName || organizationProfile?.signatoryName || 'Authorized User'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email || organizationProfile?.email}</p>
                  </div>
                </div>
                <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg p-2 text-[11px] text-slate-600">
                  <p className="font-semibold text-slate-800 truncate">{organizationProfile?.companyName}</p>
                  <p className="text-[10px] text-slate-400 truncate">Phone: {organizationProfile?.phone}</p>
                </div>
              </div>

              <div className="py-2 space-y-1">
                <button
                  type="button"
                  onClick={() => openOrgModal()}
                  className="w-full px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center space-x-2 text-left font-medium transition-all"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Company Profile & Signatures</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="w-full px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center space-x-2 text-left font-bold transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA */}
        {activeTab === 'purchase-orders' ? (
          <button
            onClick={() => openNewPO()}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-blue-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ New PO</span>
            <span className="sm:hidden">+ PO</span>
          </button>
        ) : activeTab === 'suppliers' ? (
          <button
            onClick={() => openCustomerModal()}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-blue-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ New Customer</span>
            <span className="sm:hidden">+ Customer</span>
          </button>
        ) : (
          <button
            onClick={() => openNewPO()}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-blue-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New</span>
          </button>
        )}
      </div>
    </header>
  );
};
