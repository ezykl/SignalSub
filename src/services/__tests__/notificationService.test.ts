import {
  mockGetPermissionsAsync,
  mockRequestPermissionsAsync,
  mockScheduleNotificationAsync,
  mockCancelScheduledNotificationAsync,
  mockSetNotificationHandler,
} from './setupExpoNotificationsMock';

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Subscription } from '../../db/schema';
import {
  requestNotificationPermission,
  scheduleRenewalReminder,
  scheduleTrialExpiryAlert,
  cancelNotification,
  scheduleWeeklyDigest,
  cancelWeeklyDigest,
} from '../notificationService';

function createMockSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-' + Math.random().toString(36).slice(2, 8),
    name: 'Netflix',
    description: null,
    amount: 15.99,
    currency: 'USD',
    billingCycle: 'monthly',
    nextRenewalDate: '2026-09-10',
    startDate: '2026-01-01',
    color: '#E50914',
    iconType: 'initial',
    iconValue: 'N',
    category: 'entertainment',
    isTrial: 0,
    trialEndDate: null,
    isActive: 1,
    notifyBeforeDays: 3,
    notificationId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('notificationService', () => {
  beforeEach(() => {
    // Reset mocks to default granted/success implementations
    mockGetPermissionsAsync.mock.mockImplementation(async () => ({
      status: 'granted',
      granted: true,
    }));
    mockRequestPermissionsAsync.mock.mockImplementation(async () => ({
      status: 'granted',
      granted: true,
    }));
    mockScheduleNotificationAsync.mock.mockImplementation(
      async () => 'mock-notification-id-123'
    );
    mockCancelScheduledNotificationAsync.mock.mockImplementation(async () => {});
  });

  describe('Notification Handler configuration', () => {
    it('sets default notification handler on module load', async () => {
      assert.ok(mockSetNotificationHandler.mock.calls.length >= 1);
      const handlerObj = mockSetNotificationHandler.mock.calls[0].arguments[0];
      assert.ok(typeof handlerObj.handleNotification === 'function');
      const result = await handlerObj.handleNotification();
      assert.deepStrictEqual(result, {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      });
    });
  });

  describe('requestNotificationPermission', () => {
    it('returns true when getPermissionsAsync status is "granted"', async () => {
      mockGetPermissionsAsync.mock.mockImplementation(async () => ({
        status: 'granted',
        granted: true,
      }));

      const granted = await requestNotificationPermission();
      assert.strictEqual(granted, true);
    });

    it('requests permission and returns true when initial status is undetermined but granted after prompt', async () => {
      mockGetPermissionsAsync.mock.mockImplementation(async () => ({
        status: 'undetermined',
        granted: false,
      }));
      mockRequestPermissionsAsync.mock.mockImplementation(async () => ({
        status: 'granted',
        granted: true,
      }));

      const granted = await requestNotificationPermission();
      assert.strictEqual(granted, true);
    });

    it('returns false when requested permission is denied', async () => {
      mockGetPermissionsAsync.mock.mockImplementation(async () => ({
        status: 'undetermined',
        granted: false,
      }));
      mockRequestPermissionsAsync.mock.mockImplementation(async () => ({
        status: 'denied',
        granted: false,
      }));

      const granted = await requestNotificationPermission();
      assert.strictEqual(granted, false);
    });
  });

  describe('scheduleRenewalReminder', () => {
    it('returns null if notification permission is not granted', async () => {
      mockGetPermissionsAsync.mock.mockImplementation(async () => ({
        status: 'denied',
        granted: false,
      }));
      mockRequestPermissionsAsync.mock.mockImplementation(async () => ({
        status: 'denied',
        granted: false,
      }));

      const sub = createMockSubscription({
        nextRenewalDate: '2026-09-10',
        notifyBeforeDays: 3,
      });

      const result = await scheduleRenewalReminder(sub, new Date(2026, 8, 1));
      assert.strictEqual(result, null);
    });

    it('calculates trigger date: nextRenewalDate minus notifyBeforeDays days at 09:00:00 AM local time', async () => {
      const sub = createMockSubscription({
        name: 'Spotify',
        amount: 9.99,
        currency: 'USD',
        nextRenewalDate: '2026-09-10',
        notifyBeforeDays: 3,
      });

      // Fixed reference date: Sep 1, 2026
      const refDate = new Date(2026, 8, 1, 12, 0, 0);
      const notifId = await scheduleRenewalReminder(sub, refDate);

      assert.strictEqual(notifId, 'mock-notification-id-123');

      // Verify schedule call arguments
      const calls = mockScheduleNotificationAsync.mock.calls;
      const lastCall = calls[calls.length - 1];
      const payload = lastCall.arguments[0];

      assert.strictEqual(payload.content.title, 'Spotify renews in 3 days');
      assert.strictEqual(payload.content.body, 'USD 9.99 will be charged. Tap to review.');
      assert.deepStrictEqual(payload.content.data, {
        subscriptionId: sub.id,
        type: 'renewal_reminder',
      });

      assert.strictEqual(payload.trigger.type, 'date');
      const triggerDate: Date = payload.trigger.date;
      // 2026-09-10 minus 3 days = 2026-09-07
      assert.strictEqual(triggerDate.getFullYear(), 2026);
      assert.strictEqual(triggerDate.getMonth(), 8); // 8 = September
      assert.strictEqual(triggerDate.getDate(), 7);
      assert.strictEqual(triggerDate.getHours(), 9);
      assert.strictEqual(triggerDate.getMinutes(), 0);
      assert.strictEqual(triggerDate.getSeconds(), 0);
    });

    it('handles month-crossing date rollback correctly (e.g. March 1 minus 3 days = Feb 26)', async () => {
      const sub = createMockSubscription({
        nextRenewalDate: '2026-03-01',
        notifyBeforeDays: 3,
      });

      const refDate = new Date(2026, 0, 15);
      await scheduleRenewalReminder(sub, refDate);

      const calls = mockScheduleNotificationAsync.mock.calls;
      const lastCall = calls[calls.length - 1];
      const triggerDate: Date = lastCall.arguments[0].trigger.date;

      // 2026-03-01 minus 3 days:
      // March 1 -> Feb 28 -> Feb 27 -> Feb 26 (non-leap year 2026)
      assert.strictEqual(triggerDate.getFullYear(), 2026);
      assert.strictEqual(triggerDate.getMonth(), 1); // 1 = February
      assert.strictEqual(triggerDate.getDate(), 26);
      assert.strictEqual(triggerDate.getHours(), 9);
    });

    it('returns null if trigger date is in the past or right now (<= reference date)', async () => {
      const sub = createMockSubscription({
        nextRenewalDate: '2026-09-10',
        notifyBeforeDays: 3,
      });
      // Trigger date will be 2026-09-07 09:00:00 AM

      // Case 1: reference date is exactly trigger date -> returns null
      const exactDate = new Date(2026, 8, 7, 9, 0, 0, 0);
      const result1 = await scheduleRenewalReminder(sub, exactDate);
      assert.strictEqual(result1, null);

      // Case 2: reference date is after trigger date -> returns null
      const pastDate = new Date(2026, 8, 7, 10, 0, 0, 0);
      const result2 = await scheduleRenewalReminder(sub, pastDate);
      assert.strictEqual(result2, null);

      // Case 3: reference date is before trigger date -> schedules successfully
      const futureDate = new Date(2026, 8, 7, 8, 59, 59, 0);
      const result3 = await scheduleRenewalReminder(sub, futureDate);
      assert.strictEqual(result3, 'mock-notification-id-123');
    });

    it('defaults notifyBeforeDays to 3 if omitted/null', async () => {
      const sub = createMockSubscription({
        nextRenewalDate: '2026-09-10',
        notifyBeforeDays: undefined as unknown as number,
      });

      const refDate = new Date(2026, 8, 1);
      const notifId = await scheduleRenewalReminder(sub, refDate);
      assert.strictEqual(notifId, 'mock-notification-id-123');

      const calls = mockScheduleNotificationAsync.mock.calls;
      const lastCall = calls[calls.length - 1];
      assert.strictEqual(lastCall.arguments[0].content.title, 'Netflix renews in 3 days');
      assert.strictEqual(lastCall.arguments[0].trigger.date.getDate(), 7);
    });
  });

  describe('scheduleTrialExpiryAlert', () => {
    it('returns null if sub has no trialEndDate', async () => {
      const sub = createMockSubscription({
        isTrial: 0,
        trialEndDate: null,
      });

      const result = await scheduleTrialExpiryAlert(sub);
      assert.strictEqual(result, null);
    });

    it('calculates trigger date: trialEndDate minus 2 days at 09:00:00 AM local time', async () => {
      const sub = createMockSubscription({
        name: 'GymPass',
        amount: 29.99,
        currency: 'EUR',
        isTrial: 1,
        trialEndDate: '2026-09-15',
      });

      const refDate = new Date(2026, 8, 1);
      const notifId = await scheduleTrialExpiryAlert(sub, refDate);
      assert.strictEqual(notifId, 'mock-notification-id-123');

      const calls = mockScheduleNotificationAsync.mock.calls;
      const lastCall = calls[calls.length - 1];
      const payload = lastCall.arguments[0];

      assert.strictEqual(payload.content.title, 'Your GymPass trial ends in 2 days');
      assert.strictEqual(
        payload.content.body,
        'It will auto-charge EUR 29.99. Cancel now?'
      );
      assert.deepStrictEqual(payload.content.data, {
        subscriptionId: sub.id,
        type: 'trial_expiry',
      });

      assert.strictEqual(payload.trigger.type, 'date');
      const triggerDate: Date = payload.trigger.date;
      // 2026-09-15 minus 2 days = 2026-09-13
      assert.strictEqual(triggerDate.getFullYear(), 2026);
      assert.strictEqual(triggerDate.getMonth(), 8);
      assert.strictEqual(triggerDate.getDate(), 13);
      assert.strictEqual(triggerDate.getHours(), 9);
      assert.strictEqual(triggerDate.getMinutes(), 0);
      assert.strictEqual(triggerDate.getSeconds(), 0);
    });

    it('returns null if trigger date is in past or equal to reference date', async () => {
      const sub = createMockSubscription({
        isTrial: 1,
        trialEndDate: '2026-09-15',
      });
      // Trigger date is Sep 13, 09:00:00 AM

      // Later on Sep 13:
      const refDate = new Date(2026, 8, 13, 9, 30, 0);
      const result = await scheduleTrialExpiryAlert(sub, refDate);
      assert.strictEqual(result, null);
    });
  });

  describe('cancelNotification', () => {
    it('calls cancelScheduledNotificationAsync with the notification ID', async () => {
      await cancelNotification('notif-xyz-789');

      const calls = mockCancelScheduledNotificationAsync.mock.calls;
      const lastCall = calls[calls.length - 1];
      assert.strictEqual(lastCall.arguments[0], 'notif-xyz-789');
    });

    it('catches and ignores error if cancelScheduledNotificationAsync throws', async () => {
      mockCancelScheduledNotificationAsync.mock.mockImplementation(async () => {
        throw new Error('Notification not found or already dismissed');
      });

      await assert.doesNotReject(async () => {
        await cancelNotification('non-existent-id');
      });
    });
  });

  describe('scheduleWeeklyDigest', () => {
    it('schedules weekly digest with weekday = dayOfWeek + 1', async () => {
      // Sunday: dayOfWeek = 0 -> weekday = 1
      const notifIdSunday = await scheduleWeeklyDigest(0, 9, 30);
      assert.strictEqual(notifIdSunday, 'mock-notification-id-123');

      let calls = mockScheduleNotificationAsync.mock.calls;
      let payload = calls[calls.length - 1].arguments[0];

      assert.strictEqual(payload.content.title, 'Your weekly subscription summary');
      assert.strictEqual(
        payload.content.body,
        "Open SignalSub to see what's renewing this week."
      );
      assert.deepStrictEqual(payload.content.data, { type: 'weekly_digest' });
      assert.deepStrictEqual(payload.trigger, {
        type: 'weekly',
        weekday: 1,
        hour: 9,
        minute: 30,
      });

      // Saturday: dayOfWeek = 6 -> weekday = 7
      await scheduleWeeklyDigest(6, 18, 0);
      calls = mockScheduleNotificationAsync.mock.calls;
      payload = calls[calls.length - 1].arguments[0];
      assert.strictEqual(payload.trigger.weekday, 7);
      assert.strictEqual(payload.trigger.hour, 18);
      assert.strictEqual(payload.trigger.minute, 0);
    });
  });

  describe('cancelWeeklyDigest', () => {
    it('calls cancelScheduledNotificationAsync with notification ID', async () => {
      await cancelWeeklyDigest('weekly-digest-id-456');

      const calls = mockCancelScheduledNotificationAsync.mock.calls;
      const lastCall = calls[calls.length - 1];
      assert.strictEqual(lastCall.arguments[0], 'weekly-digest-id-456');
    });

    it('handles cancellation error without throwing', async () => {
      mockCancelScheduledNotificationAsync.mock.mockImplementation(async () => {
        throw new Error('Already cancelled');
      });

      await assert.doesNotReject(async () => {
        await cancelWeeklyDigest('weekly-digest-id-456');
      });
    });
  });
});
