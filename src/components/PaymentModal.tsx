import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../lib/api.ts';
import {
  X,
  DollarSign,
  Calendar,
  CreditCard,
  FileText,
  Building,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const PaymentModal: React.FC = () => {
  const {
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    paymentPrefill,
    suppliers,
    purchaseOrders,
    formatMoney,
    refreshData,
    showToast,
  } = useApp();

  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [poId, setPoId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Handle prefill
  useEffect(() => {
    if (paymentPrefill) {
      if (paymentPrefill.supplierId) {
        setSupplierId(paymentPrefill.supplierId);
      }
      if (paymentPrefill.poId) {
        setPoId(paymentPrefill.poId);
        const po = purchaseOrders.find((p) => p.id === paymentPrefill.poId);
        if (po) {
          setSupplierId(po.supplierId);
          if (paymentPrefill.amount) {
            setAmount(paymentPrefill.amount);
          } else {
            const remaining = Math.max(0, po.totalAmount - po.amountPaid);
            setAmount(remaining);
          }
        }
      } else if (paymentPrefill.amount) {
        setAmount(paymentPrefill.amount);
      }
    } else if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
  }, [paymentPrefill, suppliers, purchaseOrders]);

  if (!isPaymentModalOpen) return null;

  const currentSupplier = suppliers.find((s) => s.id === Number(supplierId));
  const supplierUnpaidPOs = purchaseOrders.filter(
    (po) =>
      po.supplierId === Number(supplierId) &&
      po.paymentStatus !== 'paid' &&
      po.status !== 'cancelled'
  );

  const selectedPO = purchaseOrders.find((p) => p.id === Number(poId));

  const handlePOSuggestAmount = (selectedPoId: number) => {
    const po = purchaseOrders.find((p) => p.id === selectedPoId);
    if (po) {
      const remaining = Math.max(0, po.totalAmount - po.amountPaid);
      setAmount(remaining);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      showToast('Please select a supplier', 'error');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid positive payment amount', 'error');
      return;
    }

    try {
      setSaving(true);
      await api.recordPayment({
        supplierId: Number(supplierId),
        poId: poId ? Number(poId) : undefined,
        amount: numAmount,
        paymentDate,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      showToast(`Payment of ${formatMoney(numAmount)} logged successfully!`, 'success');
      await refreshData();
      setIsPaymentModalOpen(false);
      // Reset form
      setSupplierId('');
      setPoId('');
      setAmount('');
      setReferenceNumber('');
      setNotes('');
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Supplier Payment</h2>
              <p className="text-xs text-slate-400">Reduce payable balance & settle purchase orders</p>
            </div>
          </div>
          <button
            onClick={() => setIsPaymentModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {/* Supplier */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Supplier *
            </label>
            <select
              id="payment-supplier-select"
              required
              value={supplierId}
              onChange={(e) => {
                const sId = e.target.value ? Number(e.target.value) : '';
                setSupplierId(sId);
                setPoId('');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Current Debt: {formatMoney(s.currentBalance)})
                </option>
              ))}
            </select>
          </div>

          {/* Current Supplier Debt Summary Card */}
          {currentSupplier && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500">Current Outstanding Debt:</span>{' '}
                <span className="font-bold text-slate-900">
                  {formatMoney(currentSupplier.currentBalance)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Credit Limit:</span>{' '}
                <span className="font-medium text-slate-700">
                  {formatMoney(currentSupplier.creditLimit)}
                </span>
              </div>
            </div>
          )}

          {/* Link to PO */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Link to Purchase Order (Optional)
            </label>
            <select
              id="payment-po-select"
              value={poId}
              onChange={(e) => {
                const pId = e.target.value ? Number(e.target.value) : '';
                setPoId(pId);
                if (pId) handlePOSuggestAmount(Number(pId));
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            >
              <option value="">-- General Account Settlement (No specific PO) --</option>
              {supplierUnpaidPOs.map((po) => {
                const remaining = Math.max(0, po.totalAmount - po.amountPaid);
                return (
                  <option key={po.id} value={po.id}>
                    {po.poNumber} (Due: {po.dueDate}) - Unpaid: {formatMoney(remaining)} of {formatMoney(po.totalAmount)}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Payment Amount *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="Bank Transfer">Bank Transfer / Wire</option>
                <option value="M-Pesa / Mobile Money">M-Pesa / Mobile Money</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Reference / Receipt #
              </label>
              <input
                type="text"
                placeholder="e.g. TXN-998234, Check #104"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Payment Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Cleared installment 1 for August restock batch..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
            >
              {saving ? (
                <span>Recording...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
