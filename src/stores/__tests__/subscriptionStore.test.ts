import './setupDbMock';
import {
  resetDbMock,
  seedSubscriptions,
  getInMemorySubscriptions,
  mockCancelScheduledNotificationAsync,
  mockScheduleNotificationAsync,
  mockGetPermissionsAsync,
  mockRequestPermissionsAsync,
} from './setupDbMock';

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Subscription } from '../../db/schema';
import {
  useSubscriptionStore,
  subscriptionStore,
  generateSubscriptionId,
} from '../subscriptionStore';

function createSub(overrides: Partial<Subscription> = {}): Subscription {
  const id = overrides.id ?? generateSubscriptionId();
  return {
    id,
    name: 'Spotify',
    description: 'Music streaming',
    amount: 9.99,
    currency: 'USD',
    billingCycle: 'monthly',
    nextRenewalDate: '2026-09-20',
    startDate: '2026-01-01',
    color: '#1DB954',
    iconType: 'initial',
    iconValue: 'S',
    category: 'streaming',
    isTrial: 0,
    trialEndDate: null,
    isActive: 1,
    status: 'active',
    notifyBeforeDays: 3,
    notificationId: 'notif-' + id,
    paymentMethod: 'card',
    paymentDetails: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('subscriptionStore', () => {
  beforeEach(() => {
    resetDbMock();
    useSubscriptionStore.setState({ subscriptions: [] });
  });

  describe('initial state and aliases', () => {
    it('starts with empty subscriptions list', () => {
      assert.deepEqual(useSubscriptionStore.getState().subscriptions, []);
    });

    it('subscriptionStore alias references useSubscriptionStore', () => {
      assert.strictEqual(subscriptionStore, useSubscriptionStore);
    });

    it('generateSubscriptionId generates formatted string with prefix sub_', () => {
      const id = generateSubscriptionId();
      assert.match(id, /^sub_\d+_[a-z0-9]+$/);
    });
  });

  describe('loadSubscriptions', () => {
    it('loads and sorts subscriptions by nextRenewalDate ascending (soonest first)', async () => {
      const sub1 = createSub({ id: 'sub-late', nextRenewalDate: '2026-10-15', name: 'Late Sub' });
      const sub2 = createSub({ id: 'sub-soon', nextRenewalDate: '2026-09-10', name: 'Soon Sub' });
      const sub3 = createSub({ id: 'sub-mid', nextRenewalDate: '2026-09-25', name: 'Mid Sub' });

      seedSubscriptions([sub1, sub2, sub3]);

      await useSubscriptionStore.getState().loadSubscriptions();

      const subs = useSubscriptionStore.getState().subscriptions;
      assert.strictEqual(subs.length, 3);
      assert.strictEqual(subs[0].id, 'sub-soon');
      assert.strictEqual(subs[1].id, 'sub-mid');
      assert.strictEqual(subs[2].id, 'sub-late');
    });

    it('handles empty subscriptions table', async () => {
      seedSubscriptions([]);

      await useSubscriptionStore.getState().loadSubscriptions();

      assert.deepEqual(useSubscriptionStore.getState().subscriptions, []);
    });
  });

  describe('addSubscription', () => {
    it('adds standard subscription: generates ID, inserts into SQLite, schedules renewal reminder, and updates state', async () => {
      mockScheduleNotificationAsync.mock.mockImplementation(async () => 'notif-scheduled-1');

      const inserted = await useSubscriptionStore.getState().addSubscription({
        name: 'Netflix',
        amount: 15.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextRenewalDate: '2026-09-25',
        startDate: '2026-01-01',
        notifyBeforeDays: 3,
        isTrial: 0,
      });

      // Verify returned object
      assert.match(inserted.id, /^sub_/);
      assert.strictEqual(inserted.name, 'Netflix');
      assert.strictEqual(inserted.amount, 15.99);
      assert.ok(inserted.notificationId?.includes('notif-scheduled-1'));
      assert.ok(inserted.createdAt);
      assert.ok(inserted.updatedAt);

      // Verify SQLite state
      const inDb = getInMemorySubscriptions();
      assert.strictEqual(inDb.length, 1);
      assert.strictEqual(inDb[0].id, inserted.id);
      assert.ok(inDb[0].notificationId?.includes('notif-scheduled-1'));

      // Verify Zustand state
      const inStore = useSubscriptionStore.getState().subscriptions;
      assert.strictEqual(inStore.length, 1);
      assert.strictEqual(inStore[0].id, inserted.id);
      assert.ok(inStore[0].notificationId?.includes('notif-scheduled-1'));

      // Verify renewal notification was scheduled (not trial expiry)
      assert.strictEqual(mockScheduleNotificationAsync.mock.callCount(), 3);
      const callArgs = mockScheduleNotificationAsync.mock.calls[0].arguments[0];
      assert.match(callArgs.content.title, /Netflix renews in 3 days/);
      assert.strictEqual(callArgs.content.data.type, 'renewal_reminder');
    });

    it('adds trial subscription: schedules trial expiry alert with trialEndDate', async () => {
      mockScheduleNotificationAsync.mock.mockImplementation(async () => 'notif-trial-1');

      const inserted = await useSubscriptionStore.getState().addSubscription({
        name: 'Apple TV+',
        amount: 6.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextRenewalDate: '2026-09-30',
        startDate: '2026-09-01',
        isTrial: 1,
        trialEndDate: '2026-09-28',
      });

      assert.strictEqual(inserted.isTrial, 1);
      assert.strictEqual(inserted.notificationId, 'notif-trial-1');

      // Verify trial notification scheduled
      assert.strictEqual(mockScheduleNotificationAsync.mock.callCount(), 1);
      const callArgs = mockScheduleNotificationAsync.mock.calls[0].arguments[0];
      assert.match(callArgs.content.title, /Your Apple TV\+ trial ends in 2 days/);
      assert.strictEqual(callArgs.content.data.type, 'trial_expiry');
    });

    it('does not schedule notification when permissions are denied', async () => {
      mockGetPermissionsAsync.mock.mockImplementation(async () => ({ status: 'denied', granted: false }));
      mockRequestPermissionsAsync.mock.mockImplementation(async () => ({ status: 'denied', granted: false }));

      const inserted = await useSubscriptionStore.getState().addSubscription({
        name: 'Disney+',
        amount: 7.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextRenewalDate: '2026-09-25',
        startDate: '2026-01-01',
      });

      assert.strictEqual(inserted.notificationId, null);
      assert.strictEqual(mockScheduleNotificationAsync.mock.callCount(), 0);

      const inDb = getInMemorySubscriptions();
      assert.strictEqual(inDb[0].notificationId, null);
    });

    it('does not schedule notification if subscription is created with isActive: 0', async () => {
      const inserted = await useSubscriptionStore.getState().addSubscription({
        name: 'Hulu Paused',
        amount: 7.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextRenewalDate: '2026-09-25',
        startDate: '2026-01-01',
        isActive: 0,
      });

      assert.strictEqual(inserted.isActive, 0);
      assert.strictEqual(inserted.notificationId, null);
      assert.strictEqual(mockScheduleNotificationAsync.mock.callCount(), 0);
    });
  });

  describe('updateSubscription', () => {
    it('cancels existing notification, updates record in SQLite, and reschedules new notification', async () => {
      const existing = createSub({
        id: 'sub-update-1',
        name: 'Old Name',
        nextRenewalDate: '2026-09-15',
        notificationId: 'notif-old-1',
      });
      seedSubscriptions([existing]);
      useSubscriptionStore.setState({ subscriptions: [existing] });

      mockScheduleNotificationAsync.mock.mockImplementation(async () => 'notif-rescheduled-2');

      await useSubscriptionStore.getState().updateSubscription('sub-update-1', {
        name: 'New Name',
        nextRenewalDate: '2026-09-28',
      });

      // Verify old notification was canceled
      assert.strictEqual(mockCancelScheduledNotificationAsync.mock.callCount(), 1);
      assert.strictEqual(
        mockCancelScheduledNotificationAsync.mock.calls[0].arguments[0],
        'notif-old-1'
      );

      // Verify new notification was scheduled
      assert.strictEqual(mockScheduleNotificationAsync.mock.callCount(), 3);

      // Verify SQLite state updated
      const inDb = getInMemorySubscriptions();
      assert.strictEqual(inDb[0].name, 'New Name');
      assert.strictEqual(inDb[0].nextRenewalDate, '2026-09-28');
      assert.ok(inDb[0].notificationId?.includes('notif-rescheduled-2'));
      assert.notEqual(inDb[0].updatedAt, existing.updatedAt);

      // Verify Zustand state updated
      const inStore = useSubscriptionStore.getState().subscriptions;
      assert.strictEqual(inStore[0].name, 'New Name');
      assert.ok(inStore[0].notificationId?.includes('notif-rescheduled-2'));
    });

    it('reschedules with trial expiry alert when updating to trial subscription', async () => {
      const existing = createSub({
        id: 'sub-trial-conv',
        name: 'Paramount',
        isTrial: 0,
        trialEndDate: null,
        notificationId: 'notif-renewal-old',
      });
      seedSubscriptions([existing]);

      mockScheduleNotificationAsync.mock.mockImplementation(async () => 'notif-trial-new');

      await useSubscriptionStore.getState().updateSubscription('sub-trial-conv', {
        isTrial: 1,
        trialEndDate: '2026-09-29',
      });

      assert.strictEqual(mockCancelScheduledNotificationAsync.mock.callCount(), 1);
      assert.strictEqual(mockScheduleNotificationAsync.mock.callCount(), 1);

      const callArgs = mockScheduleNotificationAsync.mock.calls[0].arguments[0];
      assert.strictEqual(callArgs.content.data.type, 'trial_expiry');

      const inDb = getInMemorySubscriptions();
      assert.strictEqual(inDb[0].notificationId, 'notif-trial-new');
    });

    it('does nothing when attempting to update non-existent subscription ID', async () => {
      await useSubscriptionStore.getState().updateSubscription('sub-non-existent', {
        name: 'Ghost Sub',
      });

      assert.strictEqual(mockCancelScheduledNotificationAsync.mock.callCount(), 0);
      assert.strictEqual(mockScheduleNotificationAsync.mock.callCount(), 0);
    });
  });

  describe('deleteSubscription', () => {
    it('cancels notification, deletes record from SQLite, and updates Zustand state', async () => {
      const sub1 = createSub({ id: 'sub-to-delete', notificationId: 'notif-del-1' });
      const sub2 = createSub({ id: 'sub-to-keep', notificationId: 'notif-keep-1' });
      seedSubscriptions([sub1, sub2]);
      useSubscriptionStore.setState({ subscriptions: [sub1, sub2] });

      await useSubscriptionStore.getState().deleteSubscription('sub-to-delete');

      // Verify notification canceled
      assert.strictEqual(mockCancelScheduledNotificationAsync.mock.callCount(), 1);
      assert.strictEqual(
        mockCancelScheduledNotificationAsync.mock.calls[0].arguments[0],
        'notif-del-1'
      );

      // Verify removed from SQLite
      const inDb = getInMemorySubscriptions();
      assert.strictEqual(inDb.length, 1);
      assert.strictEqual(inDb[0].id, 'sub-to-keep');

      // Verify removed from Zustand state
      const inStore = useSubscriptionStore.getState().subscriptions;
      assert.strictEqual(inStore.length, 1);
      assert.strictEqual(inStore[0].id, 'sub-to-keep');
    });

    it('handles deletion when subscription has no notificationId', async () => {
      const sub = createSub({ id: 'sub-no-notif', notificationId: null });
      seedSubscriptions([sub]);
      useSubscriptionStore.setState({ subscriptions: [sub] });

      await useSubscriptionStore.getState().deleteSubscription('sub-no-no-notif');

      // Deleting a missing ID does not call cancelNotification
      assert.strictEqual(mockCancelScheduledNotificationAsync.mock.callCount(), 0);
    });
  });

  describe('pauseSubscription', () => {
    it('pause === true: cancels active notification, sets isActive = 0, and updates SQLite and state', async () => {
      const activeSub = createSub({
        id: 'sub-pause-test',
        isActive: 1,
        notificationId: 'notif-active-1',
      });
      seedSubscriptions([activeSub]);
      useSubscriptionStore.setState({ subscriptions: [activeSub] });

      await useSubscriptionStore.getState().pauseSubscription('sub-pause-test', true);

      // Verify notification was canceled
      assert.strictEqual(mockCancelScheduledNotificationAsync.mock.callCount(), 1);
      assert.strictEqual(
        mockCancelScheduledNotificationAsync.mock.calls[0].arguments[0],
        'notif-active-1'
      );

      // Verify SQLite state
      const inDb = getInMemorySubscriptions();
      assert.strictEqual(inDb[0].isActive, 0);
      assert.strictEqual(inDb[0].notificationId, null);

      // Verify Zustand state
      const inStore = useSubscriptionStore.getState().subscriptions;
      assert.strictEqual(inStore[0].isActive, 0);
      assert.strictEqual(inStore[0].notificationId, null);
    });

    it('pause === false: reschedules notification, sets isActive = 1, and updates SQLite and state', async () => {
      const pausedSub = createSub({
        id: 'sub-resume-test',
        isActive: 0,
        notificationId: null,
        nextRenewalDate: '2026-09-28',
      });
      seedSubscriptions([pausedSub]);
      useSubscriptionStore.setState({ subscriptions: [pausedSub] });

      mockScheduleNotificationAsync.mock.mockImplementation(async () => 'notif-resumed-1');

      await useSubscriptionStore.getState().pauseSubscription('sub-resume-test', false);

      // Verify notification was rescheduled
      assert.strictEqual(mockScheduleNotificationAsync.mock.callCount(), 3);

      // Verify SQLite state
      const inDb = getInMemorySubscriptions();
      assert.strictEqual(inDb[0].isActive, 1);
      assert.ok(inDb[0].notificationId?.includes('notif-resumed-1'));

      // Verify Zustand state
      const inStore = useSubscriptionStore.getState().subscriptions;
      assert.strictEqual(inStore[0].isActive, 1);
      assert.ok(inStore[0].notificationId?.includes('notif-resumed-1'));
    });

    it('does nothing when called on non-existent subscription', async () => {
      await useSubscriptionStore.getState().pauseSubscription('non-existent', true);

      assert.strictEqual(mockCancelScheduledNotificationAsync.mock.callCount(), 0);
      assert.strictEqual(mockScheduleNotificationAsync.mock.callCount(), 0);
    });
  });
});
