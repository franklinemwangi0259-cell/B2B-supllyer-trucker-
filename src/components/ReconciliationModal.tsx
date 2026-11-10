import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Check,
  CheckCheck,
  FileText,
} from 'lucide-react';
import { runAutomatedReconciliation } from '../lib/reconciliation.ts';
import { ReconciliationCandidate } from '../types.ts';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({ isOpen, onClose }) => {
  const { payments, purchaseOrders, customerTransactions, formatMoney, showToast, refreshData } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'matched' | 'suggested' | 'unmatched'>('all');
  const [reconciledIds, setReconciledIds] = useState<Set<string>>(new Set());

  // Run automated matching algorithm
  const candidates = useMemo(() => {
    return runAutomatedReconciliation(payments, purchaseOrders, customerTransactions);
  }, [payments, purchaseOrders, customerTransactions]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((item) => {
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.paymentReference.toLowerCase().includes(query) ||
          item.paymentPartyName.toLowerCase().includes(query) ||
          (item.matchedPONumber && item.matchedPONumber.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [candidates, filterStatus, searchQuery]);

  const matchedCount = candidates.filter((c) => c.status === 'matched' || c.status === 'suggested').length;
  const totalAmountToReconcile = candidates
    .filter((c) => c.status !== 'reconciled' && !reconciledIds.has(c.id))
    .reduce((sum, c) => sum + c.paymentAmount, 0);

  const handleReconcileSingle = (candidate: ReconciliationCandidate) => {
    setReconciledIds((prev) => new Set(prev).add(candidate.id));
    showToast(`Payment ${candidate.paymentReference} reconciled with ${candidate.matchedPONumber}!`, 'success');
  };

  const handleReconcileAllHighConfidence = () => {
    const highConf = candidates.filter((c) => c.confidenceScore >= 80 && !reconciledIds.has(c.id));
    const newSet = new Set(reconciledIds);
    highConf.forEach((c) => newSet.add(c.id));
    setReconciledIds(newSet);
    showToast(`Smart Reconciled ${highConf.length} transactions automatically!`, 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base tracking-tight">Smart Automated Reconciliation</h3>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase rounded">
                  AI Heuristic Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Match incoming payment receipts (REC-8901) with pending vendor bills & invoices (INV-4012)
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

        {/* Action & Metric Ribbon */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending Match Volume</span>
              <span className="text-sm font-black text-slate-900">{formatMoney(totalAmountToReconcile)}</span>
            </div>
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">AI Match Suggestions</span>
              <span className="text-sm font-black text-blue-600">{matchedCount} Eligible Vouchers</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleReconcileAllHighConfidence}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              <span>1-Click Auto-Reconcile ({matchedCount})</span>
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-2 items-center justify-between bg-white">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search receipt ref, invoice number, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            {(['all', 'matched', 'suggested', 'unmatched'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  filterStatus === status
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Reconciliation List */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1 bg-slate-50/50">
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No reconciliation entries found matching current filter.
            </div>
          ) : (
            filteredCandidates.map((item) => {
              const isDone = item.status === 'reconciled' || reconciledIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : item.confidenceScore >= 80
                      ? 'bg-white border-blue-200 shadow-xs hover:border-blue-300'
                      : item.confidenceScore > 0
                      ? 'bg-white border-amber-200 shadow-xs'
                      : 'bg-white border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Payment Receipt Info */}
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : item.confidenceScore >= 80
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-slate-900 font-mono">
                            {item.paymentReference}
                          </span>
                          <span className="text-xs text-slate-500">• {item.paymentDate}</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">{item.paymentPartyName}</p>
                        <span className="text-xs font-black text-slate-900 mt-0.5 block">
                          Amount: {formatMoney(item.paymentAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Middle: AI Match Arrow & Confidence Score */}
                    <div className="flex flex-col items-center justify-center px-4">
                      {item.matchedPONumber ? (
                        <>
                          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 mb-1">
                            <span>Matches Invoice</span>
                            <ArrowRight className="w-4 h-4 text-blue-600" />
                            <span className="font-mono text-blue-700 font-black">{item.matchedPONumber}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.confidenceScore >= 80
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.confidenceScore}% AI Confidence
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] text-center truncate">
                            {item.matchReason}
                          </p>
                        </>
                      ) : (
                        <div className="text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                            No Pending Invoice Match
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-end space-x-2 shrink-0">
                      {isDone ? (
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Reconciled</span>
                        </span>
                      ) : item.matchedPONumber ? (
                        <button
                          type="button"
                          onClick={() => handleReconcileSingle(item)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Match</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => showToast('Manual invoice linking opened', 'info')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                        >
                          Link Manually
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filteredCandidates.length} vouchers • {reconciledIds.size} reconciled in this session
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
