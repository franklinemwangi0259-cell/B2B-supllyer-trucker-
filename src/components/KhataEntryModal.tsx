import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Calendar,
  FileText,
  CreditCard,
  X,
  CheckCircle,
  MessageCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { api } from '../lib/api.ts';

interface SelectedSKUItem {
  inventoryId: number;
  name: string;
  sku: string;
  unit: string;
  sellingPrice: number;
  availableStock: number;
  quantity: number;
}

export const KhataEntryModal: React.FC = () => {
  const {
    isKhataEntryModalOpen,
    setIsKhataEntryModalOpen,
    khataEntryPrefill,
    addKhataEntry,
    formatMoney,
    sendWhatsAppReminder,
    customers,
    inventory,
    refreshData,
    showToast,
    currency,
  } = useApp();

  const [entryType, setEntryType] = useState<'gave' | 'got'>('gave');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState<string>('');
  const [billNumber, setBillNumber] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [sendWhatsApp, setSendWhatsApp] = useState<boolean>(true);

  // Inventory-Driven SKU Selection
  const [attachInventory, setAttachInventory] = useState(false);
  const [selectedSKUs, setSelectedSKUs] = useState<SelectedSKUItem[]>([]);
  const [skuPickerId, setSkuPickerId] = useState<string>('');

  // Soft Credit Limit Override Checkbox
  const [overrideAuthorized, setOverrideAuthorized] = useState(false);

  useEffect(() => {
    if (khataEntryPrefill) {
      setEntryType(khataEntryPrefill.initialType || 'gave');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setDescription('');
      setBillNumber('');
      setPaymentMode(khataEntryPrefill.initialType === 'got' ? 'Cash' : 'Credit');
      setSendWhatsApp(true);
      setAttachInventory(false);
      setSelectedSKUs([]);
      setOverrideAuthorized(false);
    }
  }, [khataEntryPrefill, isKhataEntryModalOpen]);

  // Recalculate amount & description when inventory items change
  useEffect(() => {
    if (attachInventory && selectedSKUs.length > 0) {
      const calculatedTotal = selectedSKUs.reduce(
        (sum, item) => sum + item.quantity * item.sellingPrice,
        0
      );
      setAmount(calculatedTotal.toString());

      const desc = selectedSKUs
        .map((i) => `${i.quantity}x ${i.name}`)
        .join(', ');
      setDescription(desc);
    }
  }, [selectedSKUs, attachInventory]);

  if (!isKhataEntryModalOpen || !khataEntryPrefill) return null;

  const partyName = khataEntryPrefill.partyName;
  const isCustomer = khataEntryPrefill.partyType === 'customer';

  // Find customer object to inspect soft credit limit
  const customerObj = isCustomer
    ? customers.find((c) => c.id === khataEntryPrefill.partyId)
    : null;

  const numAmount = parseFloat(amount) || 0;
  const currentBal = customerObj?.currentBalance || 0;
  const creditLimit = customerObj?.creditLimit || 5000;
  const projectedBalance = currentBal + (entryType === 'gave' ? numAmount : -numAmount);
  const isBreachingLimit = isCustomer && entryType === 'gave' && projectedBalance > creditLimit;
  const overLimitAmount = Math.max(0, projectedBalance - creditLimit);

  const handleQuickAddAmount = (add: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + add).toString());
  };

  const handleAddSKU = () => {
    const invId = parseInt(skuPickerId, 10);
    if (!invId) return;

    const invItem = inventory.find((i) => i.id === invId);
    if (!invItem) return;

    if (selectedSKUs.some((s) => s.inventoryId === invId)) {
      showToast('Item already added. Adjust quantity below.', 'info');
      return;
    }

    setSelectedSKUs((prev) => [
      ...prev,
      {
        inventoryId: invItem.id,
        name: invItem.name,
        sku: invItem.sku,
        unit: invItem.unit,
        sellingPrice: invItem.sellingPrice,
        availableStock: invItem.quantity,
        quantity: 1,
      },
    ]);
    setSkuPickerId('');
  };

  const handleUpdateSKUQuantity = (invId: number, newQty: number) => {
    if (newQty <= 0) {
      setSelectedSKUs((prev) => prev.filter((s) => s.inventoryId !== invId));
      return;
    }
    setSelectedSKUs((prev) =>
      prev.map((s) => (s.inventoryId === invId ? { ...s, quantity: newQty } : s))
    );
  };

  const handleRemoveSKU = (invId: number) => {
    setSelectedSKUs((prev) => prev.filter((s) => s.inventoryId !== invId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) return;

    if (isBreachingLimit && !overrideAuthorized) {
      showToast('Please approve the Soft Credit Limit Override before proceeding.', 'error');
      return;
    }

    // Auto-deduct inventory if attached
    if (attachInventory && selectedSKUs.length > 0) {
      for (const sku of selectedSKUs) {
        try {
          await api.adjustStock(sku.inventoryId, 'sale', sku.quantity);
        } catch (err) {
          console.warn('Stock adjustment background notice:', err);
        }
      }
      showToast(`Auto-deducted ${selectedSKUs.length} SKU items from inventory stock!`, 'info');
    }

    await addKhataEntry({
      partyType: khataEntryPrefill.partyType,
      partyId: khataEntryPrefill.partyId,
      type: entryType,
      amount: numAmount,
      description: description || (entryType === 'gave' ? 'Goods given on credit' : 'Cash settlement'),
      billNumber,
      paymentMode,
      date,
    });

    if (sendWhatsApp && khataEntryPrefill.phone) {
      setTimeout(() => {
        sendWhatsAppReminder({
          name: partyName,
          phone: khataEntryPrefill.phone,
          balance: (khataEntryPrefill.currentBalance || 0) + (entryType === 'gave' ? numAmount : -numAmount),
          type: khataEntryPrefill.partyType,
        });
      }, 500);
    }

    await refreshData();
    setIsKhataEntryModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Dynamic Header based on Gave / Got */}
        <div
          className={`px-6 py-4 text-white flex items-center justify-between transition-colors ${
            entryType === 'gave'
              ? 'bg-gradient-to-r from-rose-700 via-rose-600 to-red-600'
              : 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs font-bold text-lg">
              {entryType === 'gave' ? <ArrowUpRight className="w-6 h-6 text-white" /> : <ArrowDownLeft className="w-6 h-6 text-white" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight">
                  {entryType === 'gave'
                    ? isCustomer
                      ? 'You Gave (Credit Sale)'
                      : 'You Gave (Supplier Payment)'
                    : isCustomer
                    ? 'You Got (Customer Payment)'
                    : 'You Got (Stock Received)'}
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium">Party: {partyName}</p>
            </div>
          </div>
          <button
            onClick={() => setIsKhataEntryModalOpen(false)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Toggle Tabs */}
        <div className="p-2 bg-slate-100 border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => setEntryType('gave')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              entryType === 'gave'
                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>YOU GAVE (Credit Sale)</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryType('got')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              entryType === 'got'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>YOU GOT (Payment In)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Soft Credit Limit Warning Banner */}
          {isBreachingLimit && (
            <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-start space-x-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-rose-900">
                    ⚠️ Soft Credit Limit Breach Alert!
                  </h4>
                  <p className="text-[11px] text-rose-700 mt-0.5 leading-snug">
                    Customer credit limit is <strong>{formatMoney(creditLimit)}</strong>. This transaction of {formatMoney(numAmount)} will raise balance to{' '}
                    <strong>{formatMoney(projectedBalance)}</strong> ({formatMoney(overLimitAmount)} over limit).
                  </p>
                </div>
              </div>

              <label className="flex items-center space-x-2 pt-1 border-t border-rose-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideAuthorized}
                  onChange={(e) => setOverrideAuthorized(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 border-rose-300 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-rose-900">
                  Authorize Soft Credit Limit Override for this transaction
                </span>
              </label>
            </div>
          )}

          {/* Main Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Enter Amount *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-2xl text-2xl font-extrabold focus:bg-white focus:outline-none transition-all ${
                  entryType === 'gave'
                    ? 'border-rose-200 text-rose-700 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                    : 'border-emerald-200 text-emerald-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'
                }`}
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex items-center space-x-2 mt-2">
              {[100, 500, 1000, 2000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-all"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Inventory-Driven Stock Deduction Option (For Credit Sales) */}
          {entryType === 'gave' && (
            <div className="border border-blue-200 rounded-xl p-3.5 bg-blue-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-900">
                    Inventory-Driven Sale (Auto-Deduct Stock)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={attachInventory}
                  onChange={(e) => setAttachInventory(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {attachInventory && (
                <div className="space-y-2.5 pt-2 border-t border-blue-200 animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <select
                      value={skuPickerId}
                      onChange={(e) => setSkuPickerId(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none"
                    >
                      <option value="">Select SKU Catalog Item...</option>
                      {inventory.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} (Stock: {inv.quantity} {inv.unit}) - {formatMoney(inv.sellingPrice)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddSKU}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add SKU</span>
                    </button>
                  </div>

                  {/* Selected SKU line items */}
                  {selectedSKUs.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {selectedSKUs.map((item) => (
                        <div
                          key={item.inventoryId}
                          className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-900 truncate block">{item.name}</span>
                            <span className="text-[10px] text-slate-500">
                              @{formatMoney(item.sellingPrice)} / {item.unit} • In Stock: {item.availableStock}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateSKUQuantity(item.inventoryId, parseInt(e.target.value) || 1)
                              }
                              className="w-14 px-1.5 py-1 border border-slate-200 rounded text-center text-xs font-bold"
                            />
                            <span className="font-bold text-slate-900 w-16 text-right">
                              {formatMoney(item.quantity * item.sellingPrice)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSKU(item.inventoryId)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Details / Item note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              placeholder={
                entryType === 'gave'
                  ? 'e.g. 5kg Basmati Rice, 2 Cooking Oil'
                  : 'e.g. Counter Cash, Google Pay, Bank Settlement'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date & Bill No */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Bill / Receipt No</span>
              </label>
              <input
                type="text"
                placeholder="e.g. INV-1049"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>Payment Mode</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'UPI / M-Pesa', 'Credit', 'Bank Transfer', 'Cheque'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all ${
                    paymentMode === mode
                      ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp Auto Reminder Toggle */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-emerald-900">Send WhatsApp Notification</p>
                <p className="text-[10px] text-emerald-700">Automated digital receipt dispatched to {partyName}</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendWhatsApp}
              onChange={(e) => setSendWhatsApp(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300 cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsKhataEntryModalOpen(false)}
              className="flex-1 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBreachingLimit && !overrideAuthorized}
              className={`flex-1 py-3 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center space-x-2 ${
                isBreachingLimit && !overrideAuthorized
                  ? 'bg-slate-400 cursor-not-allowed'
                  : entryType === 'gave'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save & Sync Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
