import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  Download,
  Printer,
  Package,
  ShieldCheck,
  Building,
  Clock,
  ArrowUpRight,
  Filter,
  Users,
  Wallet,
  BookOpen,
  PieChart,
  ArrowDownLeft,
} from 'lucide-react';
import logoImg from '../assets/images/b2b_supply_tracker_logo_1787039083352.jpg';

export const ReportsView: React.FC = () => {
  const {
    purchaseOrders,
    suppliers,
    customers,
    customerTransactions,
    inventory,
    payments,
    formatMoney,
    setSelectedPO,
    openPaymentModal,
    showToast,
    totalReceivables,
    totalPayables,
  } = useApp();

  const [reportType, setReportType] = useState<'ap_aging' | 'ar_aging' | 'pnl' | 'cashflow' | 'inventory_valuation'>('ap_aging');
  const [agingFilter, setAgingFilter] = useState<'all' | '0_15' | '16_30' | '31_60' | '60_plus'>('all');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compute Payables (AP) Aging
  const unpaidPOs = purchaseOrders.filter(
    (po) => po.paymentStatus !== 'paid' && po.status !== 'cancelled'
  );

  const apAgingBuckets = {
    current: [] as typeof unpaidPOs,
    dueSoon: [] as typeof unpaidPOs,
    pastDue: [] as typeof unpaidPOs,
    critical: [] as typeof unpaidPOs,
  };

  let totalOutstandingDebt = 0;
  unpaidPOs.forEach((po) => {
    const remaining = Math.max(0, po.totalAmount - (po.amountPaid || 0));
    totalOutstandingDebt += remaining;

    const dueDate = new Date(po.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      apAgingBuckets.current.push(po);
    } else if (diffDays <= 15) {
      apAgingBuckets.current.push(po);
    } else if (diffDays <= 30) {
      apAgingBuckets.dueSoon.push(po);
    } else if (diffDays <= 60) {
      apAgingBuckets.pastDue.push(po);
    } else {
      apAgingBuckets.critical.push(po);
    }
  });

  const sumAPBucket = (list: typeof unpaidPOs) =>
    list.reduce((sum, po) => sum + Math.max(0, po.totalAmount - (po.amountPaid || 0)), 0);

  const amountCurrent = sumAPBucket(apAgingBuckets.current);
  const amountDueSoon = sumAPBucket(apAgingBuckets.dueSoon);
  const amountPastDue = sumAPBucket(apAgingBuckets.pastDue);
  const amountCritical = sumAPBucket(apAgingBuckets.critical);

  // AR Aging (Customers)
  const debtorCustomers = customers.filter((c) => (c.currentBalance || 0) > 0);

  // P&L Calculations
  const totalSalesRevenue = customerTransactions
    .filter((tx) => tx.type === 'gave')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalPurchasesCOGS = purchaseOrders
    .filter((po) => po.status === 'received')
    .reduce((sum, po) => sum + Number(po.totalAmount || 0), 0);

  const grossProfit = totalSalesRevenue - totalPurchasesCOGS;

  // Inventory Valuation & Margin
  const totalWholesaleValue = inventory.reduce((sum, i) => sum + i.quantity * i.costPrice, 0);
  const totalRetailValue = inventory.reduce((sum, i) => sum + i.quantity * i.sellingPrice, 0);
  const potentialProfit = Math.max(0, totalRetailValue - totalWholesaleValue);

  // Cash Inflow vs Outflow
  const totalCashCollected = customerTransactions
    .filter((tx) => tx.type === 'got')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalVendorDisbursements = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const netCashFlow = totalCashCollected - totalVendorDisbursements;

  const handleExportCSV = () => {
    let csv = `B2B Supply Tracker Accounting Report: ${reportType.toUpperCase()}\n`;
    csv += `Generated: ${new Date().toISOString()}\n\n`;

    if (reportType === 'ap_aging') {
      csv += `PO Number,Supplier,Due Date,Total Amount,Paid,Balance Due,Aging Status\n`;
      unpaidPOs.forEach((po) => {
        const bal = Math.max(0, po.totalAmount - (po.amountPaid || 0));
        csv += `"${po.poNumber}","${po.supplierName}","${po.dueDate}",${po.totalAmount},${po.amountPaid || 0},${bal},"${po.paymentStatus}"\n`;
      });
    } else if (reportType === 'ar_aging') {
      csv += `Customer Name,Phone,Address,Outstanding Balance\n`;
      debtorCustomers.forEach((c) => {
        csv += `"${c.name}","${c.phone || ''}","${c.address || ''}",${c.currentBalance || 0}\n`;
      });
    } else if (reportType === 'pnl') {
      csv += `Metric,Amount\n`;
      csv += `Total Sales Revenue,${totalSalesRevenue}\n`;
      csv += `Cost of Goods Sold (Billed POs),${totalPurchasesCOGS}\n`;
      csv += `Gross Profit / Margin,${grossProfit}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Zoho_Books_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported report to CSV', 'success');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Zoho Books Reports Navigation Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              Accounting & Financial Statements
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Zoho Books compliant aging schedules, double-entry trial balance, and profit & loss analysis.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5"
            title="Print Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Print</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Zoho Books Report Category Selector */}
      <div className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'ap_aging', label: 'AP Aging Summary (Vendors)', icon: Building },
          { id: 'ar_aging', label: 'AR Aging Summary (Customers)', icon: Users },
          { id: 'pnl', label: 'Profit & Loss Statement', icon: TrendingUp },
          { id: 'cashflow', label: 'Cash Flow Statement', icon: Wallet },
          { id: 'inventory_valuation', label: 'Inventory Valuation', icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                reportType === tab.id
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. REPORT CONTENT: AP Aging Summary */}
      {reportType === 'ap_aging' && (
        <div className="space-y-4">
          {/* Aging Matrix Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-emerald-600">
                Current (0-15 Days)
              </span>
              <div className="text-xl font-black text-slate-900 mt-1">{formatMoney(amountCurrent)}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">{apAgingBuckets.current.length} bills</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-amber-600">
                Due Soon (16-30 Days)
              </span>
              <div className="text-xl font-black text-slate-900 mt-1">{formatMoney(amountDueSoon)}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">{apAgingBuckets.dueSoon.length} bills</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-rose-500">
                Past Due (31-60 Days)
              </span>
              <div className="text-xl font-black text-slate-900 mt-1">{formatMoney(amountPastDue)}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">{apAgingBuckets.pastDue.length} bills</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-rose-700">
                Critical (&gt; 60 Days)
              </span>
              <div className="text-xl font-black text-rose-700 mt-1">{formatMoney(amountCritical)}</div>
              <p className="text-[11px] text-rose-600 mt-0.5">{apAgingBuckets.critical.length} bills</p>
            </div>
          </div>

          {/* Aging Schedule Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Accounts Payable Aging Schedule
              </h3>
              <span className="text-xs font-bold text-slate-500">
                Total Outstanding: {formatMoney(totalOutstandingDebt)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">PO / Bill #</th>
                    <th className="py-2.5 px-4">Vendor</th>
                    <th className="py-2.5 px-4">Due Date</th>
                    <th className="py-2.5 px-4 text-right">Bill Amount</th>
                    <th className="py-2.5 px-4 text-right">Paid</th>
                    <th className="py-2.5 px-4 text-right">Balance Due</th>
                    <th className="py-2.5 px-4 text-center">Aging Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unpaidPOs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No outstanding supplier debt bills. Perfect balance!
                      </td>
                    </tr>
                  ) : (
                    unpaidPOs.map((po) => {
                      const balance = Math.max(0, po.totalAmount - (po.amountPaid || 0));
                      const isOverdue = po.dueDate < new Date().toISOString().slice(0, 10);
                      return (
                        <tr
                          key={po.id}
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => setSelectedPO(po)}
                        >
                          <td className="py-2.5 px-4 font-mono font-bold text-blue-600">
                            {po.poNumber}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{po.supplierName}</td>
                          <td className="py-2.5 px-4 text-slate-600">{po.dueDate}</td>
                          <td className="py-2.5 px-4 text-right">{formatMoney(po.totalAmount)}</td>
                          <td className="py-2.5 px-4 text-right text-emerald-600">
                            {formatMoney(po.amountPaid || 0)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-black text-rose-600">
                            {formatMoney(balance)}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {isOverdue ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800">
                                OVERDUE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                CURRENT
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. REPORT CONTENT: AR Aging Summary (Customers) */}
      {reportType === 'ar_aging' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Accounts Receivable (AR) Customer Ledger
              </h3>
              <p className="text-[11px] text-slate-400">Receivables owed by customers on credit</p>
            </div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              Total AR: {formatMoney(totalReceivables)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4">Phone</th>
                  <th className="py-2.5 px-4">Address / Area</th>
                  <th className="py-2.5 px-4 text-right">Credit Balance Due</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {debtorCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No customer credit receivables outstanding.
                    </td>
                  </tr>
                ) : (
                  debtorCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-2.5 px-4 text-slate-500">{c.phone || 'N/A'}</td>
                      <td className="py-2.5 px-4 text-slate-500">{c.address || 'Local Market'}</td>
                      <td className="py-2.5 px-4 text-right font-black text-emerald-600">
                        {formatMoney(c.currentBalance || 0)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          RECEIVABLE
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. REPORT CONTENT: Profit & Loss Statement (P&L) */}
      {reportType === 'pnl' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-6 max-w-3xl mx-auto space-y-6">
          <div className="text-center border-b border-slate-200 pb-4 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-white p-0.5 border border-slate-200 shadow-2xs mb-2 overflow-hidden flex items-center justify-center">
              <img
                src={logoImg}
                alt="B2B Supply Tracker"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              B2B Supply Tracker
            </h2>
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mt-0.5">
              Statement of Profit and Loss
            </h3>
            <p className="text-xs text-slate-500 mt-1">For the Financial Year 2026-2027</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Operating Revenue */}
            <div>
              <div className="flex justify-between font-bold text-slate-900 text-sm py-1 border-b border-slate-200">
                <span>Operating Revenue / Sales</span>
                <span>{formatMoney(totalSalesRevenue)}</span>
              </div>
              <div className="pl-4 py-1.5 flex justify-between text-slate-600">
                <span>Customer Credit & Cash Sales</span>
                <span>{formatMoney(totalSalesRevenue)}</span>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div>
              <div className="flex justify-between font-bold text-slate-900 text-sm py-1 border-b border-slate-200">
                <span>Cost of Goods Sold (COGS)</span>
                <span className="text-rose-600">({formatMoney(totalPurchasesCOGS)})</span>
              </div>
              <div className="pl-4 py-1.5 flex justify-between text-slate-600">
                <span>Wholesale Distributor Purchases (Billed)</span>
                <span>{formatMoney(totalPurchasesCOGS)}</span>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex justify-between items-center text-sm font-black text-slate-900">
              <span>Gross Profit</span>
              <span className={grossProfit >= 0 ? 'text-blue-700' : 'text-rose-700'}>
                {formatMoney(grossProfit)}
              </span>
            </div>

            {/* Operating Expenses */}
            <div>
              <div className="flex justify-between font-bold text-slate-900 text-sm py-1 border-b border-slate-200">
                <span>Operating Expenses</span>
                <span>{formatMoney(0)}</span>
              </div>
              <div className="pl-4 py-1.5 flex justify-between text-slate-600">
                <span>Direct Freight & Transportation</span>
                <span>{formatMoney(0)}</span>
              </div>
            </div>

            {/* Net Operating Income */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center text-base font-black">
              <span>Net Profit (EBITDA)</span>
              <span className="text-emerald-400">{formatMoney(grossProfit)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. REPORT CONTENT: Cash Flow Statement */}
      {reportType === 'cashflow' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-6 max-w-3xl mx-auto space-y-6">
          <div className="text-center border-b border-slate-200 pb-4 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-white p-0.5 border border-slate-200 shadow-2xs mb-2 overflow-hidden flex items-center justify-center">
              <img
                src={logoImg}
                alt="B2B Supply Tracker"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              B2B Supply Tracker
            </h2>
            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mt-0.5">
              Statement of Cash Flows
            </h3>
            <p className="text-xs text-slate-500 mt-1">Realized Cash Inflows & Outflows</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center font-bold">
              <span className="text-emerald-900">Cash Inflows (Customer Payments Collected)</span>
              <span className="text-emerald-700 text-sm">+{formatMoney(totalCashCollected)}</span>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex justify-between items-center font-bold">
              <span className="text-rose-900">Cash Outflows (Vendor Disbursements)</span>
              <span className="text-rose-700 text-sm">-{formatMoney(totalVendorDisbursements)}</span>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center text-base font-black">
              <span>Net Cash Position</span>
              <span className={netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {formatMoney(netCashFlow)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 7. REPORT CONTENT: Inventory Valuation */}
      {reportType === 'inventory_valuation' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Stock Valuation & Potential Markup
              </h3>
              <p className="text-[11px] text-slate-400">
                Cost vs Retail valuation across all warehouse SKUs
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600">
              Wholesale Valuation: {formatMoney(totalWholesaleValue)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 text-[11px] font-bold block">Wholesale Cost Value</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatMoney(totalWholesaleValue)}
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 text-[11px] font-bold block">Retail Sales Value</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatMoney(totalRetailValue)}
              </span>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-emerald-700 text-[11px] font-bold block">Unrealized Gross Margin</span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">
                {formatMoney(potentialProfit)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
