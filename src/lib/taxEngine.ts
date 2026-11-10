import { CustomerTransaction, PurchaseOrder, TaxAuditSummary } from '../types.ts';

export function calculateTaxAuditSummary(
  taxRegime: 'GST' | 'VAT' | 'SALES_TAX',
  transactions: CustomerTransaction[],
  purchaseOrders: PurchaseOrder[],
  defaultTaxRate: number = 18
): TaxAuditSummary {
  // Sales (Output Tax)
  const salesTxs = transactions.filter((t) => t.type === 'gave');
  const grossSalesTurnover = salesTxs.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Compute Taxable & Tax (Assuming inclusive or standard rate)
  const taxMultiplier = defaultTaxRate / (100 + defaultTaxRate);
  const totalOutputTax = grossSalesTurnover * taxMultiplier;
  const taxableSalesAmount = grossSalesTurnover - totalOutputTax;

  // CGST / SGST (50% each for Intra-state) or IGST (Inter-state)
  const cgstAmount = taxRegime === 'GST' ? totalOutputTax * 0.5 : 0;
  const sgstAmount = taxRegime === 'GST' ? totalOutputTax * 0.5 : 0;
  const igstAmount = taxRegime === 'GST' ? 0 : 0;

  // Purchases (Input Tax Credit / Input VAT)
  const billedPOs = purchaseOrders.filter((po) => po.status === 'received');
  const grossPurchasesCOGS = billedPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
  const totalInputTaxCredit = grossPurchasesCOGS * taxMultiplier;
  const taxablePurchasesAmount = grossPurchasesCOGS - totalInputTaxCredit;

  const netTaxPayable = Math.max(0, totalOutputTax - totalInputTaxCredit);

  return {
    taxRegime,
    period: 'FY 2026-27 (Quarter 1)',
    grossSalesTurnover: Math.round(grossSalesTurnover * 100) / 100,
    taxableSalesAmount: Math.round(taxableSalesAmount * 100) / 100,
    totalOutputTax: Math.round(totalOutputTax * 100) / 100,
    cgstAmount: Math.round(cgstAmount * 100) / 100,
    sgstAmount: Math.round(sgstAmount * 100) / 100,
    igstAmount: Math.round(igstAmount * 100) / 100,
    grossPurchasesCOGS: Math.round(grossPurchasesCOGS * 100) / 100,
    taxablePurchasesAmount: Math.round(taxablePurchasesAmount * 100) / 100,
    totalInputTaxCredit: Math.round(totalInputTaxCredit * 100) / 100,
    netTaxPayable: Math.round(netTaxPayable * 100) / 100,
    exemptTurnover: 0,
    recordsCount: salesTxs.length + billedPOs.length,
  };
}

export function exportTaxAuditCSV(
  taxSummary: TaxAuditSummary,
  transactions: CustomerTransaction[],
  purchaseOrders: PurchaseOrder[]
): string {
  let csv = `B2B SUPPLY TRACKER - OFFICIAL TAX & AUDIT SCHEDULE\n`;
  csv += `Tax Regime: ${taxSummary.taxRegime} | Period: ${taxSummary.period}\n`;
  csv += `Generated On: ${new Date().toISOString()}\n\n`;

  csv += `EXECUTIVE TAX SUMMARY\n`;
  csv += `Gross Sales Turnover,${taxSummary.grossSalesTurnover}\n`;
  csv += `Taxable Sales Value,${taxSummary.taxableSalesAmount}\n`;
  csv += `Total Output Tax Collected,${taxSummary.totalOutputTax}\n`;
  if (taxSummary.taxRegime === 'GST') {
    csv += `Central GST (CGST),${taxSummary.cgstAmount}\n`;
    csv += `State GST (SGST),${taxSummary.sgstAmount}\n`;
  }
  csv += `Gross Eligible Purchases,${taxSummary.grossPurchasesCOGS}\n`;
  csv += `Input Tax Credit (ITC) / Input VAT,${taxSummary.totalInputTaxCredit}\n`;
  csv += `NET TAX LIABILITY PAYABLE,${taxSummary.netTaxPayable}\n\n`;

  csv += `SECTION 1: B2B SALES INVOICE SCHEDULE (OUTPUT TAX)\n`;
  csv += `Date,Customer Name,Bill / Invoice No,Gross Amount,Taxable Value,Tax Rate,Output Tax,Payment Mode\n`;

  const salesTxs = transactions.filter((t) => t.type === 'gave');
  salesTxs.forEach((tx) => {
    const gross = tx.amount || 0;
    const tax = gross * (18 / 118);
    const taxable = gross - tax;
    csv += `"${tx.date}","${tx.customerName || 'Customer'}","${tx.billNumber || 'INV-' + tx.id}",${gross.toFixed(2)},${taxable.toFixed(2)},18%,${tax.toFixed(2)},"${tx.paymentMode || 'Credit'}"\n`;
  });

  csv += `\nSECTION 2: PURCHASE & VENDOR BILL SCHEDULE (INPUT TAX CREDIT)\n`;
  csv += `Date,Vendor / Supplier Name,PO / Bill No,Gross Purchases,Taxable Value,Tax Rate,Input Tax Credit,Status\n`;

  const billedPOs = purchaseOrders.filter((po) => po.status === 'received');
  billedPOs.forEach((po) => {
    const gross = po.totalAmount || 0;
    const tax = gross * (18 / 118);
    const taxable = gross - tax;
    csv += `"${po.issueDate}","${po.supplierName}","${po.poNumber}",${gross.toFixed(2)},${taxable.toFixed(2)},18%,${tax.toFixed(2)},"${po.paymentStatus}"\n`;
  });

  return csv;
}
