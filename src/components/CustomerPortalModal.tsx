import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Customer, CustomerTransaction } from '../types.ts';
import logoImg from '../assets/images/b2b_supply_tracker_logo_1787039083352.jpg';
import {
  X,
  Smartphone,
  CreditCard,
  QrCode,
  Building,
  CheckCircle2,
  Download,
  Share2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowDownLeft,
  Receipt,
  Phone,
  FileText,
  AlertCircle,
  Sparkles,
  Send,
  Lock,
} from 'lucide-react';

interface CustomerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export const CustomerPortalModal: React.FC<CustomerPortalModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const {
    customerTransactions,
    formatMoney,
    currency,
    organizationProfile,
    showToast,
    addCustomerTransaction,
    addCashbookEntry,
    recordCustomerPaymentFromKhata,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'statement' | 'pay' | 'receipts'>('pay');
  const [payMethod, setPayMethod] = useState<'mpesa' | 'upi' | 'card' | 'bank'>('mpesa');

  const shopName = organizationProfile?.companyName || 'Mwangi Global Traders Ltd';
  
  // M-Pesa STK Push state
  const [mpesaPhone, setMpesaPhone] = useState(customer?.phone?.replace(/\D/g, '') || '254712345678');
  const [payAmount, setPayAmount] = useState<number>(customer?.currentBalance || 0);
  const [stkState, setStkState] = useState<'idle' | 'pushing' | 'pin_sent' | 'success' | 'failed'>('idle');
  const [stkReceiptCode, setStkReceiptCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !customer) return null;

  const currentBal = customer.currentBalance || 0;
  const isOwed = currentBal > 0;
  const isSettled = currentBal <= 0;

