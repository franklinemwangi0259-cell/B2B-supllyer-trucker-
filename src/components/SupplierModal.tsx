import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../lib/api.ts';
import { X, CreditCard, Building } from 'lucide-react';

export const SupplierModal: React.FC = () => {
  const {
    isSupplierModalOpen,
    setIsSupplierModalOpen,
    editingSupplier,
    refreshData,
    showToast,
  } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('General Wholesale');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 14');
  const [creditLimit, setCreditLimit] = useState<number | ''>(2000);
  const [currentBalance, setCurrentBalance] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingSupplier) {
      setName(editingSupplier.name);
      setCategory(editingSupplier.category);
      setContactPerson(editingSupplier.contactPerson || '');
      setPhone(editingSupplier.phone || '');
      setEmail(editingSupplier.email || '');
      setPaymentTerms(editingSupplier.paymentTerms);
      setCreditLimit(editingSupplier.creditLimit);
      setCurrentBalance(editingSupplier.currentBalance);
      setNotes(editingSupplier.notes || '');
    } else {
      setName('');
      setCategory('General Wholesale');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setPaymentTerms('Net 14');
      setCreditLimit(2000);
      setCurrentBalance(0);
      setNotes('');
    }
  }, [editingSupplier, isSupplierModalOpen]);

  if (!isSupplierModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter supplier name', 'error');
      return;
    }

    try {
      setSaving(true);
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, {
          name,
          category,
          contactPerson,
          phone,
          email,
          paymentTerms,
          creditLimit: Number(creditLimit) || 0,
          currentBalance: Number(currentBalance) || 0,
          notes,
        });
        showToast('Supplier updated successfully!', 'success');
      } else {
        await api.createSupplier({
          name,
          category,
          contactPerson,
          phone,
          email,
          paymentTerms,
          creditLimit: Number(creditLimit) || 0,
          currentBalance: Number(currentBalance) || 0,
          notes,
        });
        showToast('Supplier registered successfully!', 'success');
      }

      await refreshData();
      setIsSupplierModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save supplier', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingSupplier ? 'Edit Supplier Details' : 'Register Wholesale Distributor'}
              </h2>
              <p className="text-xs text-slate-400">Configure credit limits & payment terms</p>
            </div>
          </div>
          <button
            onClick={() => setIsSupplierModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Supplier / Distributor Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Wholesale Beverages Ltd"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="Beverages & Soft Drinks">Beverages & Soft Drinks</option>
                <option value="Dairy, Bread & Pastries">Dairy, Bread & Pastries</option>
                <option value="Staples & Dry Goods">Staples & Dry Goods</option>
                <option value="Household & Personal Care">Household & Personal Care</option>
                <option value="Produce & Fresh Foods">Produce & Fresh Foods</option>
                <option value="General Wholesale">General Wholesale</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="Net 7">Net 7 Days</option>
                <option value="Net 14">Net 14 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="COD">Cash on Delivery</option>
                <option value="Prepaid">Prepaid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Approved Credit Limit
              </label>
              <input
                type="number"
                min="0"
                step="50"
                placeholder="2000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Current Debt Owed
              </label>
              <input
                type="number"
                min="0"
                step="10"
                placeholder="0"
                value={currentBalance}
                onChange={(e) =>
                  setCurrentBalance(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                placeholder="e.g. David Mutua"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Phone Number / WhatsApp
              </label>
              <input
                type="text"
                placeholder="+1 (555) 234-8901"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="orders@supplier.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Notes & Delivery Schedule
            </label>
            <input
              type="text"
              placeholder="e.g. Delivers on Mondays & Thursdays"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              {saving ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
