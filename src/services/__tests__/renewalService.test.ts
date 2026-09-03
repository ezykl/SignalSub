import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeNextRenewalDate,
  daysUntil,
  formatRenewalLabel,
  getDaysInMonth,
  parseDateParts,
} from '../renewalService';

describe('renewalService', () => {
  describe('parseDateParts & getDaysInMonth', () => {
    it('parses YYYY-MM-DD correctly', () => {
      const parts = parseDateParts('2026-01-31');
      assert.deepStrictEqual(parts, { year: 2026, month: 1, day: 31 });
    });

    it('parses ISO string with time correctly', () => {
      const parts = parseDateParts('2026-09-15T10:30:00.000Z');
      assert.deepStrictEqual(parts, { year: 2026, month: 9, day: 15 });
    });

    it('parses Date instance correctly', () => {
      const d = new Date(2026, 8, 3); // Sep 3, 2026
      const parts = parseDateParts(d);
      assert.deepStrictEqual(parts, { year: 2026, month: 9, day: 3 });
    });

    it('calculates correct days in month including leap years', () => {
      assert.strictEqual(getDaysInMonth(2026, 1), 31);
      assert.strictEqual(getDaysInMonth(2026, 2), 28); // non-leap
      assert.strictEqual(getDaysInMonth(2024, 2), 29); // leap year
      assert.strictEqual(getDaysInMonth(2026, 4), 30);
    });
  });

  describe('computeNextRenewalDate', () => {
    it('handles monthly increment from Jan 31 -> Feb 28 in non-leap year', () => {
      const next = computeNextRenewalDate('2026-01-31', 'monthly');
      assert.strictEqual(next, '2026-02-28');
    });

    it('handles monthly increment from Jan 31 -> Feb 29 in leap year', () => {
      const next = computeNextRenewalDate('2024-01-31', 'monthly');
      assert.strictEqual(next, '2024-02-29');
    });

    it('handles monthly increment from Mar 31 -> Apr 30', () => {
      const next = computeNextRenewalDate('2026-03-31', 'monthly');
      assert.strictEqual(next, '2026-04-30');
    });

    it('handles monthly increment across year boundary (Dec 15 -> Jan 15)', () => {
      const next = computeNextRenewalDate('2026-12-15', 'monthly');
      assert.strictEqual(next, '2027-01-15');
    });

    it('handles weekly cycle (adds 7 days)', () => {
      const next = computeNextRenewalDate('2026-01-10', 'weekly');
      assert.strictEqual(next, '2026-01-17');
    });

    it('handles weekly cycle crossing month boundary', () => {
      const next = computeNextRenewalDate('2026-01-28', 'weekly');
      assert.strictEqual(next, '2026-02-04');
    });

    it('handles weekly cycle crossing year boundary', () => {
      const next = computeNextRenewalDate('2026-12-28', 'weekly');
      assert.strictEqual(next, '2027-01-04');
    });

    it('handles quarterly cycle (adds 3 months) with month-end clamping', () => {
      const next1 = computeNextRenewalDate('2026-01-15', 'quarterly');
      assert.strictEqual(next1, '2026-04-15');

      const next2 = computeNextRenewalDate('2026-08-31', 'quarterly');
      assert.strictEqual(next2, '2026-11-30'); // Nov has 30 days

      const next3 = computeNextRenewalDate('2026-11-30', 'quarterly');
      assert.strictEqual(next3, '2027-02-28'); // Feb has 28 days
    });

    it('handles yearly cycle (adds 1 year) with leap year handling', () => {
      const next1 = computeNextRenewalDate('2026-05-15', 'yearly');
      assert.strictEqual(next1, '2027-05-15');

      // Leap day to non-leap day
      const next2 = computeNextRenewalDate('2024-02-29', 'yearly');
      assert.strictEqual(next2, '2025-02-28');
    });

    it('handles case-insensitive billing cycles', () => {
      assert.strictEqual(computeNextRenewalDate('2026-01-15', 'MONTHLY'), '2026-02-15');
      assert.strictEqual(computeNextRenewalDate('2026-01-15', ' Weekly '), '2026-01-22');
    });
  });

  describe('daysUntil', () => {
    const fixedToday = '2026-09-03';

    it('returns 0 for today', () => {
      assert.strictEqual(daysUntil('2026-09-03', fixedToday), 0);
    });

    it('returns 1 for tomorrow', () => {
      assert.strictEqual(daysUntil('2026-09-04', fixedToday), 1);
    });

    it('returns positive whole calendar days for future dates', () => {
      assert.strictEqual(daysUntil('2026-09-10', fixedToday), 7);
      assert.strictEqual(daysUntil('2026-10-03', fixedToday), 30);
    });

    it('returns negative whole calendar days for past dates', () => {
      assert.strictEqual(daysUntil('2026-09-02', fixedToday), -1);
      assert.strictEqual(daysUntil('2026-08-24', fixedToday), -10);
    });

    it('handles ISO timestamps with time of day accurately without timezone drift', () => {
      assert.strictEqual(daysUntil('2026-09-04T23:59:59Z', fixedToday), 1);
      assert.strictEqual(daysUntil('2026-09-03T01:00:00Z', fixedToday), 0);
    });
  });

  describe('formatRenewalLabel', () => {
    const fixedToday = '2026-09-03';

    it('returns "Today" when 0 days until renewal', () => {
      assert.strictEqual(formatRenewalLabel('2026-09-03', fixedToday), 'Today');
    });

    it('returns "Tomorrow" when 1 day until renewal', () => {
      assert.strictEqual(formatRenewalLabel('2026-09-04', fixedToday), 'Tomorrow');
    });

    it('returns "In X days" when > 1 and <= 30 days', () => {
      assert.strictEqual(formatRenewalLabel('2026-09-05', fixedToday), 'In 2 days');
      assert.strictEqual(formatRenewalLabel('2026-09-10', fixedToday), 'In 7 days');
      assert.strictEqual(formatRenewalLabel('2026-10-03', fixedToday), 'In 30 days');
    });

    it('returns short formatted date (e.g. "Sep 15") when > 30 days or past', () => {
      assert.strictEqual(formatRenewalLabel('2026-10-04', fixedToday), 'Oct 4');
      assert.strictEqual(formatRenewalLabel('2026-11-20', fixedToday), 'Nov 20');
      assert.strictEqual(formatRenewalLabel('2026-09-02', fixedToday), 'Sep 2');
      assert.strictEqual(formatRenewalLabel('2026-08-15', fixedToday), 'Aug 15');
    });
  });
});
