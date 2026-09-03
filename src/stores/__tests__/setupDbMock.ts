import { mock } from 'node:test';
import type { Subscription, NotificationLog } from '../../db/schema';
import { notificationLog, settings, subscriptions } from '../../db/schema';

// Setup expo-notifications mock first
export const mockGetPermissionsAsync = mock.fn(async () => ({
  status: 'granted',
  granted: true,
}));

export const mockRequestPermissionsAsync = mock.fn(async () => ({
  status: 'granted',
  granted: true,
}));

export const mockScheduleNotificationAsync = mock.fn(
  async (_request: any) => `mock-notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
);

export const mockCancelScheduledNotificationAsync = mock.fn(
  async (_id: string) => {}
);

export const mockSetNotificationHandler = mock.fn((_handler: any) => {});

const mockExpoNotifications = {
  getPermissionsAsync: mockGetPermissionsAsync,
  requestPermissionsAsync: mockRequestPermissionsAsync,
  scheduleNotificationAsync: mockScheduleNotificationAsync,
  cancelScheduledNotificationAsync: mockCancelScheduledNotificationAsync,
  setNotificationHandler: mockSetNotificationHandler,
  SchedulableTriggerInputTypes: {
    CALENDAR: 'calendar',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
};

const expoNotifResolved = require.resolve('expo-notifications');
require.cache[expoNotifResolved] = {
  id: expoNotifResolved,
  filename: expoNotifResolved,
  loaded: true,
  exports: mockExpoNotifications,
} as unknown as NodeModule;

// In-memory DB store
let inMemorySettings: Record<string, string> = {};
let inMemorySubscriptions: Subscription[] = [];
let inMemoryNotificationLogs: NotificationLog[] = [];

export interface DbCallLog {
  selects: Array<{ table: string; where?: string | null }>;
  inserts: Array<{ table: string; values: any }>;
  updates: Array<{ table: string; values: any; where?: string | null }>;
  deletes: Array<{ table: string; where?: string | null }>;
}

export const dbCallLog: DbCallLog = {
  selects: [],
  inserts: [],
  updates: [],
  deletes: [],
};

export function resetDbMock() {
  inMemorySettings = {};
  inMemorySubscriptions = [];
  inMemoryNotificationLogs = [];
  dbCallLog.selects = [];
  dbCallLog.inserts = [];
  dbCallLog.updates = [];
  dbCallLog.deletes = [];

  mockGetPermissionsAsync.mock.resetCalls();
  mockRequestPermissionsAsync.mock.resetCalls();
  mockScheduleNotificationAsync.mock.resetCalls();
  mockCancelScheduledNotificationAsync.mock.resetCalls();
  mockSetNotificationHandler.mock.resetCalls();

  mockGetPermissionsAsync.mock.mockImplementation(async () => ({
    status: 'granted',
    granted: true,
  }));
  mockRequestPermissionsAsync.mock.mockImplementation(async () => ({
    status: 'granted',
    granted: true,
  }));
  mockScheduleNotificationAsync.mock.mockImplementation(
    async () => `mock-notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );
  mockCancelScheduledNotificationAsync.mock.mockImplementation(async () => {});
}

export function seedSettings(data: Record<string, string>) {
  inMemorySettings = { ...data };
}

export function seedSubscriptions(subs: Subscription[]) {
  inMemorySubscriptions = subs.map((s) => ({ ...s }));
}

export function getInMemorySettings(): Record<string, string> {
  return { ...inMemorySettings };
}

export function getInMemorySubscriptions(): Subscription[] {
  return inMemorySubscriptions.map((s) => ({ ...s }));
}

export function getInMemoryNotificationLogs(): NotificationLog[] {
  return inMemoryNotificationLogs.map((l) => ({ ...l }));
}

function getTableName(table: any): string {
  if (table === settings) return 'settings';
  if (table === subscriptions) return 'subscriptions';
  if (table === notificationLog) return 'notification_log';
  const name = table?.[Symbol.for('drizzle:Name')] ?? table?._?.name ?? table?.name;
  return String(name || '');
}

