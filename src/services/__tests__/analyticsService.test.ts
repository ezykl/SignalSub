import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Subscription } from '../../db/schema';
import {
  toMonthlyAmount,
  computeMonthlyTotal,
  computeYearlyTotal,
  computeCategoryBreakdown,
  getUpcomingRenewals,
  getActiveTrials,
} from '../analyticsService';

function createMockSubscription(overrides: Partial<Subscription>): Subscription {
  return {
    id: 'sub-' + Math.random().toString(36).slice(2, 8),
    name: 'Test Service',
    description: null,
    amount: 10,
    currency: 'USD',
    billingCycle: 'monthly',
    nextRenewalDate: '2026-09-10',
    startDate: '2026-01-01',
    color: '#7B5EA7',
    iconType: 'initial',
    iconValue: 'T',
    category: 'streaming',
    isTrial: 0,
    trialEndDate: null,
    isActive: 1,
    status: 'active',
    notifyBeforeDays: 3,
    notificationId: null,
    paymentMethod: 'card',
    paymentDetails: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('analyticsService', () => {
  describe('toMonthlyAmount', () => {
    it('calculates weekly normalized amount: amount * 52 / 12', () => {
      // 12 * 52 / 12 = 52
      assert.strictEqual(toMonthlyAmount(12, 'weekly'), 52);
      // 10 * 52 / 12 = 43.333333333333336
      const val = toMonthlyAmount(10, 'weekly');
      assert.ok(Math.abs(val - (10 * 52) / 12) < 0.0001);
    });

    it('calculates monthly amount as unchanged', () => {
      assert.strictEqual(toMonthlyAmount(15.99, 'monthly'), 15.99);
    });

    it('calculates quarterly amount: amount / 3', () => {
      assert.strictEqual(toMonthlyAmount(30, 'quarterly'), 10);
      assert.strictEqual(toMonthlyAmount(90, 'quarterly'), 30);
    });

    it('calculates yearly amount: amount / 12', () => {
      assert.strictEqual(toMonthlyAmount(120, 'yearly'), 10);
      assert.strictEqual(toMonthlyAmount(240, 'yearly'), 20);
    });

    it('handles case-insensitivity and leading/trailing whitespace', () => {
      assert.strictEqual(toMonthlyAmount(120, ' YEARLY '), 10);
      assert.strictEqual(toMonthlyAmount(15, 'Monthly'), 15);
    });
  });

  describe('computeMonthlyTotal and computeYearlyTotal', () => {
    it('sums monthly-equivalent amounts for active subscriptions only', () => {
      const subs: Subscription[] = [
        createMockSubscription({ amount: 10, billingCycle: 'monthly', isActive: 1 }), // 10
        createMockSubscription({ amount: 120, billingCycle: 'yearly', isActive: 1 }), // 10
        createMockSubscription({ amount: 30, billingCycle: 'quarterly', isActive: 1 }), // 10
        createMockSubscription({ amount: 12, billingCycle: 'weekly', isActive: 1 }), // 52
        createMockSubscription({ amount: 100, billingCycle: 'monthly', isActive: 0 }), // INACTIVE: 0
      ];

      const monthlyTotal = computeMonthlyTotal(subs);
      assert.strictEqual(monthlyTotal, 10 + 10 + 10 + 52); // 82

      const yearlyTotal = computeYearlyTotal(subs);
      assert.strictEqual(yearlyTotal, 82 * 12); // 984
    });

    it('returns 0 when subscription list is empty or all inactive', () => {
      assert.strictEqual(computeMonthlyTotal([]), 0);
      assert.strictEqual(computeYearlyTotal([]), 0);

      const inactiveSubs = [
        createMockSubscription({ amount: 50, isActive: 0 }),
        createMockSubscription({ amount: 25, isActive: 0 }),
      ];
      assert.strictEqual(computeMonthlyTotal(inactiveSubs), 0);
      assert.strictEqual(computeYearlyTotal(inactiveSubs), 0);
    });
  });

  describe('computeCategoryBreakdown', () => {
    it('groups active subscriptions by category and sorts by total descending', () => {
      const subs: Subscription[] = [
        createMockSubscription({
          name: 'Netflix',
          category: 'streaming',
          amount: 20,
          billingCycle: 'monthly',
          isActive: 1,
        }),
        createMockSubscription({
          name: 'Spotify',
          category: 'streaming',
          amount: 10,
          billingCycle: 'monthly',
          isActive: 1,
        }),
        createMockSubscription({
          name: 'Gym',
          category: 'fitness',
          amount: 50,
          billingCycle: 'monthly',
          isActive: 1,
        }),
        createMockSubscription({
          name: 'iCloud',
          category: 'cloud',
          amount: 12,
          billingCycle: 'yearly', // 1/mo
          isActive: 1,
        }),
        createMockSubscription({
          name: 'Old Gym',
          category: 'fitness',
          amount: 100,
          billingCycle: 'monthly',
          isActive: 0, // Inactive should be excluded
        }),
      ];

      const breakdown = computeCategoryBreakdown(subs);

      // Expected order:
      // 1. fitness: total 50, count 1
      // 2. streaming: total 30, count 2
      // 3. cloud: total 1, count 1
      assert.strictEqual(breakdown.length, 3);
      assert.deepStrictEqual(breakdown[0], {
        category: 'fitness',
        total: 50,
        count: 1,
      });
      assert.deepStrictEqual(breakdown[1], {
        category: 'streaming',
        total: 30,
        count: 2,
      });
      assert.deepStrictEqual(breakdown[2], {
        category: 'cloud',
        total: 1,
        count: 1,
      });
    });

    it('returns empty array when no active subscriptions exist', () => {
      const breakdown = computeCategoryBreakdown([]);
      assert.deepStrictEqual(breakdown, []);
    });
  });

  describe('getUpcomingRenewals', () => {
    const fixedToday = '2026-09-03';

    it('includes renewals between today and today + withinDays, sorted ascending', () => {
      const subs: Subscription[] = [
        createMockSubscription({
          name: 'Netflix (in 7 days)',
          nextRenewalDate: '2026-09-10',
          isActive: 1,
        }),
        createMockSubscription({
          name: 'Spotify (tomorrow)',
          nextRenewalDate: '2026-09-04',
          isActive: 1,
        }),
        createMockSubscription({
          name: 'iCloud (today)',
          nextRenewalDate: '2026-09-03',
          isActive: 1,
        }),
        createMockSubscription({
          name: 'Adobe (in 30 days)',
          nextRenewalDate: '2026-10-03',
          isActive: 1,
        }),
        createMockSubscription({
          name: 'Disney+ (in 31 days - outside window)',
          nextRenewalDate: '2026-10-04',
          isActive: 1,
        }),
        createMockSubscription({
          name: 'Gym (yesterday - in past)',
          nextRenewalDate: '2026-09-02',
          isActive: 1,
        }),
        createMockSubscription({
          name: 'Hulu (tomorrow, but inactive)',
          nextRenewalDate: '2026-09-04',
          isActive: 0,
        }),
      ];

      const upcoming = getUpcomingRenewals(subs, 30, fixedToday);

      // Should include: iCloud (today), Spotify (tomorrow), Netflix (in 7 days), Adobe (in 30 days)
      assert.strictEqual(upcoming.length, 4);
      assert.strictEqual(upcoming[0].name, 'iCloud (today)');
      assert.strictEqual(upcoming[1].name, 'Spotify (tomorrow)');
      assert.strictEqual(upcoming[2].name, 'Netflix (in 7 days)');
      assert.strictEqual(upcoming[3].name, 'Adobe (in 30 days)');
    });

    it('respects custom withinDays boundary', () => {
      const subs: Subscription[] = [
        createMockSubscription({ name: 'Sub A', nextRenewalDate: '2026-09-05', isActive: 1 }), // +2
        createMockSubscription({ name: 'Sub B', nextRenewalDate: '2026-09-10', isActive: 1 }), // +7
        createMockSubscription({ name: 'Sub C', nextRenewalDate: '2026-09-12', isActive: 1 }), // +9
      ];

      const upcoming = getUpcomingRenewals(subs, 7, fixedToday);
      assert.strictEqual(upcoming.length, 2);
      assert.strictEqual(upcoming[0].name, 'Sub A');
      assert.strictEqual(upcoming[1].name, 'Sub B');
    });
  });

  describe('getActiveTrials', () => {
    const fixedToday = '2026-09-03';

    it('filters active subscriptions where isTrial === 1 and trialEndDate >= today', () => {
      const subs: Subscription[] = [
        createMockSubscription({
          name: 'Trial ending future',
          isTrial: 1,
          isActive: 1,
          trialEndDate: '2026-09-10',
        }),
        createMockSubscription({
          name: 'Trial ending today',
          isTrial: 1,
          isActive: 1,
          trialEndDate: '2026-09-03',
        }),
        createMockSubscription({
          name: 'Trial ended yesterday',
          isTrial: 1,
          isActive: 1,
          trialEndDate: '2026-09-02',
        }),
        createMockSubscription({
          name: 'Inactive trial',
          isTrial: 1,
          isActive: 0,
          trialEndDate: '2026-09-15',
        }),
        createMockSubscription({
          name: 'Regular non-trial subscription',
          isTrial: 0,
          isActive: 1,
          trialEndDate: '2026-09-15',
        }),
      ];

      const activeTrials = getActiveTrials(subs, fixedToday);
      assert.strictEqual(activeTrials.length, 2);
      assert.strictEqual(activeTrials[0].name, 'Trial ending future');
      assert.strictEqual(activeTrials[1].name, 'Trial ending today');
    });
  });
});
