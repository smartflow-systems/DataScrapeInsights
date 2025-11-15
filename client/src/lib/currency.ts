/**
 * Currency formatting utilities for the DataFlow platform
 * Uses GBP (£) as the default currency
 */

export const CURRENCY_SYMBOL = '£';
export const CURRENCY_CODE = 'GBP';

/**
 * Format a number as currency with the GBP symbol
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "£1,234.56")
 */
export function formatCurrency(
  amount: number,
  options: {
    showSymbol?: boolean;
    decimals?: number;
    locale?: string;
  } = {}
): string {
  const {
    showSymbol = true,
    decimals = 2,
    locale = 'en-GB',
  } = options;

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return showSymbol ? `${CURRENCY_SYMBOL}${formatted}` : formatted;
}

/**
 * Format a number as currency with compact notation (e.g., £1.2K, £3.4M)
 * @param amount - The amount to format
 * @returns Compact currency string
 */
export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `${CURRENCY_SYMBOL}${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${CURRENCY_SYMBOL}${(amount / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}

/**
 * Parse a currency string to a number
 * @param currencyString - Currency string (e.g., "£1,234.56")
 * @returns Parsed number
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbol and commas
  const cleaned = currencyString
    .replace(/[£$,]/g, '')
    .trim();
  return parseFloat(cleaned) || 0;
}
