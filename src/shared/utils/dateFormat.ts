/**
 * Date formatting utilities for Indian Standard Time (IST)
 * All dates are stored in UTC in the database and converted to IST for display
 */

/**
 * Format date to Indian Standard Time (IST)
 * @param dateString - ISO date string from backend
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in IST
 */
export function formatDateIST(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Default options for date and time display
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata', // Indian Standard Time
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // Use AM/PM format
    ...options,
  };

  return date.toLocaleString('en-IN', defaultOptions);
}

/**
 * Format date only (without time) in IST
 */
export function formatDateOnlyIST(dateString: string | Date): string {
  return formatDateIST(dateString, {
    hour: undefined,
    minute: undefined,
    hour12: undefined,
  });
}

/**
 * Format time only in IST
 */
export function formatTimeOnlyIST(dateString: string | Date): string {
  return formatDateIST(dateString, {
    year: undefined,
    month: undefined,
    day: undefined,
  });
}

/**
 * Format date and time with seconds in IST
 */
export function formatDateTimeIST(dateString: string | Date): string {
  return formatDateIST(dateString, {
    second: '2-digit',
  });
}

