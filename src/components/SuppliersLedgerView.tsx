import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Customer, Supplier, CustomerTransaction, PurchaseOrder, Payment } from '../types.ts';
import {
  Users,
  Building2,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageCircle,
  FileText,
  Download,
  Printer,
  Share2,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  ChevronRight,
  Sparkles,
  Wallet,
  Clock,
  Filter,
  ArrowUpDown,
  BookOpen,
  Send,
  Zap,
  CheckSquare,
  Square,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const SuppliersLedgerView: React.FC = () => {
  const {
    customers,
    suppliers,
    customerTransactions,
    purchaseOrders,
    payments,
    totalReceivables,
    totalPayables,
    netKhataPosition,
    customerRiskProfiles,
    formatMoney,
    currency,
    openCustomerModal,
    openSupplierModal,
    openKhataEntryModal,
    openBulkImportModal,
    openAutomatedReminderModal,
    openBatchReminderModal,
    openCustomerPortalModal,
    sendWhatsAppReminder,
    deleteCustomer,
    deleteSupplierData,
    deleteCustomerTransaction,
    showToast,
  } = useApp();

  // Tab: 'customers' (You'll Get / Receivables) vs 'suppliers' (You'll Give / Trade Payables)
  const [partyType, setPartyType] = useState<'customers' | 'suppliers'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'pending' | 'settled' | 'over_limit' | 'high_risk'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'amount_high' | 'name_asc' | 'risk_high'>('recent');

  // Selected party for right-hand ledger drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);

  // Multi-Select for Batch Operations
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);

  // Active customer & supplier
  const activeCustomer = useMemo(() => {
    if (selectedCustomerId) {
      const found = customers.find((c) => c.id === selectedCustomerId);
      if (found) return found;
    }
    return customers.length > 0 ? customers[0] : null;
  }, [customers, selectedCustomerId]);

  const activeSupplier = useMemo(() => {
    if (selectedSupplierId) {
      const found = suppliers.find((s) => s.id === selectedSupplierId);
      if (found) return found;
    }
    return suppliers.length > 0 ? suppliers[0] : null;
  }, [suppliers, selectedSupplierId]);

  // Risk profile lookup
  const activeCustomerRisk = useMemo(() => {
    if (!activeCustomer) return null;
    return customerRiskProfiles.find((r) => r.customerId === activeCustomer.id) || null;
  }, [activeCustomer, customerRiskProfiles]);

  // Filter & sort customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.phone && c.phone.includes(searchQuery)) ||
          (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        const risk = customerRiskProfiles.find((r) => r.customerId === c.id);
        const bal = c.currentBalance || 0;

        if (filterBy === 'pending') return bal > 0;
        if (filterBy === 'settled') return bal === 0;
        if (filterBy === 'over_limit') return risk?.isOverLimit;
        if (filterBy === 'high_risk') return risk?.riskTier === 'high' || risk?.riskTier === 'critical';
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'amount_high') return (b.currentBalance || 0) - (a.currentBalance || 0);
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'risk_high') {
          const rA = customerRiskProfiles.find((r) => r.customerId === a.id)?.riskScore || 0;
          const rB = customerRiskProfiles.find((r) => r.customerId === b.id)?.riskScore || 0;
          return rB - rA;
        }
        return 0;
      });
  }, [customers, searchQuery, filterBy, sortBy, customerRiskProfiles]);

  // Filter & sort suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers
      .filter((s) => {
        const matchesSearch =
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.phone && s.phone.includes(searchQuery)) ||
          (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        if (filterBy === 'pending') return (s.currentBalance || 0) > 0;
        if (filterBy === 'settled') return (s.currentBalance || 0) === 0;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'amount_high') return (b.currentBalance || 0) - (a.currentBalance || 0);
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [suppliers, searchQuery, filterBy, sortBy]);

  // Batch Selection Handlers
  const handleToggleSelectCustomer = (id: number) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCustomers = () => {
    if (selectedCustomerIds.length === filteredCustomers.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(filteredCustomers.map((c) => c.id));
    }
  };

  const handleOpenBatchReminders = () => {
    const selected = customers.filter((c) => selectedCustomerIds.includes(c.id));
    if (selected.length === 0) {
      showToast('Select at least one customer for batch action', 'info');
      return;
    }
    openBatchReminderModal(selected);
  };

  // Generate Chronological Khata Statement for Active Customer
  const customerLedgerEntries = useMemo(() => {
    if (!activeCustomer) return [];

    const rawTxs = customerTransactions.filter((t) => t.customerId === activeCustomer.id);
    const sorted = [...rawTxs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id
    );

    let running = 0;
    return sorted.map((tx) => {
      const gaveAmount = tx.type === 'gave' ? tx.amount : 0;
      const gotAmount = tx.type === 'got' ? tx.amount : 0;
      running += gaveAmount - gotAmount;

      return {
        id: tx.id,
        date: tx.date,
        type: tx.type,
        description: tx.description,
        billNumber: tx.billNumber,
        paymentMode: tx.paymentMode,
        youGave: gaveAmount,
        youGot: gotAmount,
        runningBalance: running,
      };
    });
  }, [activeCustomer, customerTransactions]);

  // Generate Chronological Khata Statement for Active Supplier
  const supplierLedgerEntries = useMemo(() => {
    if (!activeSupplier) return [];

    const sPOs = purchaseOrders.filter((po) => po.supplierId === activeSupplier.id);
    const sPayments = payments.filter((p) => p.supplierId === activeSupplier.id);

    const combined: Array<{
      id: string;
      date: string;
      type: 'purchase_order' | 'payment';
      description: string;
      reference: string;
      youGave: number;
      youGot: number;
      timestamp: number;
    }> = [];

    sPOs.forEach((po) => {
      combined.push({
        id: `po-${po.id}`,
        date: po.issueDate,
        type: 'purchase_order',
        description: po.notes || `PO ${po.poNumber} (${po.items?.length || 1} items)`,
        reference: po.poNumber,
        youGave: 0,
        youGot: po.totalAmount,
        timestamp: new Date(po.issueDate).getTime() + (po.id || 0),
      });
    });

    sPayments.forEach((pm) => {
      combined.push({
        id: `pm-${pm.id}`,
        date: pm.paymentDate,
        type: 'payment',
        description: pm.notes || `Payment (${pm.paymentMethod})`,
        reference: pm.referenceNumber || `Voucher #${pm.id}`,
        youGave: pm.amount,
        youGot: 0,
        timestamp: new Date(pm.paymentDate).getTime() + 1000 + (pm.id || 0),
      });
    });

    combined.sort((a, b) => a.timestamp - b.timestamp);

    let running = 0;
    return combined.map((entry) => {
      running += entry.youGot - entry.youGave;
      return {
        ...entry,
        runningBalance: running,
      };
    });
  }, [activeSupplier, purchaseOrders, payments]);

  // Export Khata Statement to CSV
  const handleExportStatement = () => {
    const isCust = partyType === 'customers';
    const partyName = isCust ? activeCustomer?.name : activeSupplier?.name;
    if (!partyName) return;

    const entries = isCust ? customerLedgerEntries : supplierLedgerEntries;
    if (entries.length === 0) {
      showToast('No transaction entries to export for this party', 'info');
      return;
    }

    let csv = `Date,Description,Bill / Ref,You Gave (-),You Got (+),Running Balance\n`;
    entries.forEach((e: any) => {
      csv += `"${e.date}","${(e.description || '').replace(/"/g, '""')}","${e.billNumber || e.reference || ''}",${e.youGave || 0},${e.youGot || 0},${e.runningBalance || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Account_Statement_${partyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported account statement for ${partyName}`, 'success');
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. TOP DUAL SUMMARY HEADER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand/Shop Name pill */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-inner shadow-black/10">
              {partyType === 'customers' ? <Users className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  B2B Trade & Customer Accounts
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Real-time Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Trade accounts, credit limits, payment links & stock synchronization
              </p>
            </div>
          </div>

          {/* Dual Balance Cards: "You'll Give" (Red) and "You'll Get" (Green) */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* You'll Give (Supplier Payables) */}
            <div
              onClick={() => setPartyType('suppliers')}
              className={`flex-1 sm:flex-initial cursor-pointer px-4 py-2.5 rounded-xl border transition-all ${
                partyType === 'suppliers'
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                  : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between space-x-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center space-x-1">
                    <span>You'll Give:</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                  </span>
                  <div className="text-lg font-black text-rose-900 tracking-tight">
                    {formatMoney(totalPayables)}
                  </div>
                </div>
                <span className="text-[11px] bg-rose-200/70 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                  {suppliers.length} Suppliers
                </span>
              </div>
            </div>

            {/* You'll Get (Customer Receivables) */}
            <div
              onClick={() => setPartyType('customers')}
              className={`flex-1 sm:flex-initial cursor-pointer px-4 py-2.5 rounded-xl border transition-all ${
                partyType === 'customers'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                  : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between space-x-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center space-x-1">
                    <span>You'll Get:</span>
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                  </span>
                  <div className="text-lg font-black text-emerald-900 tracking-tight">
                    {formatMoney(totalReceivables)}
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-200/70 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {customers.length} Customers
                </span>
              </div>
            </div>

            {/* Bulk Import */}
            <div className="flex items-center space-x-2">
              <button
                onClick={openBulkImportModal}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all border border-slate-200 font-bold text-xs flex items-center space-x-1.5"
                title="Bulk import customers or suppliers"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="hidden lg:inline">Sample / Bulk Import</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Header Tabs: Customers vs Suppliers + Batch Action Trigger */}
        <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPartyType('customers')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                partyType === 'customers'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customers</span>
              <span
                className={`ml-1.5 px-2 py-0.5 text-[10px] font-black rounded-full ${
                  partyType === 'customers'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {customers.length}
              </span>
            </button>

            <button
              onClick={() => setPartyType('suppliers')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                partyType === 'suppliers'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Suppliers</span>
              <span
                className={`ml-1.5 px-2 py-0.5 text-[10px] font-black rounded-full ${
                  partyType === 'suppliers'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {suppliers.length}
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Batch Action Bar if customers selected */}
            {partyType === 'customers' && selectedCustomerIds.length > 0 && (
              <button
                onClick={handleOpenBatchReminders}
                className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md shadow-purple-600/20 transition-all animate-in zoom-in-95"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Batch Actions ({selectedCustomerIds.length})</span>
              </button>
            )}

            {partyType === 'customers' ? (
              <button
                onClick={() => openCustomerModal()}
                className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-blue-600/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Customer</span>
              </button>
            ) : (
              <button
                onClick={() => openSupplierModal()}
                className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-purple-600/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Supplier</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. MASTER-DETAIL KHATABOOK SPLIT CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: The Parties List */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[780px]">
          {/* Search, Filter & Sort Bar */}
          <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder={
                  partyType === 'customers'
                    ? 'Search customers (Name, Phone, Address)...'
                    : 'Search suppliers (Name, Category or Phone)...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1 text-xs text-slate-600">
                <Filter className="w-3 h-3 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-500">Filter:</span>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">All ({partyType === 'customers' ? customers.length : suppliers.length})</option>
                  <option value="pending">Pending Balance</option>
                  <option value="settled">Settled (Zero)</option>
                  {partyType === 'customers' && (
                    <>
                      <option value="over_limit">⚠️ Over Credit Limit</option>
                      <option value="high_risk">🔴 High Risk Tier</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center space-x-1 text-xs text-slate-600">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-500">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="amount_high">Highest Amount</option>
                  {partyType === 'customers' && <option value="risk_high">Risk Score</option>}
                  <option value="name_asc">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* List Table Header with Select-All Option */}
          <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <div className="flex items-center space-x-2">
              {partyType === 'customers' && (
                <button
                  onClick={handleSelectAllCustomers}
                  className="text-slate-400 hover:text-slate-700"
                  title="Select All"
                >
                  {selectedCustomerIds.length > 0 && selectedCustomerIds.length === filteredCustomers.length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              <span>Party & Activity</span>
            </div>
            <span>Balance</span>
          </div>

          {/* The Scrollable List Rows */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 no-scrollbar">
            {partyType === 'customers' ? (
              filteredCustomers.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No customers found</p>
                  <button
                    onClick={() => openCustomerModal()}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                  >
                    + Add New Customer
                  </button>
                </div>
              ) : (
                filteredCustomers.map((customer) => {
                  const isSelected = activeCustomer?.id === customer.id;
                  const isChecked = selectedCustomerIds.includes(customer.id);
                  const bal = customer.currentBalance || 0;
                  const isYouGet = bal > 0;
                  const isYouGive = bal < 0;

                  const risk = customerRiskProfiles.find((r) => r.customerId === customer.id);
                  const isOverLimit = risk?.isOverLimit;
                  const creditLimit = customer.creditLimit || 0;
                  const limitRatio = creditLimit > 0 ? bal / creditLimit : 0;
                  const isCreditWarning = isOverLimit || (creditLimit > 0 && limitRatio >= 0.8) || risk?.riskTier === 'high' || risk?.riskTier === 'critical';

                  const initials = customer.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <div
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-100/90 border-l-4 border-l-emerald-600'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Left: Checkbox, Avatar, Name & Risk Pill */}
                      <div className="flex items-center space-x-3 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectCustomer(customer.id);
                          }}
                          className="text-slate-400 hover:text-slate-700 shrink-0"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                            customer.avatarColor || 'bg-emerald-600 text-white'
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {customer.name}
                            </h4>
                            {/* Health Indicator Badge */}
                            {bal <= 0 ? (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> PAID
                              </span>
                            ) : isOverLimit || risk?.riskTier === 'critical' ? (
                              <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-300 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> OVER LIMIT
                              </span>
                            ) : isCreditWarning ? (
                              <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> CREDIT WARNING
                              </span>
                            ) : (
                              <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 font-semibold px-1.5 py-0.2 rounded-full">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium mt-0.5">
                            <span className="text-slate-400">{customer.lastActivity || 'Recently'}</span>
                            {customer.phone && (
                              <span className="hidden sm:inline text-slate-400">• {customer.phone}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Quick Payment Link Trigger */}
                      <div className="text-right shrink-0 ml-3">
                        {isYouGet ? (
                          <div>
                            <div className="text-sm font-black text-emerald-600 tracking-tight">
                              {formatMoney(bal)}
                            </div>
                            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                              YOU'LL GET
                            </div>
                          </div>
                        ) : isYouGive ? (
                          <div>
                            <div className="text-sm font-black text-rose-600 tracking-tight">
                              {formatMoney(Math.abs(bal))}
                            </div>
                            <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                              YOU'LL GIVE
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            SETTLED
                          </div>
                        )}

                        {/* Payment Link & Portal Triggers */}
                        <div className="flex items-center space-x-1 justify-end mt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openCustomerPortalModal(customer);
                            }}
                            className="inline-flex items-center space-x-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-all"
                            title="Open Customer Self-Service Statement & Payment Portal"
                          >
                            <FileText className="w-2.5 h-2.5" />
                            <span>Portal</span>
                          </button>

                          {isYouGet && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openAutomatedReminderModal({
                                  id: customer.id,
                                  name: customer.name,
                                  phone: customer.phone,
                                  email: customer.email,
                                  balance: bal,
                                  type: 'customer',
                                });
                              }}
                              className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-all"
                              title="Generate 1-Click Payment Link (Stripe/Razorpay/M-Pesa)"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>Pay Link</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* Suppliers List */
              filteredSuppliers.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No suppliers found</p>
                  <button
                    onClick={() => openSupplierModal()}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold"
                  >
                    + Add New Supplier
                  </button>
                </div>
              ) : (
                filteredSuppliers.map((supplier) => {
                  const isSelected = activeSupplier?.id === supplier.id;
                  const bal = supplier.currentBalance || 0;
                  const isDue = bal > 0;

                  const initials = supplier.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <div
                      key={supplier.id}
                      onClick={() => setSelectedSupplierId(supplier.id)}
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-100/90 border-l-4 border-l-rose-600'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                            supplier.avatarColor || 'bg-purple-600 text-white'
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {supplier.name}
                          </h4>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium mt-0.5">
                            <span className="text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-semibold">
                              {supplier.category || 'Wholesale'}
                            </span>
                            <span className="text-slate-400">• {supplier.paymentTerms}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        {isDue ? (
                          <div>
                            <div className="text-sm font-black text-rose-600 tracking-tight">
                              {formatMoney(bal)}
                            </div>
                            <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                              YOU'LL GIVE
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            SETTLED
                          </div>
                        )}

                        {isDue && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openKhataEntryModal({
                                partyType: 'supplier',
                                partyId: supplier.id,
                                partyName: supplier.name,
                                initialType: 'gave',
                                currentBalance: bal,
                                phone: supplier.phone,
                              });
                            }}
                            className="mt-1 inline-flex items-center space-x-1 text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md transition-all"
                          >
                            <DollarSign className="w-2.5 h-2.5" />
                            <span>Pay &gt;</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: The Interactive Party Khata Ledger Statement & Risk Profile */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[780px]">
          {partyType === 'customers' ? (
            activeCustomer ? (
              <>
                {/* Party Profile Header Bar */}
                <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-inner ${
                        activeCustomer.avatarColor || 'bg-emerald-600 text-white'
                      }`}
                    >
                      {activeCustomer.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {activeCustomer.name}
                        </h3>
                        <button
                          onClick={() => openCustomerModal(activeCustomer)}
                          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                          title="Edit Customer Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-300 mt-0.5">
                        {activeCustomer.phone && (
                          <span className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{activeCustomer.phone}</span>
                          </span>
                        )}
                        {activeCustomer.address && (
                          <span className="flex items-center space-x-1 text-slate-400">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{activeCustomer.address}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Link, Customer Portal, WhatsApp & Print Action Dock */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openCustomerPortalModal(activeCustomer)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                      title="Open Self-Service Customer Statement & 1-Click Pay Portal"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Customer Portal</span>
                    </button>

                    <button
                      onClick={() =>
                        openAutomatedReminderModal({
                          id: activeCustomer.id,
                          name: activeCustomer.name,
                          phone: activeCustomer.phone,
                          email: activeCustomer.email,
                          balance: activeCustomer.currentBalance || 0,
                          type: 'customer',
                        })
                      }
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                      title="Generate Instant Payment Link & QR Code"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Pay Link</span>
                    </button>

                    <button
                      onClick={() =>
                        sendWhatsAppReminder({
                          name: activeCustomer.name,
                          phone: activeCustomer.phone,
                          balance: activeCustomer.currentBalance || 0,
                          type: 'customer',
                        })
                      }
                      className="p-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow-sm transition-all"
                      title="Send WhatsApp Payment Reminder"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleExportStatement}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                      title="Export CSV Statement"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handlePrintStatement}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                      title="Print PDF Statement"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Smart Credit Risk & Utilization Bar */}
                {activeCustomerRisk && (
                  <div className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {/* Balance */}
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Net Balance</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        {formatMoney(activeCustomer.currentBalance || 0)}
                      </div>
                    </div>

                    {/* Credit Limit & Utilization */}
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                        <span>Credit Limit</span>
                        <span className={activeCustomerRisk.isOverLimit ? 'text-rose-600' : 'text-slate-600'}>
                          {activeCustomerRisk.utilizationPct}% Used
                        </span>
                      </div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        {formatMoney(activeCustomer.creditLimit || 5000)}
                      </div>
                      {/* Mini progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            activeCustomerRisk.isOverLimit
                              ? 'bg-rose-500'
                              : activeCustomerRisk.utilizationPct > 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, activeCustomerRisk.utilizationPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Risk Tier & Average DSO */}
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Risk Tier (DSO)</div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                            activeCustomerRisk.riskTier === 'low'
                              ? 'bg-emerald-100 text-emerald-800'
                              : activeCustomerRisk.riskTier === 'medium'
                              ? 'bg-blue-100 text-blue-800'
                              : activeCustomerRisk.riskTier === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {activeCustomerRisk.riskLabel}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          ~{activeCustomerRisk.avgPaymentDays}d avg
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Khata Ledger Statement Table */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-1 border-b border-slate-200">
                    <span className="uppercase tracking-wider">Entries ({customerLedgerEntries.length})</span>
                    <div className="flex items-center space-x-3 text-[11px]">
                      <span className="text-rose-600">You Gave (-)</span>
                      <span className="text-emerald-600">You Got (+)</span>
                      <span className="text-slate-800">Balance</span>
                    </div>
                  </div>

                  {customerLedgerEntries.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500 font-medium">No transactions recorded yet</p>
                      <p className="text-[11px] text-slate-400">
                        Use the dual buttons below to record goods given on credit or payments received
                      </p>
                    </div>
                  ) : (
                    customerLedgerEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all flex items-center justify-between shadow-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-800">
                              {entry.description}
                            </span>
                            {entry.billNumber && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded">
                                {entry.billNumber}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                            <span>{entry.date}</span>
                            {entry.paymentMode && <span>• {entry.paymentMode}</span>}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-right">
                          <div className="w-20">
                            {entry.youGave > 0 ? (
                              <span className="text-xs font-black text-rose-600">
                                - {formatMoney(entry.youGave)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </div>
                          <div className="w-20">
                            {entry.youGot > 0 ? (
                              <span className="text-xs font-black text-emerald-600">
                                + {formatMoney(entry.youGot)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </div>
                          <div className="w-24">
                            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                              {formatMoney(entry.runningBalance)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* SIGNATURE DUAL BOTTOM ACTION DOCK */}
                <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center gap-3">
                  <button
                    onClick={() =>
                      openKhataEntryModal({
                        partyType: 'customer',
                        partyId: activeCustomer.id,
                        partyName: activeCustomer.name,
                        initialType: 'gave',
                        currentBalance: activeCustomer.currentBalance,
                        phone: activeCustomer.phone,
                      })
                    }
                    className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center space-x-2 transform active:scale-98"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>YOU GAVE (-)</span>
                  </button>

                  <button
                    onClick={() =>
                      openKhataEntryModal({
                        partyType: 'customer',
                        partyId: activeCustomer.id,
                        partyName: activeCustomer.name,
                        initialType: 'got',
                        currentBalance: activeCustomer.currentBalance,
                        phone: activeCustomer.phone,
                      })
                    }
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 transform active:scale-98"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>YOU GOT (+)</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                <Users className="w-12 h-12 text-slate-300" />
                <p className="text-sm font-semibold">Select a customer from the left list</p>
              </div>
            )
          ) : (
            /* Suppliers Khata Ledger Pane */
            activeSupplier ? (
              <>
                <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-inner ${
                        activeSupplier.avatarColor || 'bg-purple-600 text-white'
                      }`}
                    >
                      {activeSupplier.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {activeSupplier.name}
                        </h3>
                        <button
                          onClick={() => openSupplierModal(activeSupplier)}
                          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-300 mt-0.5">
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                          {activeSupplier.category}
                        </span>
                        {activeSupplier.phone && <span>• {activeSupplier.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        sendWhatsAppReminder({
                          name: activeSupplier.name,
                          phone: activeSupplier.phone,
                          balance: activeSupplier.currentBalance || 0,
                          type: 'supplier',
                        })
                      }
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 border border-slate-700"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp Statement</span>
                    </button>
                    <button
                      onClick={handleExportStatement}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                      title="Export CSV Statement"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handlePrintStatement}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                      title="Print PDF Statement"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">Owed to Supplier:</span>
                  </div>
                  <div>
                    {(activeSupplier.currentBalance || 0) > 0 ? (
                      <span className="text-sm font-black text-rose-700 bg-rose-100/90 border border-rose-200 px-3 py-1 rounded-xl">
                        You'll Give {formatMoney(activeSupplier.currentBalance)} ↗
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-xl">
                        Settled (Zero Balance)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-1 border-b border-slate-200">
                    <span className="uppercase tracking-wider">
                      Orders & Payments ({supplierLedgerEntries.length})
                    </span>
                    <div className="flex items-center space-x-3 text-[11px]">
                      <span className="text-rose-600">You Gave (Paid)</span>
                      <span className="text-emerald-600">You Got (Stock)</span>
                      <span className="text-slate-800">Debt Balance</span>
                    </div>
                  </div>

                  {supplierLedgerEntries.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500 font-medium">No orders or payments logged yet</p>
                    </div>
                  ) : (
                    supplierLedgerEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all flex items-center justify-between shadow-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-800">
                              {entry.description}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded">
                              {entry.reference}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            <span>{entry.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-right">
                          <div className="w-20">
                            {entry.youGave > 0 ? (
                              <span className="text-xs font-black text-rose-600">
                                - {formatMoney(entry.youGave)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </div>
                          <div className="w-20">
                            {entry.youGot > 0 ? (
                              <span className="text-xs font-black text-emerald-600">
                                + {formatMoney(entry.youGot)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </div>
                          <div className="w-24">
                            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                              {formatMoney(entry.runningBalance)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center gap-3">
                  <button
                    onClick={() =>
                      openKhataEntryModal({
                        partyType: 'supplier',
                        partyId: activeSupplier.id,
                        partyName: activeSupplier.name,
                        initialType: 'gave',
                        currentBalance: activeSupplier.currentBalance,
                        phone: activeSupplier.phone,
                      })
                    }
                    className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center space-x-2 transform active:scale-98"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>RECORD PAYMENT (-)</span>
                  </button>

                  <button
                    onClick={() =>
                      openKhataEntryModal({
                        partyType: 'supplier',
                        partyId: activeSupplier.id,
                        partyName: activeSupplier.name,
                        initialType: 'got',
                        currentBalance: activeSupplier.currentBalance,
                        phone: activeSupplier.phone,
                      })
                    }
                    className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2 transform active:scale-98"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>RECORD STOCK PO (+)</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                <Building2 className="w-12 h-12 text-slate-300" />
                <p className="text-sm font-semibold">Select a supplier from the left list</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
