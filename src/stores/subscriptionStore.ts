import { create } from 'zustand';
import { eq, asc } from 'drizzle-orm';
import { db } from '../db/client';
import {
  subscriptions,
  type Subscription,
  type NewSubscription,
} from '../db/schema';
import {
  scheduleRenewalReminder,
  scheduleTrialExpiryAlert,
  cancelNotification,
} from '../services/notificationService';

export function generateSubscriptionId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export type SubscriptionInput = Omit<
  NewSubscription,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface SubscriptionState {
  subscriptions: Subscription[];
  loadSubscriptions: () => Promise<void>;
  addSubscription: (data: SubscriptionInput) => Promise<Subscription>;
  updateSubscription: (
    id: string,
    data: Partial<NewSubscription>
  ) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  pauseSubscription: (id: string, pause: boolean) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],

  loadSubscriptions: async () => {
    const rows = await db
      .select()
      .from(subscriptions)
      .orderBy(asc(subscriptions.nextRenewalDate));

    const sorted = [...rows].sort((a, b) =>
      a.nextRenewalDate.localeCompare(b.nextRenewalDate)
    );
    set({ subscriptions: sorted });
  },

  addSubscription: async (data: SubscriptionInput) => {
    const id = generateSubscriptionId();
    const now = new Date().toISOString();
    const record: Subscription = {
      id,
      name: data.name,
      description: data.description ?? null,
      amount: data.amount,
      currency: data.currency ?? 'USD',
      billingCycle: data.billingCycle ?? 'monthly',
      nextRenewalDate: data.nextRenewalDate,
      startDate: data.startDate,
      color: data.color ?? '#7B5EA7',
      iconType: data.iconType ?? 'initial',
      iconValue: data.iconValue ?? 'S',
      category: data.category ?? 'other',
      isTrial: data.isTrial ?? 0,
      trialEndDate: data.trialEndDate ?? null,
      isActive: data.isActive ?? 1,
      notifyBeforeDays: data.notifyBeforeDays ?? 3,
      notificationId: null,
      paymentMethod: data.paymentMethod ?? 'card',
      paymentDetails: data.paymentDetails ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(subscriptions).values(record);

    let scheduledId: string | null = null;
    if (record.isActive === 1) {
      scheduledId =
        record.isTrial === 1
          ? await scheduleTrialExpiryAlert(record)
          : await scheduleRenewalReminder(record);

      if (scheduledId) {
        await db
          .update(subscriptions)
          .set({ notificationId: scheduledId })
          .where(eq(subscriptions.id, id));
        record.notificationId = scheduledId;
      }
    }

    await get().loadSubscriptions();
    return record;
  },

  updateSubscription: async (
    id: string,
    data: Partial<NewSubscription>
  ) => {
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));

    if (!existing) {
      return;
    }

    if (existing.notificationId) {
      await cancelNotification(existing.notificationId);
    }

    const updatedAt = new Date().toISOString();
    await db
      .update(subscriptions)
      .set({
        ...data,
        notificationId: null,
        updatedAt,
      })
      .where(eq(subscriptions.id, id));

    const [updatedRecord] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));

    if (updatedRecord && updatedRecord.isActive === 1) {
      const scheduledId =
        updatedRecord.isTrial === 1
          ? await scheduleTrialExpiryAlert(updatedRecord)
          : await scheduleRenewalReminder(updatedRecord);

      if (scheduledId) {
        await db
          .update(subscriptions)
          .set({ notificationId: scheduledId })
          .where(eq(subscriptions.id, id));
      }
    }

    await get().loadSubscriptions();
  },

  deleteSubscription: async (id: string) => {
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));

    if (existing?.notificationId) {
      await cancelNotification(existing.notificationId);
    }

    await db.delete(subscriptions).where(eq(subscriptions.id, id));

    set((state) => ({
      subscriptions: state.subscriptions.filter((sub) => sub.id !== id),
    }));
  },

  pauseSubscription: async (id: string, pause: boolean) => {
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));

    if (!existing) {
      return;
    }

    const updatedAt = new Date().toISOString();

    if (pause) {
      if (existing.notificationId) {
        await cancelNotification(existing.notificationId);
      }
      await db
        .update(subscriptions)
        .set({
          isActive: 0,
          notificationId: null,
          updatedAt,
        })
        .where(eq(subscriptions.id, id));
    } else {
      const unpausedRecord: Subscription = {
        ...existing,
        isActive: 1,
        updatedAt,
      };

      const scheduledId =
        unpausedRecord.isTrial === 1
          ? await scheduleTrialExpiryAlert(unpausedRecord)
          : await scheduleRenewalReminder(unpausedRecord);

      await db
        .update(subscriptions)
        .set({
          isActive: 1,
          notificationId: scheduledId ?? null,
          updatedAt,
        })
        .where(eq(subscriptions.id, id));
    }

    await get().loadSubscriptions();
  },
}));

export const subscriptionStore = useSubscriptionStore;
