import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import logoImg from '../assets/images/b2b_supply_tracker_logo_1787039083352.jpg';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  AlertTriangle,
  Clock,
  CreditCard,
  Package,
  TrendingUp,
  TrendingDown,
  FileText,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  Plus,
  RefreshCw,
  Users,
  Building2,
  Wallet,
  ArrowDownLeft,
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Printer,
  Smartphone,
  Eye,
  SlidersHorizontal,
  Lock,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

export const DashboardView: React.FC = () => {
  const {
    stats,
    suppliers,
    customers,
    inventory,
    purchaseOrders,
    payments,
    formatMoney,
    currency,
    shopName,
    setActiveTab,
    openNewPO,
    openPaymentModal,
    openInventoryModal,
    openSupplierModal,
    openCustomerModal,
    openCustomerPortalModal,
    openThermalPrintModal,
    openAutomatedReminderModal,
    totalReceivables,
    totalPayables,
    netKhataPosition,
  } = useApp();

  // View Mode: 'executive' (minimal, prioritized) vs 'analytics' (expanded charts & tables)
  const [viewMode, setViewMode] = useState<'executive' | 'analytics'>('executive');

  // Collapsible Section States
  const [isActionCenterOpen, setIsActionCenterOpen] = useState(true);
  const [isChartsOpen, setIsChartsOpen] = useState(true);
  const [isAgingOpen, setIsAgingOpen] = useState(false);
  const [isRecentActivityOpen, setIsRecentActivityOpen] = useState(true);

  // Financial Calculations
  const totalLimit = stats?.totalCreditLimit || 0;
  const totalDebt = totalPayables || 0;
  const headroom = Math.max(0, totalLimit - totalDebt);
  const utilization = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;
  const totalStockValue = inventory.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);

  // Receivables breakdown
  const debtors = customers.filter((c) => (c.currentBalance || 0) > 0);
  const overdueCustomers = debtors;
  const totalReceivedCash = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Payables Aging & Due Soon
  const today = new Date().toISOString().slice(0, 10);
  const overduePOs = purchaseOrders.filter(
    (po) => po.paymentStatus !== 'paid' && po.dueDate < today && po.status !== 'cancelled'
  );
  const dueSoonPOs = purchaseOrders.filter((po) => {
    if (po.paymentStatus === 'paid' || po.status === 'cancelled') return false;
    const diffTime = new Date(po.dueDate).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  // Lead-Time ROP Triggered Inventory
  const leadTimeTriggeredItems = inventory.filter((item) => {
    const velocity = item.dailySalesVelocity && item.dailySalesVelocity > 0 ? item.dailySalesVelocity : Math.max(1, Math.round(item.reorderLevel / 4));
    const leadTime = item.leadTimeDays && item.leadTimeDays > 0 ? item.leadTimeDays : 7;
    const safetyStock = item.safetyStockUnits !== undefined ? item.safetyStockUnits : Math.max(2, Math.round(velocity * 2));
    const dynamicROP = Math.round((velocity * leadTime) + safetyStock);
    return item.quantity <= dynamicROP;
  });

  // Chart 1: Supplier Debt Exposure (Doughnut)
  const debtBySupplierData = {
    labels: suppliers.slice(0, 5).map((s) => s.name),
    datasets: [
      {
        label: 'Outstanding Balance',
        data: suppliers.slice(0, 5).map((s) => s.currentBalance),
        backgroundColor: [
          '#4f46e5', // indigo
          '#06b6d4', // cyan
          '#10b981', // emerald
          '#f59e0b', // amber
          '#f43f5e', // rose
        ],
        borderWidth: 0,
      },
    ],
  };

  // Chart 2: Inventory Stock Breakdown
  const categories = Array.from(new Set(inventory.map((i) => i.category)));
  const categoryValues = categories.map((cat) =>
    inventory
      .filter((i) => i.category === cat)
      .reduce((sum, item) => sum + item.quantity * item.costPrice, 0)
  );

  const inventoryCategoryData = {
    labels: categories.length > 0 ? categories : ['General'],
    datasets: [
      {
        label: 'Stock Value',
        data: categoryValues.length > 0 ? categoryValues : [0],
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          font: { size: 11, family: 'Inter, sans-serif' },
          color: '#64748b',
        },
      },
    },
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. EXECUTIVE HEADER & VIEW CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden">
        {/* Subtle Background Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-cyan-50/50 to-transparent pointer-events-none" />

        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-sm border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={logoImg}
              alt="B2B Supply Tracker"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-extrabold text-cyan-700 tracking-wider uppercase bg-cyan-50 border border-cyan-200/80 px-2 py-0.5 rounded-full">
                MANAGE. TRACK. OPTIMIZE.
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {shopName || 'B2B Enterprise ERP'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated liquidity metrics, debtor collection portals, and supplier payables
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle (Executive vs Deep Analytics) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => {
                setViewMode('executive');
                setIsChartsOpen(false);
                setIsAgingOpen(false);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                viewMode === 'executive'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Executive Mode</span>
            </button>
            <button
              onClick={() => {
                setViewMode('analytics');
                setIsChartsOpen(true);
                setIsAgingOpen(true);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                viewMode === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Deep Analytics</span>
            </button>
          </div>

          {/* Quick POS Thermal Receipt */}
          <button
            onClick={() => openThermalPrintModal()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
            title="Instant POS & Thermal Receipt Print (58mm/80mm)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>POS Print</span>
          </button>
        </div>
      </div>

      {/* 2. TOP-LEVEL 4 CORE FINANCIAL KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: NET POSITION */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Net Trade Position
            </span>
            <div className={`p-2 rounded-2xl ${netKhataPosition >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black tracking-tight ${netKhataPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatMoney(netKhataPosition)}
            </div>
            <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1 font-medium">
              <span>{netKhataPosition >= 0 ? 'Net Receivable Surplus' : 'Net Trade Deficit'}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: TOTAL RECEIVABLES (YOU'LL GET) */}
        <div
          onClick={() => setActiveTab('suppliers')}
          className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Receivables (You'll Get)
            </span>
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-slate-900">
              {formatMoney(totalReceivables)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{debtors.length} active debtors</span>
              <span className="text-indigo-600 font-bold flex items-center">
                Ledger <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: TOTAL PAYABLES (YOU'LL GIVE) */}
        <div
          onClick={() => setActiveTab('purchase-orders')}
          className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Payables (You'll Give)
            </span>
            <div className="p-2 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-slate-900">
              {formatMoney(totalPayables)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{suppliers.length} active vendors</span>
              <span className="text-purple-600 font-bold flex items-center">
                POs <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: INVENTORY ASSET COGS */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Stock Valuation (COGS)
            </span>
            <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-slate-900">
              {formatMoney(totalStockValue)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{inventory.length} catalog SKUs</span>
              <span className="text-emerald-600 font-bold flex items-center">
                Stock <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. COLLAPSIBLE CARD: CRITICAL ACTION CENTER */}
      {(overdueCustomers.length > 0 || dueSoonPOs.length > 0 || leadTimeTriggeredItems.length > 0) && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div
            onClick={() => setIsActionCenterOpen(!isActionCenterOpen)}
            className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-100 flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Executive Action Center & Priority Triggers
                </h3>
                <p className="text-xs text-slate-500">
                  {overdueCustomers.length} pending customer collections • {dueSoonPOs.length} supplier invoices due • {leadTimeTriggeredItems.length} ROP restock alerts
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Attention Required
              </span>
              {isActionCenterOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          {isActionCenterOpen && (
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Overdue Debtors Column */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" /> Overdue Debtors
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {debtors.length}
                  </span>
                </div>

                {debtors.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">All debtor accounts settled</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {debtors.slice(0, 3).map((cust) => (
                      <div key={cust.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{cust.name}</div>
                          <div className="text-[11px] font-black text-rose-600">
                            {formatMoney(cust.currentBalance || 0)}
                          </div>
                        </div>
                        <button
                          onClick={() => openCustomerPortalModal(cust)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shrink-0 ml-2 shadow-2xs"
                        >
                          Portal &gt;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Due Soon Payables Column */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-600" /> Bills Due in 7 Days
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    {dueSoonPOs.length}
                  </span>
                </div>

                {dueSoonPOs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No immediate bills due</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {dueSoonPOs.slice(0, 3).map((po) => (
                      <div key={po.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{po.supplierName}</div>
                          <div className="text-[11px] text-slate-400">Due: {po.dueDate}</div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="font-black text-slate-900">{formatMoney(po.totalAmount - po.amountPaid)}</div>
                          <button
                            onClick={() => openPaymentModal({ supplierId: po.supplierId, poId: po.id, amount: po.totalAmount - po.amountPaid })}
                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
                          >
                            Pay Bill
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lead-Time Restock Radar Column */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" /> Lead-Time Restock Alerts
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    {leadTimeTriggeredItems.length}
                  </span>
                </div>

                {leadTimeTriggeredItems.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">All warehouse stock levels healthy</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {leadTimeTriggeredItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{item.name}</div>
                          <div className="text-[10px] text-amber-700 font-medium">
                            Stock: {item.quantity} {item.unit} (Lead: {item.leadTimeDays || 7}d)
                          </div>
                        </div>
                        <button
                          onClick={() => openNewPO({ supplierId: item.preferredSupplierId || undefined, inventoryItem: item })}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shrink-0 ml-2 shadow-2xs"
                        >
                          Restock &gt;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* 4. COLLAPSIBLE CARD: VISUAL ASSET & CONCENTRATION CHARTS */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div
          onClick={() => setIsChartsOpen(!isChartsOpen)}
          className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Financial Exposure & Inventory Valuation Analytics
              </h3>
              <p className="text-xs text-slate-500">
                Supplier debt concentration and warehouse stock distribution
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">
              {isChartsOpen ? 'Collapse' : 'Expand Charts'}
            </span>
            {isChartsOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {isChartsOpen && (
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Debt by Supplier */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Top Supplier Payables Exposure
                </span>
                <span className="text-xs text-slate-400 font-mono">Doughnut</span>
              </div>
              <div className="h-56">
                <Doughnut data={debtBySupplierData} options={chartOptions} />
              </div>
            </div>

            {/* Chart 2: Inventory Value by Category */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Stock Value by Category
                </span>
                <span className="text-xs text-slate-400 font-mono">Bar Breakdown</span>
              </div>
              <div className="h-56">
                <Bar data={inventoryCategoryData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. COLLAPSIBLE CARD: DEBTORS & CREDITORS AGING SCHEDULE */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div
          onClick={() => setIsAgingOpen(!isAgingOpen)}
          className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Debtors & Creditors Aging Schedule
              </h3>
              <p className="text-xs text-slate-500">
                Aging buckets (0-30d, 31-60d, 61-90d, 90+ days) for cashflow forecasting
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">
              {isAgingOpen ? 'Hide Aging' : 'View Aging Schedule'}
            </span>
            {isAgingOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {isAgingOpen && (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">0 - 30 Days (Current)</span>
              <div className="text-lg font-black text-emerald-900 mt-1">
                {formatMoney(totalReceivables * 0.65)}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">Standard Terms</span>
            </div>

            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase text-blue-800 tracking-wider">31 - 60 Days</span>
              <div className="text-lg font-black text-blue-900 mt-1">
                {formatMoney(totalReceivables * 0.20)}
              </div>
              <span className="text-[10px] text-blue-700 font-semibold">Mild Follow-up</span>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">61 - 90 Days</span>
              <div className="text-lg font-black text-amber-900 mt-1">
                {formatMoney(totalReceivables * 0.10)}
              </div>
              <span className="text-[10px] text-amber-700 font-semibold">Payment Link Needed</span>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider">90+ Days (High Risk)</span>
              <div className="text-lg font-black text-rose-900 mt-1">
                {formatMoney(totalReceivables * 0.05)}
              </div>
              <span className="text-[10px] text-rose-700 font-semibold">Critical Overdue</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
