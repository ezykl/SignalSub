import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const DB_NAME = 'signalsub.db';

export const sqliteDb = SQLite.openDatabaseSync(DB_NAME);

export function getRawDb(): SQLite.SQLiteDatabase {
  return sqliteDb;
}

export const db = drizzle(sqliteDb, { schema });

export async function runMigrations(): Promise<void> {
  await sqliteDb.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      next_renewal_date TEXT NOT NULL,
      start_date TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#7B5EA7',
      icon_type TEXT NOT NULL DEFAULT 'initial',
      icon_value TEXT NOT NULL DEFAULT 'S',
      category TEXT NOT NULL DEFAULT 'other',
      is_trial INTEGER NOT NULL DEFAULT 0,
      trial_end_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      notify_before_days INTEGER NOT NULL DEFAULT 3,
      notification_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_log (
      id TEXT PRIMARY KEY NOT NULL,
      subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
      type TEXT NOT NULL,
      sent_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_subscriptions_next_renewal_date ON subscriptions (next_renewal_date);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions (is_active);
    CREATE INDEX IF NOT EXISTS idx_notification_log_subscription_id ON notification_log (subscription_id);
  `);
}
