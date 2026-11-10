import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../lib/api.ts';
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  FileText,
  Calendar,
  CreditCard,
  Package,
  CheckCircle2,
  Building,
  DollarSign,
} from 'lucide-react';

export const POBuilderModal: React.FC = () => {
  const {
    isPOModalOpen,
    setIsPOModalOpen,
    poModalPrefill,
    suppliers,
    inventory,
    formatMoney,
    refreshData,
    showToast,
  } = useApp();

  const [isCustomSupplier, setIsCustomSupplier] = useState(false);
  const [customSupplierName, setCustomSupplierName] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
  const [paymentTerms, setPaymentTerms] = useState('Net 14');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  interface LineItem {
    inventoryId?: number;
    itemName: string;
    unit: string;
    quantity: number;
    unitCost: number;
  }

  const [items, setItems] = useState<LineItem[]>([
    { itemName: '', unit: 'pcs', quantity: 1, unitCost: 0 },
  ]);

  // Recalculate due date based on payment terms & issue date
  useEffect(() => {
    if (!issueDate) return;
    const date = new Date(issueDate);
    if (isNaN(date.getTime())) return;

    if (paymentTerms === 'Net 7') {
      date.setDate(date.getDate() + 7);
    } else if (paymentTerms === 'Net 14') {
      date.setDate(date.getDate() + 14);
    } else if (paymentTerms === 'Net 30') {
      date.setDate(date.getDate() + 30);
    } else {
      date.setDate(date.getDate() + 1);
    }
    setDueDate(date.toISOString().slice(0, 10));
  }, [issueDate, paymentTerms]);

  // Handle prefill when opening modal
  useEffect(() => {
    if (poModalPrefill?.supplierId) {
      setSelectedSupplierId(poModalPrefill.supplierId);
      setIsCustomSupplier(false);
      const supp = suppliers.find((s) => s.id === poModalPrefill.supplierId);
      if (supp?.paymentTerms) setPaymentTerms(supp.paymentTerms);
    } else if (suppliers.length > 0 && !selectedSupplierId && !isCustomSupplier) {
      setSelectedSupplierId(suppliers[0].id);
      if (suppliers[0].paymentTerms) setPaymentTerms(suppliers[0].paymentTerms);
    } else if (suppliers.length === 0) {
      setIsCustomSupplier(true);
    }

    if (poModalPrefill?.inventoryItem) {
      const inv = poModalPrefill.inventoryItem;
      const suggestedRestockQty = Math.max(5, inv.reorderLevel * 2 - inv.quantity);
      setItems([
        {
          inventoryId: inv.id,
          itemName: inv.name,
          unit: inv.unit,
          quantity: suggestedRestockQty,
          unitCost: inv.costPrice,
        },
      ]);
    }
  }, [poModalPrefill, suppliers]);

  if (!isPOModalOpen) return null;

  const currentSupplier = !isCustomSupplier
    ? suppliers.find((s) => s.id === Number(selectedSupplierId))
    : null;

  const totalAmount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
    0
  );

  const remainingHeadroom = currentSupplier
    ? Math.max(0, currentSupplier.creditLimit - currentSupplier.currentBalance)
    : 0;

  const isOverCreditLimit =
    currentSupplier && totalAmount > remainingHeadroom && currentSupplier.creditLimit > 0;

  const handleAddItem = () => {
    setItems((prev) => [...prev, { itemName: '', unit: 'pcs', quantity: 1, unitCost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectInventoryItem = (index: number, invIdStr: string) => {
    if (!invIdStr) return;
    const inv = inventory.find((i) => i.id === parseInt(invIdStr, 10));
    if (!inv) return;

    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        inventoryId: inv.id,
        itemName: inv.name,
        unit: inv.unit,
        quantity: Math.max(1, inv.reorderLevel - inv.quantity > 0 ? inv.reorderLevel - inv.quantity : 5),
        unitCost: inv.costPrice,
      };
      return next;
    });
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetSupplierId = currentSupplier?.id;
    let targetSupplierName = currentSupplier?.name;

    if (isCustomSupplier) {
      if (!customSupplierName.trim()) {
        showToast('Please enter supplier name', 'error');
        return;
      }
      targetSupplierName = customSupplierName.trim();
      // Try finding or creating this supplier
      const existing = suppliers.find(
        (s) => s.name.toLowerCase() === targetSupplierName!.toLowerCase()
      );
      if (existing) {
        targetSupplierId = existing.id;
      } else {
        try {
          const newSupp = await api.createSupplier({
            name: targetSupplierName,
            category: 'Wholesale Supplier',
            paymentTerms,
            creditLimit: 5000,
          });
          targetSupplierId = newSupp.id;
        } catch (sErr) {
          console.warn('Could not auto-create supplier on backend, using fallback ID:', sErr);
          targetSupplierId = Date.now();
        }
      }
    } else {
      if (!selectedSupplierId || !currentSupplier) {
        showToast('Please select a supplier or enter a new supplier name', 'error');
        return;
      }
    }

    const validItems = items.filter((it) => it.itemName.trim() !== '' && Number(it.quantity) > 0);
    if (validItems.length === 0) {
      showToast('Please add at least one line item with a name and quantity', 'error');
      return;
    }

    try {
      setSaving(true);
      await api.createPurchaseOrder({
        supplierId: targetSupplierId || 1,
        supplierName: targetSupplierName || 'Supplier',
        paymentTerms,
        issueDate,
        dueDate,
        notes,
        items: validItems.map((it) => ({
          ...it,
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost),
          subtotal: Number(it.quantity) * Number(it.unitCost),
        })),
      });

      showToast(`Purchase Order created successfully for ${targetSupplierName}!`, 'success');
      await refreshData();
      setIsPOModalOpen(false);
      // Reset form
      setItems([{ itemName: '', unit: 'pcs', quantity: 1, unitCost: 0 }]);
      setCustomSupplierName('');
      setNotes('');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate PO', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create Purchase Order</h2>
              <p className="text-xs text-slate-400">Order wholesale items & manage trade debt</p>
            </div>
          </div>
          <button
            onClick={() => setIsPOModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Supplier Selection & Mode Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-slate-500">
                Supplier Name *
              </label>
              <button
                type="button"
                onClick={() => setIsCustomSupplier(!isCustomSupplier)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
              >
                {isCustomSupplier ? '← Select Existing Supplier' : '+ Type New Supplier Name'}
              </button>
            </div>

            {isCustomSupplier ? (
              <input
                id="po-custom-supplier-input"
                type="text"
                required
                placeholder="e.g. East Africa Beverage Distributors"
                value={customSupplierName}
                onChange={(e) => setCustomSupplierName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-medium"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  id="po-supplier-select"
                  required
                  value={selectedSupplierId}
                  onChange={(e) => {
                    const sId = parseInt(e.target.value, 10);
                    setSelectedSupplierId(sId);
                    const supp = suppliers.find((s) => s.id === sId);
                    if (supp?.paymentTerms) setPaymentTerms(supp.paymentTerms);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>

                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                >
                  <option value="Net 7">Net 7 Days (Short credit)</option>
                  <option value="Net 14">Net 14 Days (Standard)</option>
                  <option value="Net 30">Net 30 Days (Monthly line)</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="Prepaid">Prepaid</option>
                </select>
              </div>
            )}
          </div>

          {/* Supplier Credit Status Pill */}
          {currentSupplier && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                isOverCreditLimit
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div>
                <span className="font-bold">{currentSupplier.name} Credit Line: </span>
                <span>
                  Debt: {formatMoney(currentSupplier.currentBalance)} / Limit:{' '}
                  {formatMoney(currentSupplier.creditLimit)}
                </span>
              </div>
              <div className="font-bold">
                {isOverCreditLimit ? (
                  <span className="flex items-center text-rose-600">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Exceeds Headroom!
                  </span>
                ) : (
                  <span className="text-emerald-700">
                    Headroom: {formatMoney(remainingHeadroom)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Issue Date *
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Payment Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Order Items & Unit Costs
              </span>
              <button
                type="button"
                id="btn-add-line-item"
                onClick={handleAddItem}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Item</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const itemSubtotal = (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);

                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      {/* Item Name / Quick picker from inventory */}
                      <div className="sm:col-span-5 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase font-bold text-slate-400">
                            Item Name *
                          </label>
                          {inventory.length > 0 && (
                            <select
                              onChange={(e) => handleSelectInventoryItem(idx, e.target.value)}
                              className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- From Inventory --</option>
                              {inventory.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.name} ({inv.quantity} {inv.unit} left)
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Mineral Water 1L (12pk)"
                          required
                          value={item.itemName}
                          onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Unit */}
                      <div className="sm:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Unit</label>
                        <input
                          type="text"
                          placeholder="pcs/box"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Qty *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Unit Cost */}
                      <div className="sm:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-400">
                          Unit Cost *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.unitCost}
                          onChange={(e) =>
                            handleItemChange(idx, 'unitCost', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="sm:col-span-1 flex items-center justify-end">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-all mt-3"
                            title="Remove Line Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/50 text-[11px] text-slate-500">
                      <span>Item Subtotal:</span>
                      <span className="font-bold text-slate-800">{formatMoney(itemSubtotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Order Notes / Delivery Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Please dispatch with invoice copy, delivery before 9:00 AM"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Total Cost Display Box */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-xs">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Total Order Cost</span>
              <span className="text-2xl font-black text-emerald-400">{formatMoney(totalAmount)}</span>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span className="font-semibold text-slate-200">{items.length} item(s)</span>
              <span className="block text-[11px] text-slate-400 mt-0.5">Due on: {dueDate || 'TBD'}</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsPOModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              id="submit-create-po-btn"
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
            >
              {saving ? (
                <span>Saving Order...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Purchase Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
