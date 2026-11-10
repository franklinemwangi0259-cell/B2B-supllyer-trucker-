import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { InventoryItem } from '../types.ts';
import { api } from '../lib/api.ts';
import { StockAdjustModal } from './StockAdjustModal.tsx';
import { AutoReorderModal } from './AutoReorderModal.tsx';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ArrowUpDown,
  Edit2,
  Trash2,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  Tag,
  Building,
  CheckCircle2,
  Download,
  Zap,
  Sparkles,
  Clock,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    inventory,
    suppliers,
    formatMoney,
    openInventoryModal,
    openNewPO,
    refreshData,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'rop_triggered'>('all');
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [isAutoReorderModalOpen, setIsAutoReorderModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const categories = Array.from(new Set(inventory.map((i) => i.category)));

  // Calculate items triggered by Lead Time Dynamic ROP
  const ropTriggeredItems = inventory.filter((item) => {
    const velocity = item.dailySalesVelocity && item.dailySalesVelocity > 0 ? item.dailySalesVelocity : Math.max(1, Math.round(item.reorderLevel / 4));
    const leadTime = item.leadTimeDays && item.leadTimeDays > 0 ? item.leadTimeDays : 7;
    const safetyStock = item.safetyStockUnits !== undefined ? item.safetyStockUnits : Math.max(2, Math.round(velocity * 2));
    const dynamicROP = Math.round((velocity * leadTime) + safetyStock);
    return item.quantity <= dynamicROP || (velocity > 0 && item.quantity / velocity <= leadTime);
  });

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'low_stock') {
      matchesStock = item.quantity <= item.reorderLevel && item.quantity > 0;
    } else if (stockFilter === 'out_of_stock') {
      matchesStock = item.quantity === 0;
    } else if (stockFilter === 'rop_triggered') {
      const velocity = item.dailySalesVelocity && item.dailySalesVelocity > 0 ? item.dailySalesVelocity : Math.max(1, Math.round(item.reorderLevel / 4));
      const leadTime = item.leadTimeDays && item.leadTimeDays > 0 ? item.leadTimeDays : 7;
      const safetyStock = item.safetyStockUnits !== undefined ? item.safetyStockUnits : Math.max(2, Math.round(velocity * 2));
      const dynamicROP = Math.round((velocity * leadTime) + safetyStock);
      matchesStock = item.quantity <= dynamicROP || (velocity > 0 && item.quantity / velocity <= leadTime);
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalWholesaleValue = inventory.reduce((sum, i) => sum + i.quantity * i.costPrice, 0);
  const totalRetailValue = inventory.reduce((sum, i) => sum + i.quantity * i.sellingPrice, 0);
  const lowStockItems = inventory.filter((i) => i.quantity <= i.reorderLevel);
  const lowStockCount = lowStockItems.length;

  const handleDeleteItem = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from inventory?`)) return;
    try {
      setDeletingId(id);
      await api.deleteInventoryItem(id);
      showToast(`Item removed from catalog`, 'info');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete inventory item', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportStockCSV = () => {
    if (inventory.length === 0) {
      showToast('No inventory items to export', 'info');
      return;
    }
    const headers = ['SKU', 'Item Name', 'Category', 'Unit', 'Stock Qty', 'Reorder Min', 'Cost Price', 'Retail Price', 'Total Asset Cost', 'Total Retail Value'];
    const rows = inventory.map((i) => [
      `"${i.sku}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.unit}"`,
      i.quantity,
      i.reorderLevel,
      i.costPrice,
      i.sellingPrice,
      i.quantity * i.costPrice,
      i.quantity * i.sellingPrice,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Stock_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Inventory exported to CSV', 'success');
  };

  // 1-Click Batch Restock Handler
  const handleBatchRestock = () => {
    if (lowStockItems.length === 0) {
      showToast('All stock items are healthy! No restock required.', 'info');
      return;
    }
    const firstLow = lowStockItems[0];
    openNewPO({
      supplierId: firstLow.preferredSupplierId || undefined,
      inventoryItem: firstLow,
    });
    showToast(`Initiating replenishment for ${lowStockItems.length} low stock SKUs`, 'info');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Inventory & Restock Radar
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                QuickBooks Commerce & Vyapar stock ledger, safety reorder thresholds, and profit margins
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAutoReorderModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            title="Open Automated Lead-Time Reorder Radar"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Lead-Time Radar</span>
            {ropTriggeredItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-white/25 rounded-full text-[10px] font-mono">
                {ropTriggeredItems.length}
              </span>
            )}
          </button>

          <button
            onClick={handleExportStockCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            title="Export Catalog to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {lowStockCount > 0 && (
            <button
              onClick={handleBatchRestock}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all animate-pulse"
              title="Restock all depleted items"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Restock ({lowStockCount})</span>
            </button>
          )}

          <button
            id="add-sku-top-btn"
            onClick={() => openInventoryModal()}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add SKU</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Wholesale Capital Tied Up
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1.5">
            {formatMoney(totalWholesaleValue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cost valuation of current warehouse units</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Projected Retail Yield
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1.5">
            {formatMoney(totalRetailValue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Potential margin: {totalRetailValue > 0 ? (((totalRetailValue - totalWholesaleValue) / totalRetailValue) * 100).toFixed(1) : 0}%
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Low Stock Warnings
            </span>
            {lowStockCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                Action Required
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1.5">
            {lowStockCount} Items Below Threshold
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Generate 1-click PO to replenish distributors</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name or SKU..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Stock status tabs */}
            <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
              <button
                onClick={() => setStockFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  stockFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                All ({inventory.length})
              </button>
              <button
                onClick={() => setStockFilter('rop_triggered')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                  stockFilter === 'rop_triggered'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>ROP Triggered ({ropTriggeredItems.length})</span>
              </button>
              <button
                onClick={() => setStockFilter('low_stock')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  stockFilter === 'low_stock'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-amber-700'
                }`}
              >
                Low Stock ({lowStockCount})
              </button>
              <button
                onClick={() => setStockFilter('out_of_stock')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  stockFilter === 'out_of_stock'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-rose-700'
                }`}
              >
                Out of Stock ({inventory.filter((i) => i.quantity === 0).length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">SKU & Item Details</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Preferred Distributor</th>
                <th className="px-5 py-3.5 text-center">Stock Level</th>
                <th className="px-5 py-3.5 text-right">Cost Price</th>
                <th className="px-5 py-3.5 text-right">Retail Price</th>
                <th className="px-5 py-3.5 text-right">Markup %</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => {
                  const supplier = suppliers.find((s) => s.id === item.preferredSupplierId);
                  const isOutOfStock = item.quantity === 0;
                  const isLowStock = item.quantity <= item.reorderLevel && !isOutOfStock;
                  const marginPercent =
                    item.sellingPrice > 0
                      ? (((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100).toFixed(0)
                      : '0';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-all ${
                        isOutOfStock ? 'bg-rose-50/30' : isLowStock ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Name & SKU */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                        <div className="flex items-center space-x-2 mt-0.5 font-mono text-[11px] text-slate-400">
                          <span>{item.sku}</span>
                          <span>&bull;</span>
                          <span className="capitalize">{item.unit}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </td>

                      {/* Preferred Supplier */}
                      <td className="px-5 py-3.5">
                        {supplier ? (
                          <div>
                            <div className="font-semibold text-slate-800">{supplier.name}</div>
                            <div className="text-[10px] text-slate-400">{supplier.paymentTerms}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None assigned</span>
                        )}
                      </td>

                      {/* Stock Level Bar & Threshold */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <div className="flex items-center space-x-1.5 font-black text-sm">
                            <span
                              className={
                                isOutOfStock
                                  ? 'text-rose-600'
                                  : isLowStock
                                  ? 'text-amber-600'
                                  : 'text-slate-900'
                              }
                            >
                              {item.quantity}
                            </span>
                            <span className="text-slate-400 text-xs font-normal">/ min {item.reorderLevel}</span>
                          </div>

                          {isOutOfStock ? (
                            <span className="mt-1 px-2 py-0.2 rounded font-bold text-[10px] bg-rose-100 text-rose-800">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="mt-1 px-2 py-0.2 rounded font-bold text-[10px] bg-amber-100 text-amber-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="mt-1 px-2 py-0.2 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                              Healthy
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td className="px-5 py-3.5 text-right font-medium text-slate-600">
                        {formatMoney(item.costPrice)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                        {formatMoney(item.sellingPrice)}
                      </td>

                      {/* Gross Margin */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                          {marginPercent}%
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          id={`reorder-btn-${item.id}`}
                          onClick={() =>
                            openNewPO({
                              supplierId: item.preferredSupplierId || undefined,
                              inventoryItem: item,
                            })
                          }
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-all inline-flex items-center space-x-1"
                          title="Generate Purchase Order"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Order</span>
                        </button>

                        <button
                          id={`adjust-btn-${item.id}`}
                          onClick={() => setAdjustingItem(item)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-all inline-flex items-center"
                          title="Adjust stock count or record sale"
                        >
                          Adjust
                        </button>

                        <button
                          id={`edit-item-${item.id}`}
                          onClick={() => openInventoryModal(item)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                          title="Edit SKU Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          id={`delete-item-${item.id}`}
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          disabled={deletingId === item.id}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No stock items match filter</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try searching a different keyword or create a new SKU.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Adjust Modal Trigger */}
      {adjustingItem && (
        <StockAdjustModal item={adjustingItem} onClose={() => setAdjustingItem(null)} />
      )}

      {/* Automated Lead-Time Reorder Radar Modal */}
      <AutoReorderModal
        isOpen={isAutoReorderModalOpen}
        onClose={() => setIsAutoReorderModalOpen(false)}
      />
    </div>
  );
};
