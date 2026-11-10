import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  CreditCard,
  FileText,
  Building,
  CheckCircle2,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const {
    payments,
    suppliers,
    purchaseOrders,
    formatMoney,
    openPaymentModal,
    setSelectedPO,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  const filteredPayments = payments.filter((p) => {
    const supp = suppliers.find((s) => s.id === p.supplierId);
    const suppName = supp ? supp.name.toLowerCase() : '';
    const ref = p.referenceNumber ? p.referenceNumber.toLowerCase() : '';
    const notes = p.notes ? p.notes.toLowerCase() : '';
    const query = search.toLowerCase();

    const matchesSearch = suppName.includes(query) || ref.includes(query) || notes.includes(query);
    const matchesSupplier = selectedSupplierId === 'all' || p.supplierId === Number(selectedSupplierId);
    const matchesMethod = selectedMethod === 'all' || p.paymentMethod === selectedMethod;

    return matchesSearch && matchesSupplier && matchesMethod;
  });

  const totalPaidSum = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const paymentMethods = Array.from(new Set(payments.map((p) => p.paymentMethod).filter(Boolean)));

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Supplier Payment Log</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical settlement records and supplier debit transactions
          </p>
        </div>

        <button
          id="btn-log-new-payment"
          onClick={() => openPaymentModal()}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Paid Out</p>
            <p className="text-xl font-black text-slate-900 mt-1">{formatMoney(totalPaidSum)}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recorded Transactions</p>
            <p className="text-xl font-black text-slate-900 mt-1">{payments.length}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Settlement</p>
            <p className="text-xl font-black text-slate-900 mt-1">
              {formatMoney(payments.length > 0 ? totalPaidSum / payments.length : 0)}
            </p>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by supplier, reference #, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Supplier filter */}
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Payment Method filter */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Payment Methods</option>
            {paymentMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Method & Reference</th>
                <th className="py-3.5 px-4">Linked PO</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-4 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <DollarSign className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No payment logs found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {payments.length === 0
                        ? 'Record your first supplier settlement payment using the button above'
                        : 'No payments match the current filters'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const supp = suppliers.find((s) => s.id === p.supplierId);
                  const linkedPO = p.poId ? purchaseOrders.find((po) => po.id === p.poId) : null;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {p.paymentDate}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {supp ? supp.name : `Supplier #${p.supplierId}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-medium text-slate-800">{p.paymentMethod}</span>
                          {p.referenceNumber && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded">
                              Ref: {p.referenceNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {linkedPO ? (
                          <button
                            onClick={() => setSelectedPO(linkedPO)}
                            className="inline-flex items-center space-x-1 font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                          >
                            <span>{linkedPO.poNumber}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">General Account</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {p.notes || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                        {formatMoney(p.amount)}
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
