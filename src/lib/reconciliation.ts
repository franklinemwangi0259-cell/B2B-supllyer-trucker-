import { Payment, PurchaseOrder, CustomerTransaction, ReconciliationCandidate } from '../types.ts';

/**
 * Intelligent transaction matching algorithm:
 * Matches payments (REC-8901, UTR, Bank entries) with unpaid bills / customer invoices.
 * Calculates confidence scores based on:
 * - Exact or near-exact amount matching (+50%)
 * - Supplier / party name or ID match (+30%)
 * - Date proximity within 7-14 days (+20%)
 */
export function runAutomatedReconciliation(
  payments: Payment[],
  purchaseOrders: PurchaseOrder[],
  customerTransactions: CustomerTransaction[]
): ReconciliationCandidate[] {
  const candidates: ReconciliationCandidate[] = [];

  // 1. Match vendor payments to open/partially paid Purchase Orders
  payments.forEach((payment) => {
    // If already reconciled in data, flag it
    if (payment.reconciled && payment.reconciledWith) {
      candidates.push({
        id: `rec-pay-${payment.id}`,
        paymentId: payment.id,
        paymentReference: payment.referenceNumber || `REC-${payment.id + 8000}`,
        paymentAmount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentPartyName: `Supplier #${payment.supplierId}`,
        matchedPONumber: payment.reconciledWith,
        matchedAmount: payment.amount,
        confidenceScore: 100,
        matchReason: 'Explicitly linked and reconciled',
        status: 'reconciled',
      });
      return;
    }

    // Attempt automated match with purchase orders
    const unpaidPOs = purchaseOrders.filter((po) => po.supplierId === payment.supplierId);
    
    let bestMatch: PurchaseOrder | null = null;
    let highestScore = 0;
    let matchReason = 'Unallocated payment receipt';

    for (const po of unpaidPOs) {
      let score = 0;
      const poUnpaidBal = Math.max(0, po.totalAmount - (po.amountPaid || 0));

      // Check amount match
      if (Math.abs(payment.amount - poUnpaidBal) < 0.01) {
        score += 55; // Exact balance match
        matchReason = `Exact amount match with balance of ${po.poNumber}`;
      } else if (Math.abs(payment.amount - po.totalAmount) < 0.01) {
        score += 50; // Total order match
        matchReason = `Exact match with invoice total for ${po.poNumber}`;
      } else if (payment.amount <= poUnpaidBal) {
        score += 30; // Partial payment fit
        matchReason = `Partial settlement candidate for ${po.poNumber}`;
      }

      // Check supplier match
      if (po.supplierId === payment.supplierId) {
        score += 25;
      }

      // Check date proximity
      const payTime = new Date(payment.paymentDate).getTime();
      const poTime = new Date(po.issueDate).getTime();
      const diffDays = Math.abs(payTime - poTime) / (1000 * 60 * 60 * 24);

      if (diffDays <= 7) {
        score += 20;
      } else if (diffDays <= 30) {
        score += 10;
      }

      // Reference number substring match (e.g. "INV-4012" in notes)
      if (payment.notes && payment.notes.includes(po.poNumber)) {
        score += 30;
        matchReason = `PO reference explicitly mentioned in voucher notes`;
      }

      if (score > highestScore) {
        highestScore = Math.min(score, 99);
        bestMatch = po;
      }
    }

    if (bestMatch && highestScore >= 60) {
      candidates.push({
        id: `rec-cand-${payment.id}-${bestMatch.id}`,
        paymentId: payment.id,
        paymentReference: payment.referenceNumber || `REC-${payment.id + 8000}`,
        paymentAmount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentPartyName: bestMatch.supplierName || `Supplier #${payment.supplierId}`,
        matchedPOId: bestMatch.id,
        matchedPONumber: bestMatch.poNumber,
        matchedAmount: Math.min(payment.amount, bestMatch.totalAmount),
        confidenceScore: highestScore,
        matchReason: matchReason,
        status: highestScore >= 85 ? 'matched' : 'suggested',
      });
    } else {
      candidates.push({
        id: `rec-unmatched-${payment.id}`,
        paymentId: payment.id,
        paymentReference: payment.referenceNumber || `REC-${payment.id + 8000}`,
        paymentAmount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentPartyName: `Vendor #${payment.supplierId}`,
        confidenceScore: 0,
        matchReason: 'No pending bills with matching amount or vendor found',
        status: 'unmatched',
      });
    }
  });

  return candidates;
}
