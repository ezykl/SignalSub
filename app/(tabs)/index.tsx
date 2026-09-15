import React, { useCallback, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import type { Subscription } from '@/db/schema';
import {
  computeMonthlyTotal,
  computeYearlyTotal,
  getUpcomingRenewals,
} from '@/services/analyticsService';
import { daysUntil } from '@/services/renewalService';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import {
  AlertBanner,
  FAB,
  GlassCard,
  SpendingCard,
  SubscriptionCard,
  SubscriptionRow,
  TrialAlertCard,
  UpcomingRenewalCard,
  UserAvatar,
  AppIcon,
} from '@/components';

export function getGreeting(date: Date = new Date(), userAlias?: string): string {
  const hour = date.getHours();
  const timeGreeting =
    hour < 12
      ? 'Good Morning'
      : hour < 17
      ? 'Good Afternoon'
      : 'Good Evening';

  if (userAlias && userAlias.trim()) {
    return `${timeGreeting}, ${userAlias.trim()} 👋`;
  }
  return `${timeGreeting} 👋`;
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatDashboardDate(date: Date = new Date()): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export interface DashboardAlert {
  id: string;
  type: 'renewal' | 'trial';
  message: string;
  subscriptionId: string;
}

export function computeDashboardAlerts(
  subscriptions: Subscription[],
  currency: string,
  referenceDate: Date | string = new Date()
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  // Active trials expiring within 7 days (daysUntil <= 7 && daysUntil >= 0)
  for (const sub of subscriptions) {
    if (sub.isActive === 1 && sub.isTrial === 1 && sub.trialEndDate) {
      const days = daysUntil(sub.trialEndDate, referenceDate);
      if (days >= 0 && days <= 7) {
        alerts.push({
          id: `trial-${sub.id}`,
          type: 'trial',
          message: `${sub.name} trial ends in ${days} days`,
          subscriptionId: sub.id,
        });
      }
    }
  }

  // Active subscriptions renewing within 3 days (daysUntil <= 3 && daysUntil >= 0)
  for (const sub of subscriptions) {
    if (sub.isActive === 1 && sub.nextRenewalDate) {
      const days = daysUntil(sub.nextRenewalDate, referenceDate);
      if (days >= 0 && days <= 3) {
        const amountFormatted = (sub.amount ?? 0).toFixed(2);
        alerts.push({
          id: `renewal-${sub.id}`,
          type: 'renewal',
          message: `${sub.name} renews in ${days} days · ${currency} ${amountFormatted}`,
          subscriptionId: sub.id,
        });
      }
    }
  }

  return alerts;
}

export interface DashboardScreenProps {
  referenceDate?: Date;
}

export default function DashboardScreen({
  referenceDate,
}: DashboardScreenProps = {}) {
  const router = useRouter();
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const loadSubscriptions = useSubscriptionStore(
    (state) => state.loadSubscriptions
  );
  const deleteSubscription = useSubscriptionStore(
    (state) => state.deleteSubscription
  );
  const pauseSubscription = useSubscriptionStore(
    (state) => state.pauseSubscription
  );
  const getSetting = useSettingsStore((state) => state.getSetting);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  useSettingsStore((state) => state.cache);

  const currency = getSetting('default_currency', 'USD');
  const userAlias = getSetting('user_alias', '');
  const userAvatar = getSetting('user_avatar', '');
  const defaultPaymentMethod = getSetting('default_payment_method', '');

  useFocusEffect(
    useCallback(() => {
      loadSettings?.();
      loadSubscriptions();
    }, [loadSettings, loadSubscriptions])
  );

  const now = referenceDate ?? new Date();
  const greeting = getGreeting(now, userAlias);
  const formattedDate = formatDashboardDate(now);
  const isSetupIncomplete = !userAlias.trim() || !defaultPaymentMethod.trim();

  const [isAlertsModalVisible, setIsAlertsModalVisible] = useState(false);
  const [dismissedTrials, setDismissedTrials] = useState<Record<string, string>>({});
  const todayStr = (now instanceof Date ? now : new Date()).toISOString().slice(0, 10);

  const expiringTrials = subscriptions.filter((sub) => {
    if (sub.isTrial !== 1 || sub.isActive !== 1 || sub.status !== 'active') {
      return false;
    }
    if (!sub.trialEndDate) return false;
    const days = daysUntil(sub.trialEndDate, now);
    if (days < 0 || days > 1) return false;
    if (dismissedTrials[sub.id] === todayStr) return false;
    return true;
  });

  const alerts = computeDashboardAlerts(subscriptions, currency, now);
  const monthlyTotal = computeMonthlyTotal(subscriptions);
  const yearlyTotal = computeYearlyTotal(subscriptions);
  const upcomingRenewals = getUpcomingRenewals(subscriptions, 30, now);
  const activeSubscriptions = subscriptions.filter((s) => s.isActive === 1);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View className="flex-row justify-between items-center px-5 pt-3 pb-4">
          <View className="flex-row items-center gap-3 flex-1">
            <TouchableOpacity
              className="w-11 h-11 rounded-full overflow-hidden bg-primary/20 border-[1.5px] border-primary/40 items-center justify-center shadow-md shadow-purple-900/35 elevation-4"
              onPress={() => router.push('/settings')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Profile avatar"
              testID="dashboard-avatar-badge"
            >
              <UserAvatar avatarId={userAvatar || 'astronaut'} size={42} />
            </TouchableOpacity>
            <View className="flex-col justify-center flex-1">
              <Text className="text-lg font-heading font-bold text-white tracking-tight">{greeting}</Text>
              <Text className="text-[13px] font-body font-semibold text-purple-300 mt-0.5">{formattedDate}</Text>
            </View>
          </View>

          <TouchableOpacity
            className="w-[42px] h-[42px] rounded-[14px] bg-[#1A1A2E]/85 border border-white/10 items-center justify-center relative shadow-md shadow-black/30 elevation-3"
            onPress={() => setIsAlertsModalVisible(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Notifications and Alerts"
            testID="dashboard-settings-button"
          >
            <AppIcon
              name="bell"
              size={22}
              color={alerts.length > 0 ? COLORS.accentPurpleLight : COLORS.textPrimary}
            />
            {alerts.length > 0 && (
              <View className="absolute -top-[3px] -right-[3px] bg-coral rounded-full min-w-[18px] h-[18px] items-center justify-center px-1 border-2 border-background">
                <Text className="text-[10px] font-heading font-extrabold text-white">{alerts.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Personalization Setup Card */}
        {isSetupIncomplete && (
          <GlassCard className="mx-4 mb-4 bg-primary/10 rounded-[14px] border border-[#A78BFA]/30 p-3.5" testID="dashboard-setup-card">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 text-[13px] font-body text-white leading-[18px] font-medium">
                👋 Personalize your tracker: Set default payment method & alias
              </Text>
              <TouchableOpacity
                className="flex-row items-center bg-primary px-3 py-2 rounded-full gap-1"
                onPress={() => router.push('/settings')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Set Up Now"
                testID="setup-card-button"
              >
                <Text className="text-xs font-heading font-bold text-white">Set Up Now</Text>
                <MaterialIcons name="arrow-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {/* Trial Expiry Prompt Cards */}
        {expiringTrials.length > 0 && (
          <View className="px-4 mb-2" testID="dashboard-trial-expiry-container">
            {expiringTrials.map((sub) => (
              <TrialAlertCard
                key={`trial-expiry-${sub.id}`}
                subscription={sub}
                referenceDate={now}
                testID={`trial-expiry-card-${sub.id}`}
                onCancel={() =>
                  useSubscriptionStore.getState().cancelSubscription(sub.id)
                }
                onKeepActive={() =>
                  setDismissedTrials((prev) => ({
                    ...prev,
                    [sub.id]: todayStr,
                  }))
                }
              />
            ))}
          </View>
        )}

        {/* Alert Banners */}
        {alerts.length > 0 && (
          <View className="px-4 mb-4" testID="dashboard-alerts">
            {alerts.map((alert) => (
              <AlertBanner
                key={alert.id}
                type={alert.type}
                message={alert.message}
                onPress={() => router.push(`/subscription/${alert.subscriptionId}`)}
                testID={`alert-banner-${alert.id}`}
              />
            ))}
          </View>
        )}

        {/* Spending Summary Card */}
        <SpendingCard
          monthlyTotal={monthlyTotal}
          yearlyTotal={yearlyTotal}
          currency={currency}
          testID="dashboard-spending-card"
        />

        {/* Upcoming Renewals Section */}
        {upcomingRenewals.length > 0 && (
          <View className="mb-6" testID="dashboard-upcoming-section">
            <Text className="text-xs font-heading font-bold text-[#CCC4D1] tracking-wider uppercase px-4 mb-3">
              Upcoming Renewals
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}
              testID="dashboard-upcoming-scroll"
            >
              {upcomingRenewals.map((sub) => (
                <UpcomingRenewalCard
                  key={sub.id}
                  subscription={sub}
                  onPress={() => router.push(`/subscription/${sub.id}`)}
                  testID={`upcoming-card-${sub.id}`}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Active Subscriptions Section */}
        <View className="mb-6" testID="dashboard-active-section">
          <Text className="text-xs font-heading font-bold text-[#CCC4D1] tracking-wider uppercase px-4 mb-3">
            Active Subscriptions
          </Text>
          {activeSubscriptions.length === 0 ? (
            <View className="bg-card/75 rounded-2xl p-6 mx-4 items-center justify-center border border-white/[0.08]" testID="dashboard-empty-state">
              <View className="w-16 h-16 rounded-full bg-primary/15 items-center justify-center mb-4">
                <MaterialIcons
                  name="playlist-add"
                  size={40}
                  color={COLORS.accentPurple}
                />
              </View>
              <Text className="text-base font-heading font-bold text-white mb-2 text-center">No active subscriptions</Text>
              <Text className="text-[13px] font-body text-muted text-center leading-[18px] mb-5 max-w-[260px]">
                Track your subscriptions, upcoming renewals, and free trials in one place.
              </Text>
              <TouchableOpacity
                className="flex-row items-center bg-primary py-2.5 px-4.5 rounded-full"
                onPress={() => router.push('/subscription/new')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Add subscription"
                testID="empty-state-add-button"
              >
                <MaterialIcons
                  name="add"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text className="text-sm font-heading font-semibold text-white">Add Subscription</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="px-4" testID="dashboard-active-list">
              {activeSubscriptions.map((sub) => (
                <SubscriptionRow
                  key={sub.id}
                  subscription={sub}
                  onPress={() => router.push(`/subscription/${sub.id}`)}
                  onDelete={() => deleteSubscription(sub.id)}
                  onPause={() => pauseSubscription(sub.id, sub.isActive === 1)}
                  testID={`active-row-${sub.id}`}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Renewal Alerts & Notifications Modal */}
      <Modal
        visible={isAlertsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAlertsModalVisible(false)}
        testID="dashboard-alerts-modal"
      >
        <View className="flex-1 bg-black/75 justify-end">
          <View className="bg-[#161626] rounded-t-3xl border border-[#7B5EA7]/25 p-5 max-h-[80%]">
            <View className="flex-row justify-between items-center pb-4 border-b border-white/[0.08]">
              <View className="flex-row items-center gap-2">
                <AppIcon name="bell" size={22} color={COLORS.accentPurple} />
                <Text className="text-lg font-heading font-bold text-white">Renewal Alerts</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAlertsModalVisible(false)}
                className="p-1"
                testID="alerts-modal-close-button"
              >
                <MaterialIcons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {alerts.length > 0 ? (
              <ScrollView className="mt-3.5 max-h-80" showsVerticalScrollIndicator={false}>
                {alerts.map((alert: DashboardAlert) => (
                  <TouchableOpacity
                    key={alert.id}
                    className="flex-row items-center bg-white/[0.04] rounded-[14px] p-3.5 mb-2.5 border border-white/[0.06]"
                    onPress={() => {
                      setIsAlertsModalVisible(false);
                      router.push(`/subscription/${alert.subscriptionId}`);
                    }}
                    activeOpacity={0.7}
                    testID={`alerts-modal-item-${alert.id}`}
                  >
                    <View
                      className={`w-[38px] h-[38px] rounded-[10px] items-center justify-center mr-3 ${
                        alert.type === 'trial'
                          ? 'bg-amber-500/15'
                          : 'bg-primary/15'
                      }`}
                    >
                      <MaterialIcons
                        name={alert.type === 'trial' ? 'timer' : 'event'}
                        size={20}
                        color={alert.type === 'trial' ? COLORS.warning : COLORS.accentPurple}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-body font-semibold text-white leading-[18px]">{alert.message}</Text>
                      <Text className="text-xs font-body text-purple-300 mt-0.5">Tap to view subscription →</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View className="py-9 items-center justify-center" testID="alerts-modal-empty">
                <MaterialIcons name="check-circle" size={44} color={COLORS.success} />
                <Text className="text-[17px] font-heading font-bold text-white mt-3">You're All Caught Up!</Text>
                <Text className="text-[13px] font-body text-muted text-center mt-1.5 px-5">
                  No renewal or trial alerts scheduled within the next 3 days.
                </Text>
              </View>
            )}

            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 mt-4 py-3 rounded-xl bg-white/5"
              onPress={() => {
                setIsAlertsModalVisible(false);
                router.push('/settings');
              }}
              activeOpacity={0.8}
              testID="alerts-modal-settings-link"
            >
              <MaterialIcons name="tune" size={18} color={COLORS.textSecondary} />
              <Text className="text-[13px] font-heading font-semibold text-muted">Configure Notification Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <FAB
        onPress={() => router.push('/subscription/new')}
        testID="dashboard-fab"
      />
    </SafeAreaView>
  );
}