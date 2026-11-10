import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Customer } from '../types.ts';
import { User, Phone, Mail, MapPin, DollarSign, X, CheckCircle, ShieldCheck } from 'lucide-react';

export const CustomerModal: React.FC = () => {
  const { isCustomerModalOpen, setIsCustomerModalOpen, editingCustomer, addCustomer, updateCustomer } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(5000);
  const [initialBalance, setInitialBalance] = useState(0);
  const [balanceType, setBalanceType] = useState<'get' | 'give'>('get');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name || '');
      setPhone(editingCustomer.phone || '');
      setEmail(editingCustomer.email || '');
      setAddress(editingCustomer.address || '');
      setCreditLimit(editingCustomer.creditLimit || 5000);
      const bal = editingCustomer.currentBalance || 0;
      setInitialBalance(Math.abs(bal));
      setBalanceType(bal >= 0 ? 'get' : 'give');
      setNotes(editingCustomer.notes || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCreditLimit(5000);
      setInitialBalance(0);
      setBalanceType('get');
      setNotes('');
    }
  }, [editingCustomer, isCustomerModalOpen]);

  if (!isCustomerModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const netBal = balanceType === 'get' ? Number(initialBalance) : -Number(initialBalance);

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name,
        phone,
        email,
        address,
        creditLimit: Number(creditLimit),
        currentBalance: netBal,
        notes,
      });
    } else {
      addCustomer({
        name,
        phone: phone || '+91 98000 00000',
        email,
        address,
        creditLimit: Number(creditLimit),
        currentBalance: netBal,
        notes,
      });
    }

    setIsCustomerModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {editingCustomer ? 'Edit Customer Account' : 'Add New Customer Account'}
              </h2>
              <p className="text-xs text-emerald-100">
                Track customer credit sales, payments & automated WhatsApp reminders
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCustomerModalOpen(false)}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Customer Name / Business *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Arya Sharma, Kirana Store, Super Bakery"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Phone / WhatsApp Number</span>
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email (Optional)</span>
              </label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Billing / Delivery Address</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Shop 12, Market Square, Mumbai"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Opening Balance */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Opening Balance
              </span>
              <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBalanceType('get')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    balanceType === 'get'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  You'll Get (Customer Owes)
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceType('give')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    balanceType === 'give'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  You'll Give (Advance)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Opening Balance Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Amt</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Credit Limit Threshold
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Max</span>
                  <input
                    type="number"
                    min="0"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Internal Notes / Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Preferred weekly settlement cycle on Mondays..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{editingCustomer ? 'Save Changes' : 'Create Customer Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
