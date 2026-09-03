/**
 * SignalSub Renewal Service
 * Provides mathematical and date calculations for subscription renewal dates,
 * countdown to next charges, and user-friendly labels.
 */

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Parses a Date or date string (YYYY-MM-DD or ISO 8601) into calendar date parts.
 */
export function parseDateParts(dateInput: string | Date): DateParts {
  if (dateInput instanceof Date) {
    return {
      year: dateInput.getFullYear(),
      month: dateInput.getMonth() + 1,
      day: dateInput.getDate(),
    };
  }

  const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      day: parseInt(match[3], 10),
    };
  }

  const parsed = new Date(dateInput);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date format: ${dateInput}`);
  }
  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate(),
  };
}

/**
 * Returns the number of days in a given month (1-indexed month: 1=Jan, 12=Dec).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Adds whole calendar days using UTC arithmetic.
 */
function addDays(parts: DateParts, daysToAdd: number): string {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}

/**
 * Adds months to date parts, clamping to the last valid day of the target month
 * (e.g. Jan 31 + 1 month -> Feb 28/29).
 */
function addMonths(parts: DateParts, monthsToAdd: number): string {
  const totalMonths = parts.year * 12 + (parts.month - 1) + monthsToAdd;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const daysInTargetMonth = getDaysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(parts.day, daysInTargetMonth);

  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
}

/**
 * Computes the next renewal date based on current date and billing cycle.
 * Handles edge cases like Jan 31 -> Feb 28, leap years, and month transitions.
 *
 * @param currentDate ISO 8601 string or YYYY-MM-DD
 * @param billingCycle 'weekly' | 'monthly' | 'quarterly' | 'yearly'
 * @returns Next renewal date in YYYY-MM-DD format
 */
export function computeNextRenewalDate(currentDate: string, billingCycle: string): string {
  const parts = parseDateParts(currentDate);
  const cycle = billingCycle?.toLowerCase().trim();

  switch (cycle) {
    case 'weekly':
      return addDays(parts, 7);
    case 'monthly':
      return addMonths(parts, 1);
    case 'quarterly':
      return addMonths(parts, 3);
    case 'yearly':
      return addMonths(parts, 12);
    default:
      return addMonths(parts, 1);
  }
}

/**
 * Calculates whole calendar days from reference date (today midnight) to target date.
 * Returns negative number if the target date is in the past.
 *
 * @param isoDate ISO 8601 string or YYYY-MM-DD
 * @param referenceDate Optional reference date (defaults to today)
 * @returns Difference in calendar days
 */
export function daysUntil(isoDate: string, referenceDate: Date | string = new Date()): number {
  const targetParts = parseDateParts(isoDate);
  const refParts = parseDateParts(referenceDate);

  const targetUtc = Date.UTC(targetParts.year, targetParts.month - 1, targetParts.day);
  const refUtc = Date.UTC(refParts.year, refParts.month - 1, refParts.day);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((targetUtc - refUtc) / MS_PER_DAY);
}

/**
 * Returns a user-friendly label for a renewal date:
 * - 'Today' if 0 days
 * - 'Tomorrow' if 1 day
 * - 'In X days' if > 1 and <= 30
 * - 'MMM D' (e.g. 'Sep 15') if > 30 days or in the past
 *
 * @param isoDate ISO 8601 string or YYYY-MM-DD
 * @param referenceDate Optional reference date (defaults to today)
 */
export function formatRenewalLabel(
  isoDate: string,
  referenceDate: Date | string = new Date()
): string {
  const days = daysUntil(isoDate, referenceDate);

  if (days === 0) {
    return 'Today';
  }
  if (days === 1) {
    return 'Tomorrow';
  }
  if (days > 1 && days <= 30) {
    return `In ${days} days`;
  }

  const parts = parseDateParts(isoDate);
  return `${MONTH_NAMES[parts.month - 1]} ${parts.day}`;
}