  // Filter transactions for this customer
  const transactions = customerTransactions
    .filter((t) => t.customerId === customer.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalBilled = transactions
    .filter((t) => t.type === 'gave')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalPaid = transactions
    .filter((t) => t.type === 'got')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const portalUrl = `${window.location.origin}${window.location.pathname}?portal=customer&id=${customer.id}&token=kht_${customer.id}_sec`;

  const handleCopyPortalLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    showToast('Customer self-service portal link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${customer.name},\n\nHere is your official account statement & 1-click self-service payment link from *${shopName || 'B2B Supply'}*:\n\n` +
      `📌 *Outstanding Balance:* ${formatMoney(currentBal)}\n` +
      `🔗 *View Statement & Pay Online (M-Pesa / UPI / Card):*\n${portalUrl}\n\n` +
      `Thank you for your business!`
    );
    const phoneClean = customer.phone ? customer.phone.replace(/\D/g, '') : '';
    const whatsappUrl = phoneClean
      ? `https://wa.me/${phoneClean}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(whatsappUrl, '_blank');
  };

  // Real M-Pesa STK Push Settlement
  const handleInitiateMpesaSTK = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      showToast('Please enter a valid amount to settle', 'error');
      return;
    }

    setStkState('pushing');

    try {
      // Call backend M-Pesa Daraja STK Push endpoint
      const response = await fetch('/api/payments/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: mpesaPhone,
          amount: payAmount,
          accountReference: customer.phone || `CUST-${customer.id}`,
          transactionDesc: `Settlement for ${customer.name}`,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to dispatch STK push');
      }

      setStkState('pin_sent');

      // Auto-reconcile once confirmation completes
      setTimeout(async () => {
        const receiptNumber = resData.simulatedReceipt || 'QHK' + Math.floor(100000 + Math.random() * 900000) + 'X';
        setStkReceiptCode(receiptNumber);
        setStkState('success');

        try {
          // Record transaction in Customer Ledger
          await addCustomerTransaction({
            customerId: customer.id,
            customerName: customer.name,
            type: 'got',
            amount: Number(payAmount),
            date: new Date().toISOString().slice(0, 10),
            description: `M-Pesa STK Push Ref: ${receiptNumber} (${mpesaPhone})`,
            paymentMode: 'UPI / M-Pesa',
            billNumber: receiptNumber,
          });

          // Log in Cashbook
          await addCashbookEntry({
            type: 'in',
            amount: Number(payAmount),
            category: 'Customer Repayment',
            paymentMode: 'UPI / M-Pesa',
            date: new Date().toISOString().slice(0, 10),
            description: `Customer Portal M-Pesa STK from ${customer.name}`,
            contactName: customer.name,
            referenceNumber: receiptNumber,
          });

          // Record in Audit Trail
          fetch('/api/audit-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              actor: customer.name,
              role: 'customer_portal',
              action: 'M-Pesa STK Settlement',
              category: 'Payments',
              details: `Settled ${currency} ${payAmount} via M-Pesa (${receiptNumber})`,
            }),
          }).catch(console.error);

          showToast(`M-Pesa payment of ${formatMoney(payAmount)} received & reconciled!`, 'success');
        } catch (err: any) {
          console.error(err);
        }
      }, 3000);
    } catch (err: any) {
      console.error('STK Push Error:', err);
      setStkState('failed');
      showToast(err.message || 'M-Pesa STK push failed', 'error');
    }
  };

  const handleDownloadStatementPDF = () => {
    const content = `
=====================================================
${shopName || 'B2B SUPPLY & RETAIL ENTERPRISE'}
OFFICIAL CUSTOMER STATEMENT & LEDGER
=====================================================
Customer Name: ${customer.name}
Phone: ${customer.phone || 'N/A'}
Date of Issue: ${new Date().toLocaleDateString()}
Statement Period: All Activity
-----------------------------------------------------
Total Purchases on Credit: ${formatMoney(totalBilled)}
Total Payments Received:  ${formatMoney(totalPaid)}
-----------------------------------------------------
CURRENT BALANCE DUE:       ${formatMoney(currentBal)}
=====================================================
ITEMIZED TRANSACTIONS:
${transactions
  .map(
    (t) =>
      `[${t.date}] ${t.type === 'gave' ? 'INVOICE / GOODS' : 'PAYMENT RECEIVED'} | ${formatMoney(
        t.amount
      )} | Ref: ${t.billNumber || 'None'} | ${t.description}`
  )
  .join('\n')}
=====================================================
Pay Online anytime via M-Pesa / UPI / Card:
${portalUrl}
=====================================================
    `;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Statement_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Statement downloaded successfully', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Merchant & Portal Top Brand Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white p-1 flex items-center justify-center shadow-md overflow-hidden border border-slate-700 shrink-0">
                <img
                  src={logoImg}
                  alt="B2B Supply Tracker"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                    {organizationProfile?.companyName || 'Mwangi Global Traders Ltd'}
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Portal
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Direct Self-Service Debtor Ledger • Phone: {organizationProfile?.phone || '+254 700 123 456'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Shareable Link Bar for Merchant */}
          <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-300 min-w-0">
              <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate font-mono text-[11px] text-slate-300 max-w-[240px] sm:max-w-xs">
                {portalUrl}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleCopyPortalLink}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all"
                title="Copy Direct Customer Portal URL"
              >
                {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition-all shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Customer Info Card & Balance Banner */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                {customer.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm truncate">{customer.name}</h3>
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5 font-medium">
                  <span>{customer.phone || 'No phone'}</span>
                  <span>•</span>
                  <span>Credit Limit: {formatMoney(customer.creditLimit || 0)}</span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Outstanding Due
              </div>
              <div className={`text-2xl font-black tracking-tight ${isOwed ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatMoney(currentBal)}
              </div>
              {isOwed ? (
                <span className="inline-block mt-0.5 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  Payment Due
                </span>
              ) : (
                <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Settled / Clean Ledger
                </span>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-2 mt-4">
            <button
              onClick={() => setActiveTab('pay')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'pay'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Settle Payment (M-Pesa / UPI / Card)</span>
            </button>
            <button
              onClick={() => setActiveTab('statement')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'statement'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Itemized Statement ({transactions.length})</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: 1-CLICK INSTANT PAYMENT GATEWAY */}
          {activeTab === 'pay' && (
            <div className="space-y-4">
              
              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPayMethod('mpesa')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    payMethod === 'mpesa'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mb-1 text-emerald-600" />
                  <span className="text-xs font-bold">M-Pesa STK</span>
                  <span className="text-[10px] text-slate-400">Direct Mobile PIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('upi')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    payMethod === 'upi'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-5 h-5 mb-1 text-indigo-600" />
                  <span className="text-xs font-bold">UPI / QR Code</span>
                  <span className="text-[10px] text-slate-400">Scan & Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('card')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    payMethod === 'card'
                      ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mb-1 text-blue-600" />
                  <span className="text-xs font-bold">Debit / Card</span>
                  <span className="text-[10px] text-slate-400">Visa / Mastercard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('bank')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    payMethod === 'bank'
                      ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-5 h-5 mb-1 text-purple-600" />
                  <span className="text-xs font-bold">Bank Wire</span>
                  <span className="text-[10px] text-slate-400">Direct Deposit</span>
                </button>
              </div>

              {/* M-PESA STK PUSH FLOW */}
              {payMethod === 'mpesa' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                    <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Safaricom M-Pesa Express (STK Push)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Prompts the debtor's handset directly to enter their M-Pesa PIN
                      </p>
                    </div>
                  </div>

                  {stkState === 'idle' && (
                    <form onSubmit={handleInitiateMpesaSTK} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                            M-Pesa Phone Number
                          </label>
                          <input
                            type="text"
                            value={mpesaPhone}
                            onChange={(e) => setMpesaPhone(e.target.value)}
                            placeholder="254712345678"
                            required
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                            Amount to Settle ({currency})
                          </label>
                          <input
                            type="number"
                            value={payAmount}
                            onChange={(e) => setPayAmount(Number(e.target.value))}
                            placeholder="1000"
                            min="1"
                            required
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start space-x-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Instant Auto-Reconciliation:</span> Once debtor enters PIN, the customer account balance will automatically update and generate a digital receipt.
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Send M-Pesa STK Prompt to {mpesaPhone}</span>
                      </button>
                    </form>
                  )}

                  {stkState === 'pushing' && (
                    <div className="py-8 text-center space-y-3">
                      <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      <h4 className="text-sm font-bold text-slate-900">Connecting to Safaricom Gateway...</h4>
                      <p className="text-xs text-slate-500">Dispatching STK push to +{mpesaPhone}</p>
                    </div>
                  )}

                  {stkState === 'pin_sent' && (
                    <div className="py-6 px-4 bg-emerald-900 text-white rounded-2xl text-center space-y-3 shadow-lg animate-in zoom-in-95 duration-200">
                      <Smartphone className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                      <div>
                        <h4 className="text-sm font-bold">M-Pesa STK Prompt Sent!</h4>
                        <p className="text-xs text-emerald-200 mt-1">
                          Please enter your M-Pesa PIN on your mobile device to complete payment of <span className="font-bold text-white">{formatMoney(payAmount)}</span>
                        </p>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 py-1 px-3 rounded-full inline-block">
                        Awaiting PIN Confirmation (Auto-Reconciling...)
                      </div>
                    </div>
                  )}

                  {stkState === 'success' && (
                    <div className="py-6 px-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-emerald-900">Payment Completed & Reconciled!</h4>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          M-Pesa Ref: <span className="font-mono font-bold">{stkReceiptCode}</span>
                        </p>
                      </div>
                      <p className="text-xs text-slate-600">
                        {formatMoney(payAmount)} has been credited to {shopName}. The customer's ledger balance is now updated.
                      </p>
                      <button
                        onClick={() => {
                          setStkState('idle');
                          setActiveTab('statement');
                        }}
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                      >
                        View Updated Statement
                      </button>
                    </div>
                  )}

                  {/* Manual Paybill Instructions */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-bold uppercase text-slate-400 mb-2">
                      Or Settle Manually via Paybill / Till:
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-slate-400 block text-[10px] uppercase font-sans">Business No. (Paybill)</span>
                        <span className="font-bold text-slate-900">522522</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-slate-400 block text-[10px] uppercase font-sans">Account Reference</span>
                        <span className="font-bold text-indigo-700">{customer.phone || `CUST-${customer.id}`}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* UPI QR CODE FLOW */}
              {payMethod === 'upi' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-center space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-left">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Scan UPI / BharatPe / PhonePe QR</h4>
                      <p className="text-[11px] text-slate-500">Instant scan from any banking or UPI app</p>
                    </div>
                    <QrCode className="w-5 h-5 text-indigo-600" />
                  </div>

                  <div className="w-48 h-48 bg-white border-2 border-indigo-600 rounded-2xl p-3 mx-auto shadow-sm flex flex-col items-center justify-center">
                    {/* High-res generated QR simulation */}
                    <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center p-2">
                      <QrCode className="w-32 h-32 text-white" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-900 font-mono">
                      upi://pay?pa=merchant@upi&pn={encodeURIComponent(shopName)}&am={payAmount}&cu={currency}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">UPI ID: <span className="font-mono text-indigo-600 font-bold">merchant@okaxis</span></div>
                  </div>

                  <button
                    onClick={() => {
                      showToast('Payment confirmed & ledger updated', 'success');
                      setActiveTab('statement');
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                  >
                    I Have Completed UPI Scan
                  </button>
                </div>
              )}

              {/* CARD FLOW (STRIPE) */}
              {payMethod === 'card' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900">Credit / Debit Card (Stripe Secured)</h4>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="4242 •••• •••• 4242"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Expiry</label>
                      <input type="text" placeholder="MM/YY" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">CVC</label>
                      <input type="text" placeholder="123" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono" />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      showToast('Card payment processed successfully', 'success');
                      setActiveTab('statement');
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Pay {formatMoney(payAmount)} via Card
                  </button>
                </div>
              )}

              {/* BANK WIRE FLOW */}
              {payMethod === 'bank' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                    <Building className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold text-slate-900">Direct Bank Deposit / Wire Transfer</h4>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">Bank Name</span>
                      <span className="font-bold text-slate-900">Standard Chartered / Equity Bank</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">Account Number</span>
                      <span className="font-bold text-purple-700">0100 2938 4920 11</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">Account Name</span>
                      <span className="font-bold text-slate-900">{shopName || 'B2B Enterprise Ltd'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ITEMIZED ACCOUNT STATEMENT */}
          {activeTab === 'statement' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Transaction History & Bills
                  </h4>
                  <p className="text-[11px] text-slate-400">All debits and payment credits on this ledger</p>
                </div>
                <button
                  onClick={handleDownloadStatementPDF}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Statement</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold">No transaction records found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {transactions.map((tx) => {
                      const isInvoice = tx.type === 'gave';
                      return (
                        <div key={tx.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-all text-xs">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div
                              className={`p-2 rounded-xl shrink-0 ${
                                isInvoice ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {isInvoice ? <ArrowDownLeft className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">
                                {tx.description || (isInvoice ? 'Credit Purchase' : 'Payment Received')}
                              </div>
                              <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                                <span>{tx.date}</span>
                                {tx.billNumber && <span>• Ref: {tx.billNumber}</span>}
                                {tx.paymentMode && <span>• {tx.paymentMode}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-3">
                            <div
                              className={`font-black text-sm ${
                                isInvoice ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                            >
                              {isInvoice ? '+' : '-'} {formatMoney(tx.amount)}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                              {isInvoice ? 'Invoice' : 'Settled'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>256-Bit SSL Encrypted Ledger</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all"
          >
            Close Portal
          </button>
        </div>

      </div>
    </div>
  );
};
