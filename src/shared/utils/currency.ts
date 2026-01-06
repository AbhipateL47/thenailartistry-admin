/**
 * Format a number as Indian Rupee currency
 * @param amount - The amount to format
 * @returns Formatted string with ₹ symbol (e.g., "₹1,234.56")
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0.00';
  }
  return `₹${amount.toFixed(2)}`;
};

