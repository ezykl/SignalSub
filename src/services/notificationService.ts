import * as Notifications from 'expo-notifications';
import { parseDateParts } from './renewalService';
import type { Subscription } from '../db/schema';
import { notificationLog } from '../db/schema';
import { db } from '../db/client';

// Configure default notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permissions from the user.
 * Checks existing permission first; if not granted, prompts the user.
 * Returns true if permissions are granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted' || current.granted) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted' || requested.granted;
}

/**
 * Schedules local push notification reminders before a subscription renews.
 * 
 * When notifyBeforeDays >= 2, schedules multi-stage reminders:
 * - Day N warning: `${sub.name} renews in ${days} days (${sub.currency} ${sub.amount})`
 * - Day 1 warning: `Reminder: ${sub.name} renews tomorrow (${sub.currency} ${sub.amount})`
 * - Day 0 (renewal day at 9:00 AM): `Auto-charge Today: ${sub.name} (${sub.currency} ${sub.amount})`
 * 
 * Logs each scheduled notification in notification_log using db queries.
 * 
 * @param sub Subscription record
 * @param referenceDate Optional current reference date (defaults to new Date())
 * @returns Comma-separated notification identifier string or null if skipped
 */
export async function scheduleRenewalReminder(
  sub: Subscription,
  referenceDate: Date = new Date()
): Promise<string | null> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return null;
  }

  const parts = parseDateParts(sub.nextRenewalDate);
  const notifyDays = sub.notifyBeforeDays ?? 3;

  interface ReminderStage {
    daysBefore: number;
    title: string;
    body: string;
    triggerDate: Date;
  }

  const stages: ReminderStage[] = [];

  if (notifyDays >= 2) {
    // Day N warning
    stages.push({
      daysBefore: notifyDays,
      title: `${sub.name} renews in ${notifyDays} days (${sub.currency} ${sub.amount})`,
      body: `${sub.currency} ${sub.amount} will be charged. Tap to review.`,
      triggerDate: new Date(
        parts.year,
        parts.month - 1,
        parts.day - notifyDays,
        9,
        0,
        0,
        0
      ),
    });

    // Day 1 warning
    stages.push({
      daysBefore: 1,
      title: `Reminder: ${sub.name} renews tomorrow (${sub.currency} ${sub.amount})`,
      body: `${sub.currency} ${sub.amount} will be charged tomorrow. Tap to review.`,
      triggerDate: new Date(
        parts.year,
        parts.month - 1,
        parts.day - 1,
        9,
        0,
        0,
        0
      ),
    });

    // Day 0 warning
    stages.push({
      daysBefore: 0,
      title: `Auto-charge Today: ${sub.name} (${sub.currency} ${sub.amount})`,
      body: `${sub.currency} ${sub.amount} is being charged today. Tap to review.`,
      triggerDate: new Date(
        parts.year,
        parts.month - 1,
        parts.day,
        9,
        0,
        0,
        0
      ),
    });
  } else if (notifyDays === 1) {
    stages.push({
      daysBefore: 1,
      title: `Reminder: ${sub.name} renews tomorrow (${sub.currency} ${sub.amount})`,
      body: `${sub.currency} ${sub.amount} will be charged tomorrow. Tap to review.`,
      triggerDate: new Date(
        parts.year,
        parts.month - 1,
        parts.day - 1,
        9,
        0,
        0,
        0
      ),
    });
    stages.push({
      daysBefore: 0,
      title: `Auto-charge Today: ${sub.name} (${sub.currency} ${sub.amount})`,
      body: `${sub.currency} ${sub.amount} is being charged today. Tap to review.`,
      triggerDate: new Date(
        parts.year,
        parts.month - 1,
        parts.day,
        9,
        0,
        0,
        0
      ),
    });
  } else if (notifyDays === 0) {
    stages.push({
      daysBefore: 0,
      title: `Auto-charge Today: ${sub.name} (${sub.currency} ${sub.amount})`,
      body: `${sub.currency} ${sub.amount} is being charged today. Tap to review.`,
      triggerDate: new Date(
        parts.year,
        parts.month - 1,
        parts.day,
        9,
        0,
        0,
        0
      ),
    });
  }

  const scheduledIds: string[] = [];

  for (const stage of stages) {
    if (stage.triggerDate.getTime() > referenceDate.getTime()) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: stage.title,
          body: stage.body,
          data: {
            subscriptionId: sub.id,
            type: 'renewal_reminder',
            daysBefore: stage.daysBefore,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: stage.triggerDate,
        },
      });

      if (notificationId) {
        scheduledIds.push(notificationId);
      }

      // Log in notification_log using db queries
      try {
        await db.insert(notificationLog).values({
          id: `notif-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          subscriptionId: sub.id,
          type: 'renewal_reminder',
          sentAt: new Date().toISOString(),
        });
      } catch {
        // Ignore DB logging failure in environments where DB is unavailable
      }
    }
  }

  if (scheduledIds.length === 0) {
    return null;
  }

  return scheduledIds.join(',');
}

/**
 * Schedules a local push notification alert before a free trial expires.
 * 
 * Trigger date: sub.trialEndDate minus 2 days at 09:00:00 AM local time.
 * If !sub.trialEndDate or trigger date <= current date/time, returns null.
 * 
 * @param sub Subscription record
 * @param referenceDate Optional current reference date (defaults to new Date())
 * @returns Notification identifier string or null if skipped
 */
export async function scheduleTrialExpiryAlert(
  sub: Subscription,
  referenceDate: Date = new Date()
): Promise<string | null> {
  if (!sub.trialEndDate) {
    return null;
  }

  const parts = parseDateParts(sub.trialEndDate);
  const triggerDate = new Date(
    parts.year,
    parts.month - 1,
    parts.day - 2,
    9,
    0,
    0,
    0
  );

  if (triggerDate.getTime() <= referenceDate.getTime()) {
    return null;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Your ${sub.name} trial ends in 2 days`,
      body: `It will auto-charge ${sub.currency} ${sub.amount.toFixed(2)}. Cancel now?`,
      data: { subscriptionId: sub.id, type: 'trial_expiry' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return notificationId;
}

/**
 * Cancels scheduled notifications by ID or comma-separated IDs.
 * Catches and ignores errors (e.g. if already dismissed or not found).
 * 
 * @param notificationId Identifier or comma-separated identifiers of notifications to cancel
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  if (!notificationId) return;
  const ids = notificationId.split(',').map((id) => id.trim()).filter(Boolean);
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // Ignore error if already dismissed or not found
    }
  }
}

/**
 * Cleanup helper for a subscription's notifications.
 */
export async function cleanupNotifications(notificationId: string): Promise<void> {
  await cancelNotification(notificationId);
}

/**
 * Schedules a repeating weekly digest notification.
 * 
 * @param dayOfWeek 0 (Sunday) to 6 (Saturday). Converted to Expo weekday: dayOfWeek + 1.
 * @param hour Hour of day (0-23)
 * @param minute Minute of hour (0-59)
 * @returns Notification identifier string
 */
export async function scheduleWeeklyDigest(
  dayOfWeek: number,
  hour: number,
  minute: number
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your weekly subscription summary',
      body: "Open SignalSub to see what's renewing this week.",
      data: { type: 'weekly_digest' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: dayOfWeek + 1,
      hour,
      minute,
    },
  });

  return notificationId;
}

/**
 * Cancels a scheduled weekly digest notification by ID.
 * 
 * @param notificationId Identifier of the notification to cancel
 */
export async function cancelWeeklyDigest(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Ignore error if already dismissed
  }
}