function extractIdFromCondition(condition: any): string | null {
  if (!condition) return null;
  if (typeof condition === 'string') return condition;
  if (condition.queryChunks && Array.isArray(condition.queryChunks)) {
    const param = condition.queryChunks.find((c: any) => c?.constructor?.name === 'Param');
    if (param && param.value !== undefined) {
      return String(param.value);
    }
  }
  return null;
}

export const mockDb = {
  select(_fields?: any) {
    return {
      from(table: any) {
        const tableName = getTableName(table);
        let filterId: string | null = null;
        let isOrdered = false;

        const execute = () => {
          dbCallLog.selects.push({ table: tableName, where: filterId });
          if (tableName === 'settings') {
            return Object.entries(inMemorySettings).map(([key, value]) => ({ key, value }));
          }
          let results = inMemorySubscriptions.map((s) => ({ ...s }));
          if (filterId !== null) {
            results = results.filter((s) => s.id === filterId);
          }
          if (isOrdered) {
            results.sort((a, b) => a.nextRenewalDate.localeCompare(b.nextRenewalDate));
          }
          return results;
        };

        const queryObj = {
          where(condition: any) {
            filterId = extractIdFromCondition(condition);
            return queryObj;
          },
          orderBy(..._columns: any[]) {
            isOrdered = true;
            return queryObj;
          },
          then(onfulfilled?: (val: any) => any, onrejected?: (err: any) => any) {
            return Promise.resolve(execute()).then(onfulfilled, onrejected);
          },
          catch(onrejected?: (err: any) => any) {
            return Promise.resolve(execute()).catch(onrejected);
          },
        };

        return queryObj;
      },
    };
  },

  insert(table: any) {
    const tableName = getTableName(table);
    return {
      values(val: any) {
        dbCallLog.inserts.push({ table: tableName, values: val });

        const executeInsert = () => {
          if (tableName === 'settings') {
            inMemorySettings[val.key] = val.value;
          } else if (tableName === 'subscriptions') {
            inMemorySubscriptions.push({ ...val });
          } else if (tableName === 'notification_log') {
            inMemoryNotificationLogs.push({ ...val });
          }
        };

        return {
          onConflictDoUpdate({ target: _target, set }: any) {
            if (tableName === 'settings') {
              inMemorySettings[val.key] = set.value !== undefined ? set.value : val.value;
            }
            return Promise.resolve();
          },
          then(onfulfilled?: (val: any) => any, onrejected?: (err: any) => any) {
            executeInsert();
            return Promise.resolve().then(onfulfilled, onrejected);
          },
          catch(onrejected?: (err: any) => any) {
            executeInsert();
            return Promise.resolve().catch(onrejected);
          },
        };
      },
    };
  },

  update(table: any) {
    const tableName = getTableName(table);
    return {
      set(values: any) {
        return {
          where(condition: any) {
            const filterId = extractIdFromCondition(condition);
            dbCallLog.updates.push({ table: tableName, values, where: filterId });

            if (tableName === 'subscriptions' && filterId !== null) {
              const idx = inMemorySubscriptions.findIndex((s) => s.id === filterId);
              if (idx !== -1) {
                inMemorySubscriptions[idx] = {
                  ...inMemorySubscriptions[idx],
                  ...values,
                };
              }
            } else if (tableName === 'settings' && values.key) {
              inMemorySettings[values.key] = values.value;
            }

            return Promise.resolve();
          },
        };
      },
    };
  },

  delete(table: any) {
    const tableName = getTableName(table);
    return {
      where(condition: any) {
        const filterId = extractIdFromCondition(condition);
        dbCallLog.deletes.push({ table: tableName, where: filterId });

        if (tableName === 'subscriptions' && filterId !== null) {
          inMemorySubscriptions = inMemorySubscriptions.filter((s) => s.id !== filterId);
        } else if (tableName === 'settings' && filterId !== null) {
          delete inMemorySettings[filterId];
        }

        return Promise.resolve();
      },
    };
  },
};

// Intercept src/db/client so imports of db use mockDb
const dbClientResolved = require.resolve('../../db/client');
require.cache[dbClientResolved] = {
  id: dbClientResolved,
  filename: dbClientResolved,
  loaded: true,
  exports: {
    db: mockDb,
    sqliteDb: {},
    DB_NAME: 'signalsub.db',
    getRawDb: () => ({}),
    runMigrations: async () => {},
  },
} as unknown as NodeModule;
