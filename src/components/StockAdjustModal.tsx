import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { InventoryItem } from '../types.ts';
import { api } from '../lib/api.ts';
import { Package, X, Check, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

interface StockAdjustModalProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({ item, onClose }) => {
  const { refreshData, showToast } = useApp();
  const [changeType, setChangeType] = useState<'sale' | 'restock_po' | 'damage' | 'manual_adjustment'>('manual_adjustment');
  const [quantityDelta, setQuantityDelta] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantityDelta === '' || isNaN(Number(quantityDelta))) {
      showToast('Please enter a valid quantity change', 'error');
      return;
    }

    try {
      setLoading(true);
      await api.adjustStock(item.id, changeType, Number(quantityDelta), notes);
      showToast(`Stock updated for ${item.name}`, 'success');
      await refreshData();
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to adjust stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  const newProjectedQty = item.quantity + (Number(quantityDelta) || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="stock-adjust-modal"
        className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold">Quick Stock Adjustment</h2>
              <p className="text-xs text-slate-400">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Current Stock:</span>
              <div className="text-base font-black text-slate-900">
                {item.quantity} {item.unit}
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-500">New Projected:</span>
              <div className={`text-base font-black ${newProjectedQty < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {newProjectedQty} {item.unit}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Reason for Adjustment
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setChangeType('manual_adjustment');
                }}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center space-x-2 transition-all ${
                  changeType === 'manual_adjustment'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>📦 Stock Count / Audit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setChangeType('sale');
                }}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center space-x-2 transition-all ${
                  changeType === 'sale'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>🛒 Retail Sale (Deduct)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setChangeType('damage');
                }}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center space-x-2 transition-all ${
                  changeType === 'damage'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>⚠️ Damaged / Expired</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setChangeType('restock_po');
                }}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center space-x-2 transition-all ${
                  changeType === 'restock_po'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>🚚 Delivery Intake</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Quantity Change (+ to add, - to subtract) *
            </label>
            <input
              type="number"
              required
              value={quantityDelta}
              onChange={(e) => setQuantityDelta(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. +10 or -3"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Enter positive number to add incoming units, or negative number (e.g. -5) for reductions.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Audit Note / Reason
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Physical inventory count reconciliation"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Applying...' : 'Apply Stock Change'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
