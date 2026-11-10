import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { PurchaseOrder } from '../types.ts';
import { api } from '../lib/api.ts';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Send,
  Printer,
  DollarSign,
  PackagePlus,
  Eye,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  TrendingUp,
  CreditCard,
  Building,
  Calendar,
  Sparkles,
  ExternalLink,
  Layers,
} from 'lucide-react';

export const PurchaseOrdersView: React.FC = () => {
  const {
    purchaseOrders,
    suppliers,
    formatMoney,
    openNewPO,
    openPaymentModal,
    setSelectedPO,
    refreshData,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'overdue' | 'received' | 'sent' | 'draft'>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'due_asc'>('date_desc');

  // Compute key summary statistics
  const totalPOAmount = purchaseOrders.reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);
  const totalPaidAmount = purchaseOrders.reduce((sum, po) => sum + (Number(po.amountPaid) || 0), 0);
  const totalOutstanding = Math.max(0, totalPOAmount - totalPaidAmount);
  const receivedCount = purchaseOrders.filter((po) => po.status === 'received').length;
  const overdueCount = purchaseOrders.filter((po) => {
    if (po.paymentStatus === 'paid' || po.status === 'cancelled') return false;
    const today = new Date().toISOString().slice(0, 10);
    return po.dueDate < today;
  }).length;

  // Filter purchase orders
  const filteredPOs = purchaseOrders.filter((po) => {
    const query = search.toLowerCase();
    const matchesSearch =
      po.poNumber.toLowerCase().includes(query) ||
      po.supplierName.toLowerCase().includes(query) ||
      (po.notes && po.notes.toLowerCase().includes(query)) ||
      (po.items && po.items.some((it) => it.itemName.toLowerCase().includes(query)));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'unpaid') return po.paymentStatus !== 'paid' && po.status !== 'cancelled';
    if (statusFilter === 'overdue') {
      if (po.paymentStatus === 'paid' || po.status === 'cancelled') return false;
      const today = new Date().toISOString().slice(0, 10);
      return po.dueDate < today;
    }
    return po.status === statusFilter;
  });

  // Sort purchase orders
  const sortedPOs = [...filteredPOs].sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
    if (sortBy === 'date_asc') return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
    if (sortBy === 'amount_desc') return b.totalAmount - a.totalAmount;
    if (sortBy === 'due_asc') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    return 0;
  });

  const handleMarkStatus = async (poId: number, newStatus: 'sent' | 'received') => {
    try {
      setUpdatingId(poId);
      await api.updatePOStatus(poId, newStatus);
      if (newStatus === 'received') {
        showToast('Stock received! Inventory counts & vendor payables ledger updated.', 'success');
      } else {
        showToast(`PO marked as ${newStatus}`, 'info');
      }
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update PO status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = () => {
    if (purchaseOrders.length === 0) return;
    let csv = `PO Number,Supplier,Issue Date,Due Date,Status,Payment Status,Total,Paid,Balance\n`;
    purchaseOrders.forEach((po) => {
      const balance = Math.max(0, po.totalAmount - (po.amountPaid || 0));
      csv += `"${po.poNumber}","${po.supplierName}","${po.issueDate}","${po.dueDate}","${po.status}","${po.paymentStatus}",${po.totalAmount},${po.amountPaid || 0},${balance}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Zoho_Purchase_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported Purchase Orders list to CSV', 'success');
  };

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            DRAFT
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            ISSUED / SENT
          </span>
        );
      case 'received':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            RECEIVED / BILLED
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            CANCELLED
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (po: PurchaseOrder) => {
    const today = new Date().toISOString().slice(0, 10);
    const isOverdue = po.paymentStatus !== 'paid' && po.dueDate < today;

    if (po.paymentStatus === 'paid') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
          PAID
        </span>
      );
    }
    if (isOverdue) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
          <AlertCircle className="w-3 h-3" />
          <span>OVERDUE</span>
        </span>
      );
    }
    if (po.paymentStatus === 'partially_paid') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          PARTIAL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        UNPAID
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Zoho Books Executive Financial Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Purchase Volume
          </span>
          <div className="text-xl font-black text-slate-900 mt-1">{formatMoney(totalPOAmount)}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{purchaseOrders.length} total orders created</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Disbursed / Paid
          </span>
          <div className="text-xl font-black text-emerald-600 mt-1">{formatMoney(totalPaidAmount)}</div>
          <p className="text-[11px] text-emerald-700 mt-0.5">Settled to vendors</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Outstanding Payables
          </span>
          <div className="text-xl font-black text-rose-600 mt-1">{formatMoney(totalOutstanding)}</div>
          <p className="text-[11px] text-rose-700 mt-0.5">Open trade credit</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Fulfillment Rate
          </span>
          <div className="text-xl font-black text-blue-600 mt-1">
            {purchaseOrders.length > 0 ? `${Math.round((receivedCount / purchaseOrders.length) * 100)}%` : '0%'}
          </div>
          <p className="text-[11px] text-blue-700 mt-0.5">{receivedCount} received into stock</p>
        </div>
      </div>

      {/* 2. Zoho Books Views & Status Filter Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {/* Top Status Selector Tabs */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50/70 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-1">
            {[
              { id: 'all', label: 'All Bills & POs', count: purchaseOrders.length },
              { id: 'unpaid', label: 'Unpaid / Open', count: purchaseOrders.filter((p) => p.paymentStatus !== 'paid').length },
              { id: 'overdue', label: 'Overdue', count: overdueCount, alert: true },
              { id: 'received', label: 'Billed / Received', count: receivedCount },
              { id: 'sent', label: 'Issued / In Transit', count: purchaseOrders.filter((p) => p.status === 'sent').length },
              { id: 'draft', label: 'Drafts', count: purchaseOrders.filter((p) => p.status === 'draft').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    statusFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : tab.alert && tab.count > 0
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 shrink-0 ml-3">
            <button
              onClick={handleExportCSV}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 text-xs font-bold transition-all"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search, Filter & Sort Toolbar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by PO #, Vendor Name, or Item details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <div className="flex items-center space-x-1 text-xs text-slate-600">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="date_desc">Issue Date (Newest)</option>
                <option value="date_asc">Issue Date (Oldest)</option>
                <option value="due_asc">Due Date (Earliest)</option>
                <option value="amount_desc">Amount (Highest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Vendor / Supplier</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPOs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 space-y-2">
                    <FileText className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs font-medium">No purchase orders matching criteria</p>
                    <button
                      onClick={() => openNewPO()}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-blue-500"
                    >
                      + Create First Purchase Order
                    </button>
                  </td>
                </tr>
              ) : (
                sortedPOs.map((po) => {
                  const balanceDue = Math.max(0, po.totalAmount - (po.amountPaid || 0));
                  const isOverdue = po.paymentStatus !== 'paid' && po.dueDate < new Date().toISOString().slice(0, 10);

                  return (
                    <tr
                      key={po.id}
                      onClick={() => setSelectedPO(po)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-all group"
                    >
                      <td className="py-3 px-4 text-slate-500 font-medium whitespace-nowrap">
                        {po.issueDate}
                      </td>

                      <td className="py-3 px-4 font-bold text-blue-600 group-hover:underline whitespace-nowrap">
                        {po.poNumber}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{po.supplierName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {po.dueDate}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(po.status)}</td>

                      <td className="py-3 px-4 whitespace-nowrap">{getPaymentStatusBadge(po)}</td>

                      <td className="py-3 px-4 text-right font-extrabold text-slate-900 whitespace-nowrap">
                        {formatMoney(po.totalAmount)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            balanceDue > 0 ? 'text-rose-600' : 'text-slate-400'
                          }`}
                        >
                          {formatMoney(balanceDue)}
                        </span>
                      </td>

                      <td
                        className="py-3 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          {po.status === 'sent' && (
                            <button
                              onClick={() => handleMarkStatus(po.id, 'received')}
                              disabled={updatingId === po.id}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold shadow-xs transition-all flex items-center space-x-1"
                              title="Receive Stock and Convert to Bill"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Receive Stock</span>
                            </button>
                          )}

                          {balanceDue > 0 && (
                            <button
                              onClick={() => openPaymentModal(po)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold shadow-xs transition-all flex items-center space-x-1"
                              title="Record Payment"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Pay</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedPO(po)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-all"
                            title="View Formal PDF Bill"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
