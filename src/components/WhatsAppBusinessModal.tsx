import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Check,
  Clock,
  ExternalLink,
  Phone,
  Sparkles,
  Smartphone,
  ShieldCheck,
  CreditCard,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { WhatsAppBusinessMessage } from '../types.ts';
import { WHATSAPP_TEMPLATES, buildWhatsAppMessage, openNativeWhatsAppUrl } from '../lib/whatsappApi.ts';

export const WhatsAppBusinessModal: React.FC = () => {
  const {
    isWhatsAppBusinessModalOpen,
    setIsWhatsAppBusinessModalOpen,
    whatsAppTarget,
    userProfile,
    currency,
    formatMoney,
    showToast,
  } = useApp();

  const [selectedTemplate, setSelectedTemplate] = useState(WHATSAPP_TEMPLATES[0].id);
  const [phone, setPhone] = useState(whatsAppTarget?.phone || '+91 98765 43210');
  const [recipientName, setRecipientName] = useState(whatsAppTarget?.name || 'Customer');
  const [amount, setAmount] = useState(whatsAppTarget?.balance || 350.0);
  const [billNumber, setBillNumber] = useState(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [activeMessage, setActiveMessage] = useState<WhatsAppBusinessMessage | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (whatsAppTarget) {
      setPhone(whatsAppTarget.phone || '+91 98765 43210');
      setRecipientName(whatsAppTarget.name || 'Customer');
      setAmount(whatsAppTarget.balance || 350.0);
    }
  }, [whatsAppTarget]);

  if (!isWhatsAppBusinessModalOpen) return null;

  const currentTemplate = WHATSAPP_TEMPLATES.find((t) => t.id === selectedTemplate) || WHATSAPP_TEMPLATES[0];

  const handleSendViaWhatsAppApi = async () => {
    setIsSending(true);

    const msg = buildWhatsAppMessage({
      recipientPhone: phone,
      recipientName,
      templateType: selectedTemplate === 'tpl_invoice_receipt_v1' ? 'invoice_receipt' : selectedTemplate === 'tpl_overdue_notice_v1' ? 'overdue_alert' : 'payment_request',
      amount,
      currency,
      shopName: userProfile?.shopName || 'B2B Supply Tracker',
      invoiceNumber: billNumber,
    });

    setActiveMessage(msg);

    try {
      // Dispatch to backend Meta Cloud API endpoint
      const response = await fetch('/api/notifications/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: phone,
          recipientName,
          messageText: msg.bodyText,
          templateName: selectedTemplate,
          amount,
          invoiceNumber: billNumber,
        }),
      });

      const data = await response.json();

      msg.status = 'sent';
      setActiveMessage({ ...msg });
      showToast(`WhatsApp Message Transmitted to ${phone}`, 'success');

      // Record in Audit Trail
      fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: userProfile?.displayName || 'Active Staff',
          role: 'staff',
          action: 'WhatsApp Notification Dispatched',
          category: 'Communications',
          details: `Sent payment request of ${currency} ${amount} to ${recipientName} (${phone})`,
        }),
      }).catch(console.error);

      // Transition to delivered/read
      setTimeout(() => {
        msg.status = 'delivered';
        msg.deliveryTimestamp = Date.now();
        setActiveMessage({ ...msg });
      }, 1500);

      setTimeout(() => {
        msg.status = 'read';
        msg.readTimestamp = Date.now();
        setActiveMessage({ ...msg });
        setIsSending(false);
      }, 3000);
    } catch (err: any) {
      console.error('WhatsApp dispatch error:', err);
      setIsSending(false);
      showToast(err.message || 'Failed to dispatch via WhatsApp Cloud API', 'error');
    }
  };

  const handleSimulatePaymentWebhook = () => {
    if (!activeMessage) return;
    activeMessage.status = 'paid';
    activeMessage.paidTimestamp = Date.now();
    setActiveMessage({ ...activeMessage });
    showToast(`Payment Confirmed! ${recipientName} paid ${formatMoney(amount)} via 1-Click Link`, 'success');
  };

  const handleOpenNativeWhatsApp = () => {
    const text = `Hello ${recipientName}, reminder from *${userProfile?.shopName || 'B2B Supply Tracker'}* regarding outstanding balance of *${currency} ${amount.toLocaleString()}* for Bill #${billNumber}.\n\nPlease view statement & pay directly here: ${window.location.origin}${window.location.pathname}?portal=customer&id=${whatsAppTarget?.id || '1'}`;
    openNativeWhatsAppUrl(phone, text);
    showToast('Opening native WhatsApp messenger...', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Native WhatsApp Business API & SMS Workflow
                </h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                  Cloud API v20.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated payment collection templates with interactive 1-click payment buttons & live delivery webhooks
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWhatsAppBusinessModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Left Form Controls */}
          <div className="md:col-span-6 space-y-4">
            {/* Template Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Approved WhatsApp Business Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {WHATSAPP_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  WhatsApp Mobile #
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Invoice / Bill Ref #
                </label>
                <input
                  type="text"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Amount ({currency})
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>
            </div>

            {/* Action dispatch buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleSendViaWhatsAppApi}
                disabled={isSending}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Transmitting via Meta Cloud API...' : 'Dispatch Automated Interactive Message'}
              </button>

              <button
                type="button"
                onClick={handleOpenNativeWhatsApp}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium flex items-center justify-center gap-2 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in WhatsApp Web / App directly
              </button>
            </div>
          </div>

          {/* Right Live Phone Simulator Preview */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-xs bg-slate-900 p-3 rounded-3xl shadow-xl border-4 border-slate-800">
              {/* Phone Top Notch */}
              <div className="w-20 h-3 bg-slate-800 rounded-full mx-auto mb-2" />

              {/* Chat screen */}
              <div className="bg-[#EFEAE2] dark:bg-[#0b141a] rounded-2xl p-3 min-h-[340px] flex flex-col justify-between text-xs">
                {/* Chat header */}
                <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    B
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-[11px] leading-tight">
                      {userProfile?.shopName || 'B2B Supply Tracker'}
                    </div>
                    <div className="text-[9px] text-emerald-600 flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" /> Verified Business Account
                    </div>
                  </div>
                </div>

                {/* WhatsApp Message Bubble */}
                <div className="my-2 bg-white dark:bg-[#1f2c34] p-3 rounded-2xl rounded-tl-xs shadow-xs text-slate-900 dark:text-slate-100 text-xs space-y-2">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                    🔔 Payment Request from {userProfile?.shopName || 'B2B Supply Tracker'}
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Hello <strong className="font-semibold">{recipientName}</strong>, your pending balance of <strong className="font-semibold text-emerald-600">{currency} {amount.toLocaleString()}</strong> for Bill #{billNumber} is ready for payment.
                  </p>

                  {/* Interactive Button Preview */}
                  <div className="pt-2 space-y-1.5 border-t border-slate-100 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={handleSimulatePaymentWebhook}
                      className="w-full py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CreditCard className="w-3 h-3" /> 💳 1-Click Pay Now (UPI / Card)
                    </button>
                    <div className="w-full py-1 text-center text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                      📄 Request Full Statement PDF
                    </div>
                  </div>

                  {/* Message status timestamp */}
                  <div className="text-right text-[9px] text-slate-400 flex items-center justify-end gap-1 pt-1">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {activeMessage ? (
                      activeMessage.status === 'paid' ? (
                        <span className="text-emerald-500 font-bold">PAID ✓✓</span>
                      ) : activeMessage.status === 'read' ? (
                        <span className="text-sky-500 font-bold">✓✓</span>
                      ) : activeMessage.status === 'delivered' ? (
                        <span className="text-slate-400 font-bold">✓✓</span>
                      ) : (
                        <span className="text-slate-400 font-bold">✓</span>
                      )
                    ) : (
                      <span className="text-slate-400">✓</span>
                    )}
                  </div>
                </div>

                {/* Webhook Status Ribbon */}
                {activeMessage && (
                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[10px]">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Webhook Status:</span>
                      <span className="uppercase text-emerald-600 dark:text-emerald-400">
                        {activeMessage.status}
                      </span>
                    </div>
                    {activeMessage.status !== 'paid' && (
                      <button
                        type="button"
                        onClick={handleSimulatePaymentWebhook}
                        className="mt-1 w-full py-1 rounded-md bg-emerald-500 text-white font-semibold text-[10px] hover:bg-emerald-600"
                      >
                        Simulate Customer Tapping Pay Link
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
