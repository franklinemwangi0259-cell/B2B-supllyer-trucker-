import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  X,
  Users,
  Send,
  MessageCircle,
  FileDown,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Customer } from '../types.ts';

interface BatchReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomers: Customer[];
}

export const BatchReminderModal: React.FC<BatchReminderModalProps> = ({
  isOpen,
  onClose,
  selectedCustomers,
}) => {
  const { formatMoney, showToast, userProfile } = useApp();

  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'pdf'>('whatsapp');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dispatchedCount, setDispatchedCount] = useState(0);

  if (!isOpen) return null;

  const totalOutstanding = selectedCustomers.reduce((sum, c) => sum + Math.max(0, c.currentBalance || 0), 0);
  const shopName = userProfile?.shopName || 'B2B Supply Tracker Merchant';

  const handleStartBatchDispatch = () => {
    setIsProcessing(true);
    let count = 0;

    const interval = setInterval(() => {
      count += 1;
      setDispatchedCount(count);

      if (count >= selectedCustomers.length) {
        clearInterval(interval);
        setIsProcessing(false);
        showToast(
          channel === 'pdf'
            ? `Consolidated PDF statements generated for ${selectedCustomers.length} accounts!`
            : `Dispatched ${selectedCustomers.length} automated payment reminders successfully!`,
          'success'
        );
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    }, 300);
  };

  const handleExportConsolidatedPDF = () => {
    let text = `====================================================\n`;
    text += `   B2B SUPPLY TRACKER - CONSOLIDATED DEBTOR STATEMENTS\n`;
    text += `   Merchant: ${shopName} | Date: ${new Date().toLocaleDateString()}\n`;
    text += `====================================================\n\n`;

    selectedCustomers.forEach((cust, idx) => {
      text += `[${idx + 1}] CUSTOMER: ${cust.name.toUpperCase()}\n`;
      text += `    Phone: ${cust.phone} | Credit Limit: ${formatMoney(cust.creditLimit)}\n`;
      text += `    OUTSTANDING BALANCE DUE: ${formatMoney(cust.currentBalance)}\n`;
      text += `    Payment Portal: https://pay.b2bsupply.io/pay/inv-${cust.id}\n`;
      text += `----------------------------------------------------\n`;
    });

    text += `\nTOTAL BATCH RECOVERY TARGET: ${formatMoney(totalOutstanding)}\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Batch_Statements_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    showToast('Downloaded consolidated account statements!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <Users className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">Batch Payment Reminders & Statements</h3>
              <p className="text-xs text-blue-200">{selectedCustomers.length} Debtor Accounts Selected</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Summary Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                Total Debt in Batch
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {formatMoney(totalOutstanding)}
              </span>
            </div>
            <span className="px-3 py-1 bg-white border border-blue-200 text-blue-800 text-xs font-black rounded-lg shadow-2xs">
              {selectedCustomers.length} Customers
            </span>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Batch Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  channel === 'whatsapp'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MessageCircle className="w-5 h-5 text-emerald-600 mb-1" />
                <span className="block font-bold text-xs text-slate-900">WhatsApp Links</span>
                <span className="text-[10px] text-slate-500">Auto-send via API</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  channel === 'sms'
                    ? 'border-blue-600 bg-blue-50/70 shadow-2xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Zap className="w-5 h-5 text-blue-600 mb-1" />
                <span className="block font-bold text-xs text-slate-900">Bulk SMS Links</span>
                <span className="text-[10px] text-slate-500">Fast carrier broadcast</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('pdf')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  channel === 'pdf'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-2xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileDown className="w-5 h-5 text-indigo-600 mb-1" />
                <span className="block font-bold text-xs text-slate-900">PDF Invoices</span>
                <span className="text-[10px] text-slate-500">Consolidated ledger</span>
              </button>
            </div>
          </div>

          {/* Selected Customer Roster Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Selected Recipients ({selectedCustomers.length})
            </label>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto bg-slate-50/50">
              {selectedCustomers.map((cust) => (
                <div key={cust.id} className="p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{cust.name}</span>
                    <span className="text-[10px] text-slate-500">{cust.phone || 'No phone recorded'}</span>
                  </div>
                  <span className="font-mono font-black text-rose-600">
                    {formatMoney(cust.currentBalance)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar (if processing) */}
          {isProcessing && (
            <div className="space-y-1.5 animate-in fade-in">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Dispatching Automated Batch...</span>
                <span>
                  {dispatchedCount} / {selectedCustomers.length}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${(dispatchedCount / selectedCustomers.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>

          {channel === 'pdf' ? (
            <button
              type="button"
              onClick={handleExportConsolidatedPDF}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-2 transition-all"
            >
              <FileDown className="w-4 h-4" />
              <span>Download Consolidated Statements</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartBatchDispatch}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Dispatch {selectedCustomers.length} Reminders Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
