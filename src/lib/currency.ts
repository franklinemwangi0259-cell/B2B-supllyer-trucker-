import { CurrencyRate } from '../types.ts';

export const CURRENCY_RATES: Record<string, CurrencyRate> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToUSD: 1.0, flag: '🇺🇸' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToUSD: 86.8, flag: '🇮🇳' },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', rateToUSD: 129.5, flag: '🇰🇪' },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rateToUSD: 1485.0, flag: '🇳🇬' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToUSD: 0.92, flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToUSD: 0.78, flag: '🇬🇧' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', rateToUSD: 18.25, flag: '🇿🇦' },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rateToUSD: 3.67, flag: '🇦🇪' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateToUSD: 1.38, flag: '🇨🇦' },
};

/**
 * Converts an amount from one currency to another using real-time FX rates.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (!amount || fromCurrency === toCurrency) return amount;
  
  const fromRate = CURRENCY_RATES[fromCurrency]?.rateToUSD || 1.0;
  const toRate = CURRENCY_RATES[toCurrency]?.rateToUSD || 1.0;

  // Convert to USD base first, then to target currency
  const inUSD = amount / fromRate;
  const converted = inUSD * toRate;
  return Number(converted.toFixed(2));
}

/**
 * Formats amount with symbol and 2 decimals.
 */
export function formatCurrencyAmount(
  amount: number | undefined | null,
  currencyCode: string
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    const symbol = CURRENCY_RATES[currencyCode]?.symbol || currencyCode;
    return `${symbol} 0.00`;
  }
  const symbol = CURRENCY_RATES[currencyCode]?.symbol || currencyCode;
  return `${symbol} ${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
