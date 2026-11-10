import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  X,
  Send,
  MessageCircle,
  Mail,
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  CreditCard,
} from 'lucide-react';
import { PaymentGatewayProvider } from '../types.ts';

interface AutomatedReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetParty?: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    balance: number;
    type: 'customer' | 'supplier';
  } | null;
}

export const AutomatedReminderModal: React.FC<AutomatedReminderModalProps> = ({
  isOpen,
  onClose,
  targetParty,
}) => {
  const { formatMoney, showToast, userProfile, currency } = useApp();

  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayProvider>('razorpay');
  const [copied, setCopied] = useState(false);
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen || !targetParty) return null;

  const dueAmount = Math.abs(targetParty.balance);
  const invoiceRef = `INV-${targetParty.id.toString().slice(-4)}-${new Date().getMonth() + 1}${new Date().getDate()}`;
  const shopName = userProfile?.shopName || 'B2B Supply Tracker Merchant';

  // Dynamic hosted payment link
  const paymentLinkUrl = `https://pay.b2bsupply.io/pay/${invoiceRef.toLowerCase()}?amt=${dueAmount}&cur=${currency}&gw=${selectedGateway}`;

  const messageTemplates = {
    whatsapp: `*PAYMENT REMINDER - ${shopName}*\n\nHello *${targetParty.name}*,\nThis is a gentle reminder that your pending balance of *${formatMoney(dueAmount)}* is due.\n\n*Invoice Ref:* ${invoiceRef}\n*Direct Secure Payment Link:* ${paymentLinkUrl}\n\nPay via ${selectedGateway.toUpperCase()} (UPI, Card, NetBanking, M-Pesa). Thank you for your business!`,
    sms: `${shopName}: Dear ${targetParty.name}, balance of ${formatMoney(dueAmount)} is due. Pay online now at: ${paymentLinkUrl}`,
    email: `Dear ${targetParty.name},\n\nPlease find your payment reminder of ${formatMoney(dueAmount)} for statement ${invoiceRef}.\n\nYou can settle this balance instantly using our secure payment portal:\n${paymentLinkUrl}\n\nBest Regards,\n${shopName}`,
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLinkUrl);
    setCopied(true);
    showToast('Payment link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDispatch = () => {
    setIsSending(true);

    if (activeChannel === 'whatsapp') {
      const cleanPhone = (targetParty.phone || '').replace(/[^0-9]/g, '');
      const encoded = encodeURIComponent(messageTemplates.whatsapp);
      const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
      window.open(url, '_blank');
      showToast(`Automated WhatsApp Payment Link dispatched to ${targetParty.name}!`, 'success');
    } else if (activeChannel === 'sms') {
      const cleanPhone = (targetParty.phone || '').replace(/[^0-9]/g, '');
      const encoded = encodeURIComponent(messageTemplates.sms);
      window.open(`sms:${cleanPhone}?body=${encoded}`, '_blank');
      showToast(`Automated SMS template dispatched!`, 'success');
    } else if (activeChannel === 'email') {
      const subject = encodeURIComponent(`Payment Due Statement - ${shopName} [${invoiceRef}]`);
      const body = encodeURIComponent(messageTemplates.email);
      window.open(`mailto:${targetParty.email || ''}?subject=${subject}&body=${body}`, '_blank');
      showToast(`Automated Email statement prepared!`, 'success');
    }

    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">One-Click Automated Payment Link</h3>
              <p className="text-xs text-blue-200">Dispatch instant payment checkout via WhatsApp, SMS, or Email</p>
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
          {/* Target Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recipient Account</p>
              <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{targetParty.name}</h4>
              <p className="text-xs text-slate-600 mt-0.5">{targetParty.phone || targetParty.email || 'Direct contact'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Due</p>
              <h4 className="text-xl font-black text-rose-600 mt-0.5">{formatMoney(dueAmount)}</h4>
              <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full mt-1">
                Ref: {invoiceRef}
              </span>
            </div>
          </div>

          {/* Gateway Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Automated Payment Gateway
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'razorpay', label: 'Razorpay / UPI', badge: 'Instant' },
                { id: 'stripe', label: 'Stripe Global', badge: 'Cards/ACH' },
                { id: 'mpesa', label: 'M-Pesa STK', badge: 'Mobile Money' },
              ].map((gw) => (
                <button
                  key={gw.id}
                  type="button"
                  onClick={() => setSelectedGateway(gw.id as PaymentGatewayProvider)}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    selectedGateway === gw.id
                      ? 'border-blue-600 bg-blue-50/70 shadow-2xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <CreditCard className={`w-4 h-4 ${selectedGateway === gw.id ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                      {gw.badge}
                    </span>
                  </div>
                  <span className="block font-bold text-xs text-slate-900">{gw.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generated Payment Link with Copy & QR */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Hosted Payment Link (Self-Reconciling)
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 truncate select-all">
                {paymentLinkUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Dispatch Channel Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Choose Dispatch Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveChannel('whatsapp')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-bold transition-all ${
                  activeChannel === 'whatsapp'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveChannel('sms')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-bold transition-all ${
                  activeChannel === 'sms'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Direct SMS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveChannel('email')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-bold transition-all ${
                  activeChannel === 'email'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Mail className="w-4 h-4 text-indigo-600" />
                <span>Email PDF</span>
              </button>
            </div>
          </div>

          {/* Message Preview Box */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto border border-slate-800">
            {messageTemplates[activeChannel]}
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Incoming payments through this link automatically mark the invoice as reconciled.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDispatch}
            disabled={isSending || sentSuccess}
            className={`px-5 py-2.5 rounded-xl font-black text-xs text-white shadow-md flex items-center space-x-2 transition-all ${
              activeChannel === 'whatsapp'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : activeChannel === 'sms'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {sentSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Dispatched!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Automated Reminder Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
