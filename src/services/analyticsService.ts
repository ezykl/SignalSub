/**
 * SignalSub Analytics Service
 * Provides mathematical and aggregation functions for subscription spending,
 * category breakdowns, upcoming renewals, and active trials.
 */

import type { Subscription } from '../db/schema';
import { daysUntil } from './renewalService';

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
}

/**
 * Formats a Date or date string to YYYY-MM-DD.
 */
function formatToYYYYMMDD(dateInput: Date | string): string {
  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes an amount to its monthly equivalent based on billing cycle:
 * - 'weekly': amount * 52 / 12
 * - 'monthly': amount
 * - 'quarterly': amount / 3
 * - 'yearly': amount / 12
 */
export function toMonthlyAmount(amount: number, billingCycle: string): number {
  const cycle = billingCycle?.toLowerCase().trim();
  switch (cycle) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

/**
 * Computes the sum of monthly-equivalent amounts for all active subscriptions (isActive === 1).
 */
export function computeMonthlyTotal(subs: Subscription[]): number {
  return subs
    .filter((s) => s.isActive === 1)
    .reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.billingCycle), 0);
}

/**
 * Computes the projected yearly spend for all active subscriptions.
 * Equal to computeMonthlyTotal(subs) * 12.
 */
export function computeYearlyTotal(subs: Subscription[]): number {
  return computeMonthlyTotal(subs) * 12;
}

/**
 * Groups active subscriptions by category, sums monthly amounts, counts subscriptions,
 * and sorts categories by total descending.
 */
export function computeCategoryBreakdown(subs: Subscription[]): CategoryBreakdown[] {
  const map = new Map<string, { total: number; count: number }>();

  for (const sub of subs) {
    if (sub.isActive !== 1) continue;
    const category = sub.category || 'other';
    const monthly = toMonthlyAmount(sub.amount, sub.billingCycle);
    const current = map.get(category);

    if (current) {
      current.total += monthly;
      current.count += 1;
    } else {
      map.set(category, { total: monthly, count: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([category, { total, count }]) => ({ category, total, count }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));
}

/**
 * Filters active subscriptions where nextRenewalDate is between today and today + withinDays.
 * Sorts ascending by nextRenewalDate (soonest first).
 *
 * @param subs Array of subscriptions
 * @param withinDays Number of days ahead to include (default: 30)
 * @param referenceDate Optional reference date (defaults to today)
 */
export function getUpcomingRenewals(
  subs: Subscription[],
  withinDays = 30,
  referenceDate: Date | string = new Date()
): Subscription[] {
  return subs
    .filter((sub) => {
      if (sub.isActive !== 1) return false;
      if (!sub.nextRenewalDate) return false;
      const days = daysUntil(sub.nextRenewalDate, referenceDate);
      return days >= 0 && days <= withinDays;
    })
    .sort((a, b) => {
      const cmp = a.nextRenewalDate.localeCompare(b.nextRenewalDate);
      if (cmp !== 0) return cmp;
      return a.name.localeCompare(b.name);
    });
}

/**
 * Filters subscriptions where isTrial === 1, isActive === 1, and trialEndDate >= today (YYYY-MM-DD).
 *
 * @param subs Array of subscriptions
 * @param referenceDate Optional reference date (defaults to today)
 */
export function getActiveTrials(
  subs: Subscription[],
  referenceDate: Date | string = new Date()
): Subscription[] {
  const todayStr = formatToYYYYMMDD(referenceDate);
  return subs.filter((sub) => {
    if (sub.isTrial !== 1 || sub.isActive !== 1) return false;
    if (!sub.trialEndDate) return false;
    const endDateStr = formatToYYYYMMDD(sub.trialEndDate);
    return endDateStr >= todayStr;
  });
}
