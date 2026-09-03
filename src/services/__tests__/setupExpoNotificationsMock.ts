import { mock } from 'node:test';

export const mockGetPermissionsAsync = mock.fn(async () => ({
  status: 'granted',
  granted: true,
}));

export const mockRequestPermissionsAsync = mock.fn(async () => ({
  status: 'granted',
  granted: true,
}));

export const mockScheduleNotificationAsync = mock.fn(
  async (_request: any) => 'mock-notification-id-123'
);

export const mockCancelScheduledNotificationAsync = mock.fn(
  async (_id: string) => {}
);

export const mockSetNotificationHandler = mock.fn((_handler: any) => {});

export const mockSchedulableTriggerInputTypes = {
  CALENDAR: 'calendar',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  DATE: 'date',
  TIME_INTERVAL: 'timeInterval',
};

const mockExpoNotifications = {
  getPermissionsAsync: mockGetPermissionsAsync,
  requestPermissionsAsync: mockRequestPermissionsAsync,
  scheduleNotificationAsync: mockScheduleNotificationAsync,
  cancelScheduledNotificationAsync: mockCancelScheduledNotificationAsync,
  setNotificationHandler: mockSetNotificationHandler,
  SchedulableTriggerInputTypes: mockSchedulableTriggerInputTypes,
};

const resolved = require.resolve('expo-notifications');
require.cache[resolved] = {
  id: resolved,
  filename: resolved,
  loaded: true,
  exports: mockExpoNotifications,
} as unknown as NodeModule;
