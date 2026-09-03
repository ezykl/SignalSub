import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  billingCycle: text('billing_cycle').notNull().default('monthly'),
  nextRenewalDate: text('next_renewal_date').notNull(),
  startDate: text('start_date').notNull(),
  color: text('color').notNull().default('#7B5EA7'),
  iconType: text('icon_type').notNull().default('initial'),
  iconValue: text('icon_value').notNull().default('S'),
  category: text('category').notNull().default('other'),
  isTrial: integer('is_trial').notNull().default(0),
  trialEndDate: text('trial_end_date'),
  isActive: integer('is_active').notNull().default(1),
  notifyBeforeDays: integer('notify_before_days').notNull().default(3),
  notificationId: text('notification_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const notificationLog = sqliteTable('notification_log', {
  id: text('id').primaryKey(),
  subscriptionId: text('subscription_id')
    .notNull()
    .references(() => subscriptions.id),
  type: text('type').notNull(),
  sentAt: text('sent_at').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NotificationLog = typeof notificationLog.$inferSelect;
