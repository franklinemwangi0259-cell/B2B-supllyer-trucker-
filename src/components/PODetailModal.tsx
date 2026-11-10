import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../lib/api.ts';
import {
  X,
  Printer,
  Share2,
  Send,
  Truck,
  DollarSign,
  Copy,
  Check,
  PackageCheck,
  FileText,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  Download,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

import logoImg from '../assets/images/b2b_supply_tracker_logo_1787039083352.jpg';

export const PODetailModal: React.FC = () => {
  const {
    selectedPO,
    setSelectedPO,
    formatMoney,
    refreshData,
    showToast,
    openPaymentModal,
    suppliers,
    organizationProfile,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!selectedPO) return null;

  const supplier = suppliers.find((s) => s.id === selectedPO.supplierId);
  const remainingDebt = Math.max(0, selectedPO.totalAmount - (selectedPO.amountPaid || 0));

  // Generate WhatsApp / SMS dispatch text
  const generateMessageText = () => {
    let msg = `*PURCHASE ORDER: ${selectedPO.poNumber}*\n`;
    msg += `Vendor: ${selectedPO.supplierName}\n`;
    msg += `Issue Date: ${selectedPO.issueDate} | Terms: ${selectedPO.paymentTerms}\n`;
    msg += `Payment Due Date: ${selectedPO.dueDate}\n\n`;
    msg += `*ORDER ITEMS:*\n`;
    selectedPO.items?.forEach((it, idx) => {
      const subtotal = it.quantity * it.unitCost;
      msg += `${idx + 1}. ${it.itemName} - ${it.quantity} ${it.unit} @ ${formatMoney(it.unitCost)} = ${formatMoney(subtotal)}\n`;
    });
    msg += `\n*TOTAL ORDER AMOUNT:* ${formatMoney(selectedPO.totalAmount)}\n`;
    if (selectedPO.notes) msg += `Notes: ${selectedPO.notes}\n`;
    msg += `\nPlease confirm receipt & shipment schedule. Generated via B2B Supply Tracker.`;
    return msg;
  };

  const handleCopyMessage = () => {
    const text = generateMessageText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Order summary copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(generateMessageText());
    const phone = supplier?.phone ? supplier.phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleUpdateStatus = async (newStatus: 'sent' | 'received') => {
    try {
      setUpdating(true);
      await api.updatePOStatus(selectedPO.id, newStatus);
      if (newStatus === 'received') {
        showToast('Stock received! Inventory counts & vendor payables ledger updated automatically.', 'success');
      } else {
        showToast(`PO marked as ${newStatus}`, 'info');
      }
      await refreshData();
      setSelectedPO({ ...selectedPO, status: newStatus });
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Zoho Books Document Action Ribbon */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-sm text-blue-400">{selectedPO.poNumber}</span>
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                selectedPO.status === 'received'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : selectedPO.status === 'sent'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : selectedPO.status === 'cancelled'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {selectedPO.status}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyMessage}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              title="Copy Order Summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleOpenWhatsApp}
              className="p-1.5 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800 transition-all"
              title="Send to Vendor via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <button
              onClick={() => setSelectedPO(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Zoho Books Formal Document Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1 bg-white text-slate-800">
          {/* Company & Document Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-xs flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                  <img
                    src={logoImg}
                    alt="B2B Supply Tracker"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {organizationProfile?.companyName || 'Mwangi Global Traders Ltd'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {organizationProfile?.industry || 'WHOLESALE & DISTRIBUTION'}
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                {organizationProfile?.addressStreet && (
                  <p>{organizationProfile.addressStreet}, {organizationProfile.city || ''} {organizationProfile.country || ''}</p>
                )}
                <p>
                  <span className="font-semibold text-slate-700">Phone:</span> {organizationProfile?.phone || '+254 700 123 456'}
                  {organizationProfile?.email && <span className="ml-2">• {organizationProfile.email}</span>}
                </p>
                {organizationProfile?.taxNumber && (
                  <p><span className="font-semibold text-slate-700">TAX / VAT ID:</span> {organizationProfile.taxNumber}</p>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">PURCHASE ORDER</h1>
              <p className="font-mono text-xs font-bold text-blue-600 mt-0.5">#{selectedPO.poNumber}</p>
              <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                <p>
                  <span className="font-semibold">Issue Date:</span> {selectedPO.issueDate}
                </p>
                <p>
                  <span className="font-semibold">Payment Terms:</span> {selectedPO.paymentTerms}
                </p>
                <p>
                  <span className="font-semibold text-rose-600">Due Date:</span>{' '}
                  <span className="font-bold text-slate-900">{selectedPO.dueDate}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Vendor Bill-To Address Block */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Vendor / Supplier:
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedPO.supplierName}</h3>
              {supplier && (
                <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                  <p>Category: {supplier.category}</p>
                  {supplier.phone && <p>Phone: {supplier.phone}</p>}
                  {supplier.email && <p>Email: {supplier.email}</p>}
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Ship / Deliver To:
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">Main Warehouse & Receiving Bay</p>
              <p className="text-xs text-slate-500">Bay 4, Central Wholesale Market</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5">#</th>
                  <th className="py-2.5 px-3.5">Item & Description</th>
                  <th className="py-2.5 px-3.5 text-right">Qty</th>
                  <th className="py-2.5 px-3.5 text-right">Rate</th>
                  <th className="py-2.5 px-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedPO.items?.map((item, idx) => {
                  const subtotal = item.quantity * item.unitCost;
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3.5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3.5 font-bold text-slate-900">
                        {item.itemName}
                        <span className="text-[11px] font-normal text-slate-500 ml-1.5">
                          ({item.unit})
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-slate-700">
                        {formatMoney(item.unitCost)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-slate-900">
                        {formatMoney(subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Subtotal, Taxes & Grand Total Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start pt-2 gap-4">
            <div className="flex-1 text-xs text-slate-500 space-y-2">
              {selectedPO.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900">
                  <span className="font-bold block text-[11px] mb-0.5">Notes / Terms:</span>
                  <p>{selectedPO.notes}</p>
                </div>
              )}
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatMoney(selectedPO.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (0% Standard):</span>
                <span className="font-semibold">{formatMoney(0)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-blue-600">{formatMoney(selectedPO.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-600 pt-1">
                <span>Amount Paid:</span>
                <span className="font-bold">{formatMoney(selectedPO.amountPaid || 0)}</span>
              </div>
              <div className="flex justify-between text-xs font-black text-rose-600 pt-1 border-t border-dashed border-slate-200">
                <span>Balance Due:</span>
                <span>{formatMoney(remainingDebt)}</span>
              </div>
            </div>
          </div>

          {/* Zoho Books Official Authorized Signatory & Digital Signature */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs">
            <div className="text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Payment & Bank Instructions:</p>
              <p>Account Name: {organizationProfile?.companyName || 'Mwangi Global Traders Ltd'}</p>
              <p>Bank: Commercial Bank / Wire Transfer</p>
              <p className="text-[10px] text-slate-400">This is a computer-generated Zoho Books purchase order.</p>
            </div>

            <div className="text-center sm:text-right flex flex-col items-center sm:items-end">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                For {organizationProfile?.companyName || 'Mwangi Global Traders Ltd'}
              </span>

              {organizationProfile?.signatureDataUrl ? (
                <div className="h-16 w-44 flex items-center justify-center p-1 bg-slate-50/50 rounded-lg border border-slate-200">
                  <img
                    src={organizationProfile.signatureDataUrl}
                    alt="Authorized Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-14 w-44 flex items-center justify-center text-slate-800 italic font-serif text-lg border-b border-slate-400">
                  {organizationProfile?.signatoryName || 'Authorized Signatory'}
                </div>
              )}

              <div className="border-t border-slate-300 w-44 mt-1 pt-1 text-center">
                <p className="font-bold text-slate-900 text-xs">
                  {organizationProfile?.signatoryName || 'Frankline Mwangi'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {organizationProfile?.signatoryDesignation || 'Authorized Signatory'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {selectedPO.status === 'draft' && (
              <button
                onClick={() => handleUpdateStatus('sent')}
                disabled={updating}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Mark Issued & Sent</span>
              </button>
            )}

            {selectedPO.status === 'sent' && (
              <button
                onClick={() => handleUpdateStatus('received')}
                disabled={updating}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Receive Stock & Convert to Bill</span>
              </button>
            )}

            {remainingDebt > 0 && (
              <button
                onClick={() => {
                  setSelectedPO(null);
                  openPaymentModal(selectedPO);
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Record Payment ({formatMoney(remainingDebt)})</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setSelectedPO(null)}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
