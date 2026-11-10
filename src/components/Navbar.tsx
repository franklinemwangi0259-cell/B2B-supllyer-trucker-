import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Store,
  CreditCard,
  Package,
  FileText,
  DollarSign,
  BarChart3,
  AlertTriangle,
  PlusCircle,
  LogOut,
  LogIn,
  RotateCw,
  Sparkles,
  ChevronDown,
  Search,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface NavbarProps {
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch }) => {
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
    customers,
    suppliers,
  } = useApp();

  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const urgentCount = (stats?.overdueCount || 0) + (stats?.dueIn3DaysCount || 0);

  interface NavItem {
    id: 'dashboard' | 'purchase-orders' | 'suppliers' | 'inventory' | 'payments' | 'reports';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Store },
    { id: 'suppliers', label: 'Accounts', icon: CreditCard, badge: customers.filter(c => (c.currentBalance || 0) > 0).length },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: FileText, badge: stats?.overdueCount },
    { id: 'inventory', label: 'Stock Radar', icon: Package, badge: stats?.lowStockCount },
    { id: 'payments', label: 'Payment Log', icon: DollarSign },
    { id: 'reports', label: 'Reports & Aging', icon: BarChart3 },
  ];

  const currencies = [
    { code: 'INR', symbol: '₹', label: 'INR (₹)' },
    { code: 'USD', symbol: '$', label: 'USD ($)' },
    { code: 'KES', symbol: 'KSh', label: 'KES (KSh)' },
    { code: 'NGN', symbol: '₦', label: 'NGN (₦)' },
    { code: 'EUR', symbol: '€', label: 'EUR (€)' },
    { code: 'GBP', symbol: '£', label: 'GBP (£)' },
    { code: 'ZAR', symbol: 'R', label: 'ZAR (R)' },
  ];

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab('suppliers')}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shadow-inner overflow-hidden">
              <img
                src="/logo.jpg"
                alt="B2B Supply Tracker"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">B2B Supply Tracker</span>
                <span className="text-[10px] uppercase font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">Supply Chain, Trade Accounts & Purchase Orders</p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Search Shortcut Button */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="hidden md:flex items-center space-x-2 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
                title="Global Search (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search...</span>
                <kbd className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Urgent Alerts indicator */}
            {urgentCount > 0 && (
              <button
                id="urgent-alerts-pill"
                onClick={() => setActiveTab('purchase-orders')}
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold hover:bg-amber-500/25 transition-all animate-pulse"
                title={`${urgentCount} supplier payments require immediate attention`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{urgentCount} Due Soon</span>
              </button>
            )}

            {/* Currency Selector */}
            <div className="relative">
              <select
                id="currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                title="Change currency symbol"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action Button */}
            <div className="relative">
              <button
                id="quick-actions-btn"
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">+ Quick Entry</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {showQuickMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowQuickMenu(false)}
                >
                  <div className="px-3 py-1 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    Quick Transactions
                  </div>
                  <button
                    onClick={() => {
                      if (customers.length > 0) {
                        openKhataEntryModal({
                          partyType: 'customer',
                          partyId: customers[0].id,
                          partyName: customers[0].name,
                          initialType: 'gave',
                          currentBalance: customers[0].currentBalance,
                          phone: customers[0].phone,
                        });
                      } else {
                        openCustomerModal();
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                    <span>Record Credit Sale (-)</span>
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
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Record Payment Received (+)</span>
                  </button>

                  <div className="border-t border-slate-700 my-1"></div>

                  <div className="px-3 py-1 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    Add Contacts
                  </div>
                  <button
                    id="menu-add-customer"
                    onClick={() => openCustomerModal()}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>+ Add Customer</span>
                  </button>
                  <button
                    id="menu-add-supplier"
                    onClick={() => openSupplierModal()}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                    <span>+ Add Supplier</span>
                  </button>
                  <button
                    id="menu-create-po"
                    onClick={() => openNewPO()}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    <span>+ Create Purchase Order</span>
                  </button>
                  <button
                    id="menu-add-product"
                    onClick={() => openInventoryModal()}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <Package className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ Add Stock Item</span>
                  </button>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              id="refresh-data-btn"
              onClick={() => refreshData()}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              title="Refresh ledger database"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* User Auth Info / Google Sign In */}
            {user ? (
              <div className="flex items-center space-x-2 pl-1 border-l border-slate-800">
                <div
                  className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold ring-2 ring-emerald-500/40"
                  title={user.email || 'User'}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    (user.displayName || user.email || 'U')[0].toUpperCase()
                  )}
                </div>
                <button
                  id="signout-btn"
                  onClick={signOut}
                  className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="google-signin-btn"
                onClick={signInWithGoogle}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
                title="Sign in with Google to sync cloud records"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Google Auth</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex lg:hidden overflow-x-auto space-x-1 pb-2 pt-1 border-t border-slate-800/80 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="px-1 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-300">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
