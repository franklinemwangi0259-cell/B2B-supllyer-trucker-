import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { CashbookEntry } from '../types.ts';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Calendar,
  Filter,
  Download,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  FileSpreadsheet,
  X,
} from 'lucide-react';

export const CashbookView: React.FC = () => {
  const {
    cashbookEntries,
    addCashbookEntry,
    deleteCashbookEntry,
    formatMoney,
    currency,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'in' | 'out'>('in');

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Sales');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState('Cash');

  // Calculations
  const todayStr = new Date().toISOString().slice(0, 10);

  const totalCashIn = useMemo(() => {
    return cashbookEntries.filter((e) => e.type === 'in').reduce((sum, e) => sum + e.amount, 0);
  }, [cashbookEntries]);

  const totalCashOut = useMemo(() => {
    return cashbookEntries.filter((e) => e.type === 'out').reduce((sum, e) => sum + e.amount, 0);
  }, [cashbookEntries]);

  const netCashBalance = totalCashIn - totalCashOut;

  const todayCashIn = useMemo(() => {
    return cashbookEntries
      .filter((e) => e.type === 'in' && e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [cashbookEntries, todayStr]);

  const todayCashOut = useMemo(() => {
    return cashbookEntries
      .filter((e) => e.type === 'out' && e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [cashbookEntries, todayStr]);

  const filteredEntries = useMemo(() => {
    return cashbookEntries
      .filter((e) => {
        if (filterType !== 'all' && e.type !== filterType) return false;
        const q = search.toLowerCase();
        return (
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.contactName && e.contactName.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id);
  }, [cashbookEntries, filterType, search]);

  const handleOpenAdd = (type: 'in' | 'out') => {
    setModalType(type);
    setAmount('');
    setCategory(type === 'in' ? 'Sales' : 'Shop Expense');
    setDescription('');
    setContactName('');
    setDate(todayStr);
    setPaymentMode('Cash');
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return;

    addCashbookEntry({
      type: modalType,
      amount: num,
      category,
      paymentMode,
      date,
      description: description || (modalType === 'in' ? 'Cash Received' : 'Expense Paid'),
      contactName,
    });

    setIsAddModalOpen(false);
  };

  const handleExportCSV = () => {
    if (cashbookEntries.length === 0) return;
    let csv = `Date,Type,Amount,Category,PaymentMode,Contact,Description\n`;
    cashbookEntries.forEach((e) => {
      csv += `"${e.date}","${e.type.toUpperCase()}","${e.amount}","${e.category}","${e.paymentMode}","${e.contactName || ''}","${(e.description || '').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cashbook_Register_${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported Cashbook register', 'success');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner with Today Cash In / Out and Net in Hand */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-black text-xl shadow-inner">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Daily Cashbook & Register
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Track counter cash flow, petty cash, shop expenses and live closing cash in hand
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenAdd('in')}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ Cash In</span>
            </button>
            <button
              onClick={() => handleOpenAdd('out')}
              className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>+ Cash Out</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all border border-slate-200"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Total Cash In
              </span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-950 mt-1">
              {formatMoney(totalCashIn)}
            </div>
            <p className="text-[10px] text-emerald-700 mt-0.5">Today: +{formatMoney(todayCashIn)}</p>
          </div>

          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                Total Cash Out
              </span>
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-black text-rose-950 mt-1">
              {formatMoney(totalCashOut)}
            </div>
            <p className="text-[10px] text-rose-700 mt-0.5">Today: -{formatMoney(todayCashOut)}</p>
          </div>

          <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Net Cash in Hand
              </span>
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300 mt-1">
              {formatMoney(netCashBalance)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Live store register closing balance</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by note, category, or customer/supplier name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              All ({cashbookEntries.length})
            </button>
            <button
              onClick={() => setFilterType('in')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'in' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Cash In
            </button>
            <button
              onClick={() => setFilterType('out')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'out' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Cash Out
            </button>
          </div>
        </div>

        {/* Entries Table */}
        <div className="divide-y divide-slate-100 overflow-hidden">
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Wallet className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-medium">No cashbook transactions found</p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isIn = entry.type === 'in';
              return (
                <div
                  key={entry.id}
                  className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 transition-all rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isIn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isIn ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{entry.description}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md">
                          {entry.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span>{entry.date}</span>
                        {entry.contactName && <span>• Party: {entry.contactName}</span>}
                        <span>• {entry.paymentMode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span
                        className={`text-sm font-black tracking-tight ${
                          isIn ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isIn ? `+ ${formatMoney(entry.amount)}` : `- ${formatMoney(entry.amount)}`}
                      </span>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {isIn ? 'Cash In' : 'Cash Out'}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteCashbookEntry(entry.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 transition-all"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Cashbook Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
            <div
              className={`px-6 py-4 text-white flex items-center justify-between ${
                modalType === 'in' ? 'bg-emerald-700' : 'bg-rose-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5" />
                <h2 className="text-base font-bold">
                  {modalType === 'in' ? 'Record Cash In' : 'Record Cash Out'}
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    autoFocus
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {modalType === 'in' ? (
                      <>
                        <option value="Sales">Direct Sales Cash</option>
                        <option value="Customer Repayment">Customer Account Repayment</option>
                        <option value="Bank Withdrawal">Bank Cash Withdrawal</option>
                        <option value="Owner Capital">Owner Added Capital</option>
                        <option value="Other">Other Income</option>
                      </>
                    ) : (
                      <>
                        <option value="Shop Expense">Shop Supplies / Petty Cash</option>
                        <option value="Supplier Payment">Supplier Repayment</option>
                        <option value="Rent">Shop Rent</option>
                        <option value="Salaries">Staff Salary / Wages</option>
                        <option value="Utilities">Electricity / Water / Internet</option>
                        <option value="Transport">Delivery / Fuel</option>
                        <option value="Other">Other Expense</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact / Party (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Counter Customer, Electrician, Landlord"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning counter cash collection"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md ${
                    modalType === 'in' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
