import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { AutoReorderSuggestion, InventoryItem } from '../types.ts';
import {
  Zap,
  X,
  Package,
  Clock,
  TrendingDown,
  AlertTriangle,
  Building,
  CheckCircle2,
  ShoppingCart,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AutoReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutoReorderModal: React.FC<AutoReorderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    inventory,
    suppliers,
    formatMoney,
    openNewPO,
    createPO,
    showToast,
    refreshData,
  } = useApp();

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [isDraftingAll, setIsDraftingAll] = useState(false);

  if (!isOpen) return null;

  // Compute lead-time based Auto-Reorder Suggestions for all inventory
  const suggestions: AutoReorderSuggestion[] = inventory.map((item) => {
    const supplier = suppliers.find((s) => s.id === item.preferredSupplierId);
    const supplierName = supplier?.name || 'Unassigned Supplier';
    
    // Default fallback values if not specifically configured
    const velocity = item.dailySalesVelocity && item.dailySalesVelocity > 0 ? item.dailySalesVelocity : Math.max(1, Math.round(item.reorderLevel / 4));
    const leadTime = item.leadTimeDays && item.leadTimeDays > 0 ? item.leadTimeDays : 7; // default 7 days vendor transit
    const safetyStock = item.safetyStockUnits !== undefined ? item.safetyStockUnits : Math.max(2, Math.round(velocity * 2));
    
    // Dynamic ROP Formula: (Daily Velocity * Lead Time) + Safety Stock
    const dynamicROP = Math.round((velocity * leadTime) + safetyStock);
    
    const daysRemaining = velocity > 0 ? Number((item.quantity / velocity).toFixed(1)) : 999;
    
    // Calculate stockout date
    const stockoutMs = Date.now() + daysRemaining * 24 * 60 * 60 * 1000;
    const estimatedStockoutDate = new Date(stockoutMs).toISOString().slice(0, 10);
    
    // Suggested Order Quantity: Bring stock up to 30 days of demand
    const targetStock = Math.max(dynamicROP * 2, velocity * 30);
    const suggestedOrderQty = Math.max(dynamicROP, targetStock - item.quantity);
    const estimatedOrderCost = suggestedOrderQty * item.costPrice;

    // Trigger conditions
    const isTriggered = item.quantity <= dynamicROP || daysRemaining <= leadTime;
    
    let urgency: 'stockout' | 'critical' | 'reorder_now' | 'healthy' = 'healthy';
    if (item.quantity === 0) {
      urgency = 'stockout';
    } else if (daysRemaining <= leadTime) {
      urgency = 'critical'; // Will run out before vendor delivery arrives!
    } else if (isTriggered) {
      urgency = 'reorder_now';
    }

    return {
      inventoryId: item.id,
      itemName: item.name,
      sku: item.sku,
      category: item.category,
      unit: item.unit,
      currentQuantity: item.quantity,
      dailyVelocity: velocity,
      leadTimeDays: leadTime,
      safetyStock,
      dynamicROP,
      daysRemaining,
      estimatedStockoutDate,
      suggestedOrderQty,
      unitCost: item.costPrice,
      estimatedOrderCost,
      preferredSupplierId: item.preferredSupplierId,
      supplierName,
      isTriggered,
      urgency,
    };
  });

  const triggeredItems = suggestions.filter((s) => s.isTriggered);
  const criticalItems = suggestions.filter((s) => s.urgency === 'critical' || s.urgency === 'stockout');

  // Filter by supplier if selected
  const filteredItems = selectedSupplierId === 'all'
    ? triggeredItems
    : triggeredItems.filter((s) => String(s.preferredSupplierId) === selectedSupplierId);

  // Group triggered items by Supplier
  const supplierGroups: { [key: string]: AutoReorderSuggestion[] } = {};
  filteredItems.forEach((item) => {
    const key = item.preferredSupplierId ? String(item.preferredSupplierId) : 'unassigned';
    if (!supplierGroups[key]) supplierGroups[key] = [];
    supplierGroups[key].push(item);
  });

  // 1-Click Auto-Draft PO for a specific supplier
  const handleDraftPOForSupplier = async (supplierIdStr: string, itemsToOrder: AutoReorderSuggestion[]) => {
    const suppId = supplierIdStr !== 'unassigned' ? Number(supplierIdStr) : (suppliers[0]?.id || 1);
    const supp = suppliers.find((s) => s.id === suppId) || suppliers[0];
    
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + (supp?.paymentTerms?.includes('14') ? 14 : 30) * 86400000)
      .toISOString()
      .slice(0, 10);

    const poItems = itemsToOrder.map((it) => ({
      inventoryId: it.inventoryId,
      itemName: it.itemName,
      unit: it.unit,
      quantity: it.suggestedOrderQty,
      unitCost: it.unitCost,
      subtotal: it.suggestedOrderQty * it.unitCost,
    }));

    const totalAmount = poItems.reduce((sum, i) => sum + i.subtotal, 0);

    try {
      await createPO({
        poNumber: `PO-AUTO-${Date.now().toString().slice(-4)}`,
        supplierId: suppId,
        supplierName: supp?.name || 'Vendor',
        status: 'draft',
        paymentStatus: 'unpaid',
        paymentTerms: supp?.paymentTerms || 'Net 30',
        totalAmount,
        amountPaid: 0,
        issueDate: today,
        dueDate: due,
        notes: `Automated Lead-Time Reorder for ${itemsToOrder.length} items. Target delivery in ${itemsToOrder[0]?.leadTimeDays || 7} days.`,
        items: poItems,
      });

      showToast(`Draft Purchase Order created for ${supp?.name} (${formatMoney(totalAmount)})`, 'success');
      await refreshData();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to auto-draft PO', 'error');
    }
  };

  // 1-Click Auto-Draft All Purchase Orders Across All Vendors
  const handleDraftAllPOs = async () => {
    const groupKeys = Object.keys(supplierGroups);
    if (groupKeys.length === 0) return;

    setIsDraftingAll(true);
    let draftedCount = 0;

    for (const key of groupKeys) {
      const items = supplierGroups[key];
      const suppId = key !== 'unassigned' ? Number(key) : (suppliers[0]?.id || 1);
      const supp = suppliers.find((s) => s.id === suppId) || suppliers[0];
      const today = new Date().toISOString().slice(0, 10);
      const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

      const poItems = items.map((it) => ({
        inventoryId: it.inventoryId,
        itemName: it.itemName,
        unit: it.unit,
        quantity: it.suggestedOrderQty,
        unitCost: it.unitCost,
        subtotal: it.suggestedOrderQty * it.unitCost,
      }));

      const totalAmount = poItems.reduce((sum, i) => sum + i.subtotal, 0);

      try {
        await createPO({
          poNumber: `PO-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
          supplierId: suppId,
          supplierName: supp?.name || 'Vendor',
          status: 'draft',
          paymentStatus: 'unpaid',
          paymentTerms: supp?.paymentTerms || 'Net 30',
          totalAmount,
          amountPaid: 0,
          issueDate: today,
          dueDate: due,
          notes: `Batch Auto-Reorder PO based on lead times and sales velocity.`,
          items: poItems,
        });
        draftedCount++;
      } catch (err) {
        console.error(err);
      }
    }

    setIsDraftingAll(false);
    showToast(`Successfully created ${draftedCount} automated Purchase Orders!`, 'success');
    await refreshData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-800 text-white p-5 sm:p-6 shrink-0 relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold shadow-inner">
                <Zap className="w-6 h-6 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    Automated Lead-Time Reorder Radar
                  </h2>
                  <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Smart ROP Engine
                  </span>
                </div>
                <p className="text-xs text-amber-100 mt-0.5">
                  Calculates dynamic Reorder Points (ROP) = (Sales Velocity × Vendor Transit Days) + Safety Buffer
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-amber-200 hover:text-white rounded-xl hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 pt-4 border-t border-amber-500/40 text-xs">
            <div className="bg-black/15 p-2.5 rounded-xl">
              <span className="text-amber-200 block text-[10px] uppercase font-bold">Triggered SKUs</span>
              <span className="text-lg font-black">{triggeredItems.length} items</span>
            </div>
            <div className="bg-black/15 p-2.5 rounded-xl">
              <span className="text-rose-200 block text-[10px] uppercase font-bold">Critical Lead-Time Risk</span>
              <span className="text-lg font-black text-rose-200">{criticalItems.length} items</span>
            </div>
            <div className="bg-black/15 p-2.5 rounded-xl">
              <span className="text-amber-200 block text-[10px] uppercase font-bold">Est. Replenishment Capital</span>
              <span className="text-lg font-black">
                {formatMoney(triggeredItems.reduce((s, i) => s + i.estimatedOrderCost, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-600">Filter Vendor:</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white font-medium focus:outline-none"
            >
              <option value="all">All Vendors ({Object.keys(supplierGroups).length})</option>
              {suppliers.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {filteredItems.length > 0 && (
            <button
              onClick={handleDraftAllPOs}
              disabled={isDraftingAll}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isDraftingAll ? 'Generating Purchase Orders...' : `1-Click Auto-Draft All POs (${Object.keys(supplierGroups).length} Vendors)`}
              </span>
            </button>
          )}
        </div>

        {/* Scrollable Suggestions List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {Object.keys(supplierGroups).length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">All Inventory Stock is Well-Supplied!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No items have breached their dynamic lead-time reorder thresholds. Vendor delivery buffers are healthy.
              </p>
            </div>
          ) : (
            Object.keys(supplierGroups).map((supplierKey) => {
              const groupItems = supplierGroups[supplierKey];
              const supp = suppliers.find((s) => String(s.id) === supplierKey);
              const groupTotalCost = groupItems.reduce((sum, i) => sum + i.estimatedOrderCost, 0);

              return (
                <div
                  key={supplierKey}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
                >
                  {/* Supplier Header */}
                  <div className="p-4 bg-slate-100/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-700 font-bold">
                        <Building className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs">
                          {supp?.name || 'Unassigned Supplier'}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          {groupItems.length} SKUs require reorder • Terms: {supp?.paymentTerms || 'Net 30'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Est. PO Cost</span>
                        <span className="font-black text-xs text-slate-900">{formatMoney(groupTotalCost)}</span>
                      </div>
                      <button
                        onClick={() => handleDraftPOForSupplier(supplierKey, groupItems)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all shadow-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Draft Vendor PO</span>
                      </button>
                    </div>
                  </div>

                  {/* Items List in this Supplier Group */}
                  <div className="divide-y divide-slate-100 text-xs">
                    {groupItems.map((item) => {
                      const isCritical = item.urgency === 'critical' || item.urgency === 'stockout';

                      return (
                        <div key={item.inventoryId} className="p-3.5 hover:bg-slate-50/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start space-x-3 min-w-0">
                            <div
                              className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                                isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-bold text-slate-900 truncate">{item.itemName}</h4>
                                {isCritical && (
                                  <span className="text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded font-mono animate-pulse">
                                    TRANSIT RISK
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-1 font-medium">
                                <span>SKU: {item.sku}</span>
                                <span>•</span>
                                <span>Current: <strong className="text-slate-900">{item.currentQuantity} {item.unit}</strong></span>
                                <span>•</span>
                                <span>Velocity: <strong>{item.dailyVelocity} / day</strong></span>
                                <span>•</span>
                                <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded">
                                  Transit Lead Time: <strong>{item.leadTimeDays} days</strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Dynamic ROP & Recommended Reorder */}
                          <div className="flex items-center space-x-4 shrink-0 sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 justify-between sm:justify-end">
                            <div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">
                                Stockout Risk
                              </div>
                              <div className={`font-bold text-xs ${isCritical ? 'text-rose-600' : 'text-amber-700'}`}>
                                ~{item.daysRemaining} days left ({item.estimatedStockoutDate})
                              </div>
                            </div>

                            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-right">
                              <div className="text-[10px] uppercase font-bold text-emerald-800">
                                Recommended Order
                              </div>
                              <div className="text-xs font-black text-emerald-900">
                                {item.suggestedOrderQty} {item.unit} ({formatMoney(item.estimatedOrderCost)})
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>ROP Formula dynamically adapts to actual sales velocities & vendor turnaround times</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all"
          >
            Close Radar
          </button>
        </div>

      </div>
    </div>
  );
};
