/**
 * Native WhatsApp Business API & Interactive Payment Collection Engine
 * Dispatches structured WhatsApp templates with interactive quick-reply buttons and simulates delivery & webhook callbacks.
 */

import { WhatsAppBusinessMessage } from '../types.ts';

export const WHATSAPP_TEMPLATES = [
  {
    id: 'tpl_payment_reminder_v1',
    name: 'Smart Payment Request with 1-Click Pay',
    category: 'PAYMENT_COLLECTION',
    bodyText: 'Hello {{1}}, you have a pending Khata balance of {{2}} at {{3}} for Bill #{{4}}. Please settle using the secure payment buttons below:',
    buttons: [
      { type: 'URL', title: '💳 Pay Online (UPI/Card)', payloadOrUrl: '{{PAY_URL}}' },
      { type: 'QUICK_REPLY', title: '⏳ Remind Me Tomorrow', payloadOrUrl: 'SNOOZE_24H' },
      { type: 'QUICK_REPLY', title: '📄 Send Full Ledger PDF', payloadOrUrl: 'REQUEST_PDF' },
    ],
  },
  {
    id: 'tpl_invoice_receipt_v1',
    name: 'Instant POS Bill & Tax Invoice',
    category: 'TRANSACTION_RECEIPT',
    bodyText: 'Thank you for your purchase at {{3}}! Your receipt #{{4}} for amount {{2}} is confirmed. View or download your invoice anytime:',
    buttons: [
      { type: 'URL', title: '🧾 View E-Invoice', payloadOrUrl: '{{PAY_URL}}' },
      { type: 'QUICK_REPLY', title: '⭐ Rate Our Service', payloadOrUrl: 'FEEDBACK_5' },
    ],
  },
  {
    id: 'tpl_overdue_notice_v1',
    name: 'Overdue Credit Limit Alert',
    category: 'CREDIT_CONTROL',
    bodyText: 'Important notice: Your credit limit at {{3}} is currently utilized past 90% (Outstanding: {{2}}). Kindly clear this balance to continue ordering.',
    buttons: [
      { type: 'URL', title: '⚡ Pay Now to Restore Credit', payloadOrUrl: '{{PAY_URL}}' },
      { type: 'QUICK_REPLY', title: '📞 Speak to Manager', payloadOrUrl: 'REQUEST_CALLBACK' },
    ],
  },
];

export function buildWhatsAppMessage(params: {
  recipientPhone: string;
  recipientName: string;
  templateType: 'payment_request' | 'invoice_receipt' | 'overdue_alert' | 'khata_statement';
  amount: number;
  currency: string;
  shopName: string;
  invoiceNumber: string;
  payLinkUrl?: string;
}): WhatsAppBusinessMessage {
  const payUrl = params.payLinkUrl || `https://pay.b2b-erp.app/inv/${params.invoiceNumber || 'INV-001'}`;

  let headerText = '🔔 Payment Request from ' + params.shopName;
  let bodyText = `Dear ${params.recipientName}, your outstanding khata balance of ${params.currency} ${params.amount.toLocaleString()} is due. Please tap below to pay securely.`;

  if (params.templateType === 'invoice_receipt') {
    headerText = '🧾 Receipt #' + params.invoiceNumber;
    bodyText = `Thank you for shopping at ${params.shopName}! We received payment of ${params.currency} ${params.amount.toLocaleString()} for bill #${params.invoiceNumber}.`;
  } else if (params.templateType === 'overdue_alert') {
    headerText = '⚠️ Credit Limit Alert';
    bodyText = `Attention ${params.recipientName}: Your credit account at ${params.shopName} has reached ${params.currency} ${params.amount.toLocaleString()}. Kindly settle now.`;
  }

  return {
    id: `wamid_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    templateType: params.templateType,
    headerText,
    bodyText,
    amount: params.amount,
    currency: params.currency,
    invoiceNumber: params.invoiceNumber,
    paymentLinkUrl: payUrl,
    interactiveButtons: [
      { type: 'URL', title: '💳 1-Click Pay Link', payloadOrUrl: payUrl },
      { type: 'QUICK_REPLY', title: '📄 Send Full Statement', payloadOrUrl: 'ACTION_SEND_STATEMENT' },
      { type: 'QUICK_REPLY', title: '📞 Call Store', payloadOrUrl: 'ACTION_CALL_STORE' },
    ],
    status: 'queued',
    sentTimestamp: Date.now(),
  };
}

export function openNativeWhatsAppUrl(phone: string, text: string): void {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
  window.open(url, '_blank');
}
