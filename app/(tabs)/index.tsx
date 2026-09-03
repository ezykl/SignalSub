import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
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
  SpendingCard,
  SubscriptionCard,
  SubscriptionRow,
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

  const alerts = computeDashboardAlerts(subscriptions, currency, now);
  const monthlyTotal = computeMonthlyTotal(subscriptions);
  const yearlyTotal = computeYearlyTotal(subscriptions);
  const upcomingRenewals = getUpcomingRenewals(subscriptions, 30, now);
  const activeSubscriptions = subscriptions.filter((s) => s.isActive === 1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.subtitle}>{formattedDate}</Text>
          </View>
          <View style={styles.headerRight}>
            {userAvatar ? (
              <TouchableOpacity
                style={styles.avatarBadge}
                onPress={() => router.push('/settings')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Profile avatar: ${userAvatar}`}
                testID="dashboard-avatar-badge"
              >
                <Text style={styles.avatarEmoji}>{userAvatar}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push('/settings')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Notifications and Settings"
              testID="dashboard-settings-button"
            >
              <MaterialIcons
                name="notifications-none"
                size={24}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Personalization Setup Card */}
        {isSetupIncomplete && (
          <View style={styles.setupCard} testID="dashboard-setup-card">
            <View style={styles.setupCardContent}>
              <Text style={styles.setupCardText}>
                👋 Personalize your tracker: Set default payment method & alias
              </Text>
              <TouchableOpacity
                style={styles.setupCardButton}
                onPress={() => router.push('/settings')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Set Up Now"
                testID="setup-card-button"
              >
                <Text style={styles.setupCardButtonText}>Set Up Now</Text>
                <MaterialIcons name="arrow-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Alert Banners */}
        {alerts.length > 0 && (
          <View style={styles.alertsContainer} testID="dashboard-alerts">
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
          <View style={styles.section} testID="dashboard-upcoming-section">
            <Text style={styles.sectionHeader}>Upcoming Renewals</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
              testID="dashboard-upcoming-scroll"
            >
              {upcomingRenewals.map((sub) => (
                <SubscriptionCard
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
        <View style={styles.section} testID="dashboard-active-section">
          <Text style={styles.sectionHeader}>Active Subscriptions</Text>
          {activeSubscriptions.length === 0 ? (
            <View style={styles.emptyCard} testID="dashboard-empty-state">
              <View style={styles.emptyIconCircle}>
                <MaterialIcons
                  name="playlist-add"
                  size={40}
                  color={COLORS.accentPurple}
                />
              </View>
              <Text style={styles.emptyTitle}>No active subscriptions</Text>
              <Text style={styles.emptySubtitle}>
                Track your subscriptions, upcoming renewals, and free trials in one place.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
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
                  style={styles.emptyButtonIcon}
                />
                <Text style={styles.emptyButtonText}>Add Subscription</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.activeList} testID="dashboard-active-list">
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

      {/* Floating Action Button */}
      <FAB
        onPress={() => router.push('/subscription/new')}
        testID="dashboard-fab"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(123, 94, 167, 0.18)',
    borderWidth: 1.5,
    borderColor: COLORS.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  setupCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(123, 94, 167, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    padding: 14,
  },
  setupCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  setupCardText: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
    fontWeight: '500',
  },
  setupCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentPurple,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  setupCardButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  horizontalScrollContent: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  activeList: {
    paddingHorizontal: 16,
  },
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.bgSurface,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(123, 94, 167, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 260,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentPurple,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 9999,
  },
  emptyButtonIcon: {
    marginRight: 6,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});