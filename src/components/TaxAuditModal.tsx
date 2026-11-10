import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  X,
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  Building,
  Scale,
  Calculator,
} from 'lucide-react';
import { calculateTaxAuditSummary, exportTaxAuditCSV } from '../lib/taxEngine.ts';

interface TaxAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaxAuditModal: React.FC<TaxAuditModalProps> = ({ isOpen, onClose }) => {
  const {
    customerTransactions,
    purchaseOrders,
    formatMoney,
    showToast,
    userProfile,
    organizationProfile,
  } = useApp();

  const [taxRegime, setTaxRegime] = useState<'GST' | 'VAT' | 'SALES_TAX'>('GST');
  const [taxRate, setTaxRate] = useState<number>(18);

  const summary = useMemo(() => {
    return calculateTaxAuditSummary(taxRegime, customerTransactions, purchaseOrders, taxRate);
  }, [taxRegime, customerTransactions, purchaseOrders, taxRate]);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    const csvContent = exportTaxAuditCSV(summary, customerTransactions, purchaseOrders);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tax_Audit_Schedule_${taxRegime}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast(`Downloaded official ${taxRegime} Tax Audit Schedule!`, 'success');
  };

  const handlePrintSchedule = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
              <Scale className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base tracking-tight">One-Click Tax & Audit Filing Suite</h3>
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase rounded">
                  Compliance Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate pre-formatted GST, VAT, and Sales Tax schedules for local auditor submission
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Tax Standard:</span>
            <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200">
              {(['GST', 'VAT', 'SALES_TAX'] as const).map((regime) => (
                <button
                  key={regime}
                  type="button"
                  onClick={() => setTaxRegime(regime)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    taxRegime === regime ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {regime === 'SALES_TAX' ? 'Sales Tax' : regime}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Applicable Rate:</span>
            <select
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
            >
              <option value={5}>5% (Basic / Concessional)</option>
              <option value={12}>12% (Standard Lower)</option>
              <option value={16}>16% (Kenya VAT)</option>
              <option value={18}>18% (Standard GST / VAT)</option>
              <option value={28}>28% (Luxury / Sin Goods)</option>
            </select>
          </div>
        </div>

        {/* Audit Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {/* Executive Tax Computation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Output Tax (Sales)
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatMoney(summary.totalOutputTax)}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                On Gross Sales of {formatMoney(summary.grossSalesTurnover)}
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Input Tax Credit (ITC / VAT In)
              </span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">
                {formatMoney(summary.totalInputTaxCredit)}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                On Gross POs of {formatMoney(summary.grossPurchasesCOGS)}
              </span>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                Net Tax Liability Payable
              </span>
              <span className="text-xl font-black text-blue-800 mt-1 block">
                {formatMoney(summary.netTaxPayable)}
              </span>
              <span className="text-[11px] text-blue-600 mt-1 block font-medium">
                Output Tax minus Eligible ITC Credit
              </span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-800 flex justify-between">
              <span>Tax Schedule Summary Table</span>
              <span>{summary.period}</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="p-3 flex justify-between">
                <span className="font-medium text-slate-600">Gross Taxable Outward Supplies (B2B + B2C)</span>
                <span className="font-bold text-slate-900">{formatMoney(summary.taxableSalesAmount)}</span>
              </div>
              {taxRegime === 'GST' && (
                <>
                  <div className="p-3 flex justify-between pl-6 bg-slate-50/50">
                    <span className="text-slate-500">Central Tax (CGST @ {(taxRate / 2).toFixed(1)}%)</span>
                    <span className="font-medium text-slate-800">{formatMoney(summary.cgstAmount)}</span>
                  </div>
                  <div className="p-3 flex justify-between pl-6 bg-slate-50/50">
                    <span className="text-slate-500">State Tax (SGST @ {(taxRate / 2).toFixed(1)}%)</span>
                    <span className="font-medium text-slate-800">{formatMoney(summary.sgstAmount)}</span>
                  </div>
                </>
              )}
              <div className="p-3 flex justify-between">
                <span className="font-medium text-slate-600">Total Inward Supplies Attracting ITC / VAT Refund</span>
                <span className="font-bold text-slate-900">{formatMoney(summary.taxablePurchasesAmount)}</span>
              </div>
              <div className="p-3 flex justify-between bg-slate-900 text-white font-black">
                <span>FINAL NET TAX REMITTANCE PAYABLE</span>
                <span className="text-emerald-400">{formatMoney(summary.netTaxPayable)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              All computations are backed by itemized invoice records ({summary.recordsCount} transactions audited).
            </span>
          </div>

          {/* Authorized Signatory & Tax Identity Block */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs">
            <div className="text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">{organizationProfile?.companyName || 'Mwangi Global Traders Ltd'}</p>
              <p>Phone: {organizationProfile?.phone || '+254 700 123 456'} {organizationProfile?.email && `• ${organizationProfile.email}`}</p>
              <p>Tax Registration PIN: <span className="font-mono font-bold text-slate-900">{organizationProfile?.taxNumber || 'P051928471Z'}</span></p>
              <p className="text-[10px] text-slate-400">Jurisdiction: {organizationProfile?.country || 'Kenya'} • Fiscal Cycle: {organizationProfile?.fiscalYear || 'Jan - Dec'}</p>
            </div>

            <div className="text-center sm:text-right flex flex-col items-center sm:items-end">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                Authorized Signatory & Seal
              </span>

              {organizationProfile?.signatureDataUrl ? (
                <div className="h-16 w-44 flex items-center justify-center p-1 bg-slate-50 rounded-lg border border-slate-200">
                  <img
                    src={organizationProfile.signatureDataUrl}
                    alt="Authorized Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-14 w-44 flex items-center justify-center text-slate-800 italic font-serif text-base border-b border-slate-400">
                  {organizationProfile?.signatoryName || 'Frankline Mwangi'}
                </div>
              )}

              <div className="border-t border-slate-300 w-44 mt-1 pt-1 text-center">
                <p className="font-bold text-slate-900 text-xs">
                  {organizationProfile?.signatoryName || 'Frankline Mwangi'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {organizationProfile?.signatoryDesignation || 'Managing Director'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Close
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrintSchedule}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Schedule</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel / CSV Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
