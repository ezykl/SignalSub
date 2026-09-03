import * as Notifications from 'expo-notifications';
import { parseDateParts } from './renewalService';
import type { Subscription } from '../db/schema';

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
 * Schedules a local push notification reminder before a subscription renews.
 * 
 * Trigger date: sub.nextRenewalDate minus sub.notifyBeforeDays days at 09:00:00 AM local time.
 * If permission is not granted or trigger date <= current date/time, returns null.
 * 
 * @param sub Subscription record
 * @param referenceDate Optional current reference date (defaults to new Date())
 * @returns Notification identifier string or null if skipped
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
  const triggerDate = new Date(
    parts.year,
    parts.month - 1,
    parts.day - notifyDays,
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
      title: `${sub.name} renews in ${notifyDays} days`,
      body: `${sub.currency} ${sub.amount.toFixed(2)} will be charged. Tap to review.`,
      data: { subscriptionId: sub.id, type: 'renewal_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return notificationId;
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
 * Cancels a scheduled notification by ID.
 * Catches and ignores errors (e.g. if already dismissed or not found).
 * 
 * @param notificationId Identifier of the notification to cancel
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Ignore error if already dismissed or not found
  }
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
