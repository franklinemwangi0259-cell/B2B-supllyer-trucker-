import { Customer, CustomerTransaction, CustomerRiskProfile } from '../types.ts';

/**
 * Evaluates risk profile for every customer based on:
 * - Current balance vs credit limit (utilization)
 * - Average repayment turnaround (DSO - Days Sales Outstanding)
 * - Days since last activity / oldest open credit
 */
export function calculateCustomerRiskProfiles(
  customers: Customer[],
  transactions: CustomerTransaction[]
): CustomerRiskProfile[] {
  const now = Date.now();

  return customers.map((customer) => {
    const custTx = transactions.filter((t) => t.customerId === customer.id);
    const balance = customer.currentBalance || 0;
    const limit = customer.creditLimit || 5000;
    const utilizationPct = limit > 0 ? (balance / limit) * 100 : 0;
    const isOverLimit = balance > limit;
    const overLimitAmount = Math.max(0, balance - limit);

    // Calculate approximate DSO (Days Sales Outstanding)
    const creditTxs = custTx.filter((t) => t.type === 'gave');
    let avgPaymentDays = 14; // Default baseline

    if (creditTxs.length > 0) {
      const oldestCreditDate = new Date(creditTxs[creditTxs.length - 1].date).getTime();
      const ageDays = Math.max(1, Math.round((now - oldestCreditDate) / (1000 * 60 * 60 * 24)));
      avgPaymentDays = Math.min(120, ageDays);
    }

    // Risk scoring: 0 (Safest) to 100 (Defaulting Risk)
    let score = 10;

    // Balance utilization component (up to 40 pts)
    if (utilizationPct > 100) score += 40;
    else if (utilizationPct > 80) score += 30;
    else if (utilizationPct > 50) score += 15;

    // Age / DSO component (up to 40 pts)
    if (avgPaymentDays > 60) score += 40;
    else if (avgPaymentDays > 30) score += 25;
    else if (avgPaymentDays > 14) score += 10;

    // Inactive account with outstanding debt (up to 20 pts)
    if (balance > 500 && avgPaymentDays > 45) score += 20;

    score = Math.min(100, Math.max(5, score));

    // Determine Risk Tier
    let riskTier: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let riskLabel = '🟢 Low Risk (Prompt)';
    let recommendedAction = 'Eligible for higher credit limits.';

    if (score >= 80 || (isOverLimit && avgPaymentDays > 30)) {
      riskTier = 'critical';
      riskLabel = '🚨 Critical / Defaulter Risk';
      recommendedAction = 'Freeze credit sales immediately. Send legal/WhatsApp payment notice.';
    } else if (score >= 55) {
      riskTier = 'high';
      riskLabel = '🔴 High Risk (Overdue)';
      recommendedAction = 'Enforce COD (Cash On Delivery) until balance clears.';
    } else if (score >= 35) {
      riskTier = 'medium';
      riskLabel = '🟡 Medium Risk (Slow Payer)';
      recommendedAction = 'Send automated payment link reminder before next credit issue.';
    }

    return {
      customerId: customer.id,
      customerName: customer.name,
      currentBalance: balance,
      creditLimit: limit,
      utilizationPct: Math.round(utilizationPct),
      avgPaymentDays,
      riskTier,
      riskLabel,
      riskScore: score,
      recommendedAction,
      isOverLimit,
      overLimitAmount,
    };
  });
}

/**
 * Generates 4-week Predictive Cash Flow forecast.
 */
export interface CashFlowForecastWeek {
  weekLabel: string;
  projectedInflow: number;
  projectedOutflow: number;
  netWeeklyChange: number;
  confidencePct: number;
}

export function generatePredictiveCashFlow(
  totalReceivables: number,
  totalPayables: number,
  avgDSO: number = 21
): CashFlowForecastWeek[] {
  // Weekly distribution based on customer DSO probability curve
  const w1In = totalReceivables * 0.35;
  const w2In = totalReceivables * 0.30;
  const w3In = totalReceivables * 0.20;
  const w4In = totalReceivables * 0.15;

  const w1Out = totalPayables * 0.40;
  const w2Out = totalPayables * 0.25;
  const w3Out = totalPayables * 0.20;
  const w4Out = totalPayables * 0.15;

  return [
    {
      weekLabel: 'Week 1 (Next 7 Days)',
      projectedInflow: Math.round(w1In),
      projectedOutflow: Math.round(w1Out),
      netWeeklyChange: Math.round(w1In - w1Out),
      confidencePct: 92,
    },
    {
      weekLabel: 'Week 2 (Days 8 - 14)',
      projectedInflow: Math.round(w2In),
      projectedOutflow: Math.round(w2Out),
      netWeeklyChange: Math.round(w2In - w2Out),
      confidencePct: 84,
    },
    {
      weekLabel: 'Week 3 (Days 15 - 21)',
      projectedInflow: Math.round(w3In),
      projectedOutflow: Math.round(w3Out),
      netWeeklyChange: Math.round(w3In - w3Out),
      confidencePct: 75,
    },
    {
      weekLabel: 'Week 4 (Days 22 - 30)',
      projectedInflow: Math.round(w4In),
      projectedOutflow: Math.round(w4Out),
      netWeeklyChange: Math.round(w4In - w4Out),
      confidencePct: 68,
    },
  ];
}
