import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../lib/api.ts';
import { Package, X, Save, DollarSign, Tag, Hash, Building } from 'lucide-react';

export const InventoryModal: React.FC = () => {
  const {
    isInventoryModalOpen,
    setIsInventoryModalOpen,
    editingInventory,
    suppliers,
    refreshData,
    showToast,
    currency,
  } = useApp();

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Beverages');
  const [unit, setUnit] = useState('packs');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>(0);
  const [reorderLevel, setReorderLevel] = useState<number | ''>(10);
  const [leadTimeDays, setLeadTimeDays] = useState<number | ''>(7);
  const [dailySalesVelocity, setDailySalesVelocity] = useState<number | ''>(3);
  const [safetyStockUnits, setSafetyStockUnits] = useState<number | ''>(5);
  const [preferredSupplierId, setPreferredSupplierId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingInventory) {
      setSku(editingInventory.sku);
      setName(editingInventory.name);
      setCategory(editingInventory.category);
      setUnit(editingInventory.unit);
      setCostPrice(editingInventory.costPrice);
      setSellingPrice(editingInventory.sellingPrice);
      setQuantity(editingInventory.quantity);
      setReorderLevel(editingInventory.reorderLevel);
      setLeadTimeDays(editingInventory.leadTimeDays !== undefined ? editingInventory.leadTimeDays : 7);
      setDailySalesVelocity(editingInventory.dailySalesVelocity !== undefined ? editingInventory.dailySalesVelocity : 3);
      setSafetyStockUnits(editingInventory.safetyStockUnits !== undefined ? editingInventory.safetyStockUnits : 5);
      setPreferredSupplierId(editingInventory.preferredSupplierId || '');
    } else {
      // Auto-generate random SKU
      const randomSku = 'SKU-' + Math.floor(1000 + Math.random() * 9000);
      setSku(randomSku);
      setName('');
      setCategory('Beverages');
      setUnit('packs');
      setCostPrice('');
      setSellingPrice('');
      setQuantity(0);
      setReorderLevel(10);
      setLeadTimeDays(7);
      setDailySalesVelocity(3);
      setSafetyStockUnits(5);
      setPreferredSupplierId(suppliers[0]?.id || '');
    }
  }, [editingInventory, isInventoryModalOpen, suppliers]);

  if (!isInventoryModalOpen) return null;

  const categories = [
    'Beverages',
    'Dry Foods & Grains',
    'Dairy & Bakery',
    'Snacks & Confectionery',
    'Household & Cleaning',
    'Personal Care',
    'Tobacco & Sundries',
    'Other',
  ];

  const units = ['pcs', 'packs', 'carton', 'crates', 'bags', 'kg', 'bundle', 'box'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Product name is required', 'error');
      return;
    }
    if (Number(costPrice) < 0 || Number(sellingPrice) < 0) {
      showToast('Prices cannot be negative', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        category,
        unit,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        quantity: Number(quantity) || 0,
        reorderLevel: Number(reorderLevel) || 5,
        leadTimeDays: Number(leadTimeDays) || 7,
        dailySalesVelocity: Number(dailySalesVelocity) || 3,
        safetyStockUnits: Number(safetyStockUnits) || 5,
        preferredSupplierId: preferredSupplierId ? Number(preferredSupplierId) : null,
      };

      if (editingInventory) {
        await api.updateInventoryItem(editingInventory.id, payload);
        showToast('Inventory item updated successfully', 'success');
      } else {
        await api.createInventoryItem(payload);
        showToast('New stock SKU created successfully', 'success');
      }

      await refreshData();
      setIsInventoryModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to save inventory item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const margin =
    Number(sellingPrice) > 0
      ? (((Number(sellingPrice) - Number(costPrice)) / Number(sellingPrice)) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="inventory-modal-content"
        className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {editingInventory ? 'Edit Inventory SKU' : 'Add New Inventory Stock'}
              </h2>
              <p className="text-xs text-slate-400">
                Track retail units, wholesale cost, and automated restock triggers
              </p>
            </div>
          </div>
          <button
            id="close-inventory-modal-btn"
            onClick={() => setIsInventoryModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Item / Product Name *
              </label>
              <input
                id="item-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sparkling Soda 500ml (Pack of 24)"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center">
                <Hash className="w-3.5 h-3.5 mr-1 text-slate-400" />
                SKU / Barcode Code
              </label>
              <input
                id="item-sku-input"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-8192"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center">
                <Tag className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Category
              </label>
              <select
                id="item-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Stocking Unit
              </label>
              <select
                id="item-unit-select"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Wholesale Supplier */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center">
                <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Preferred Distributor
              </label>
              <select
                id="item-supplier-select"
                value={preferredSupplierId}
                onChange={(e) => setPreferredSupplierId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="">-- None / Multiple --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.paymentTerms})
                  </option>
                ))}
              </select>
            </div>

            {/* Wholesale Cost Price */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Wholesale Cost Price ({currency}) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-semibold">
                  {currency}
                </span>
                <input
                  id="item-cost-input"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-12 pr-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Retail Selling Price */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Retail Selling Price ({currency}) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-semibold">
                  {currency}
                </span>
                <input
                  id="item-selling-input"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-12 pr-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Current Quantity */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Current Stock On Hand ({unit})
              </label>
              <input
                id="item-qty-input"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Reorder Threshold */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Restock Alert Threshold ({unit})
              </label>
              <input
                id="item-reorder-input"
                type="number"
                min="1"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="10"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Vendor Lead Time in Days */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                <span>Vendor Lead Time (Days)</span>
                <span className="text-[10px] text-slate-400 lowercase font-normal">Transit delay</span>
              </label>
              <input
                id="item-leadtime-input"
                type="number"
                min="1"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="7"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Daily Consumption Velocity */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                <span>Daily Sales Velocity ({unit}/day)</span>
                <span className="text-[10px] text-slate-400 lowercase font-normal">Demand rate</span>
              </label>
              <input
                id="item-velocity-input"
                type="number"
                min="0.1"
                step="0.1"
                value={dailySalesVelocity}
                onChange={(e) => setDailySalesVelocity(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="3"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Dynamic Reorder Point Formula Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between">
            <div>
              <span className="font-bold block">Dynamic Reorder Point (ROP):</span>
              <span className="text-[11px] text-amber-700">
                ({dailySalesVelocity || 0} /day × {leadTimeDays || 0} lead days) + {safetyStockUnits || 0} safety buffer
              </span>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-amber-900 font-mono">
                {Math.round(((Number(dailySalesVelocity) || 0) * (Number(leadTimeDays) || 0)) + (Number(safetyStockUnits) || 0))} {unit}
              </span>
              <span className="text-[10px] text-amber-600 block uppercase font-bold">Auto Trigger</span>
            </div>
          </div>

          {/* Gross Margin Preview Banner */}
          {Number(sellingPrice) > 0 && Number(costPrice) > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Unit Profit: <strong className="text-slate-900">{currency} {(Number(sellingPrice) - Number(costPrice)).toFixed(2)}</strong>
              </span>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-md">
                {margin}% Gross Margin
              </span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              id="cancel-inventory-btn"
              onClick={() => setIsInventoryModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-inventory-btn"
              disabled={saving}
              className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : editingInventory ? 'Update SKU' : 'Add to Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
