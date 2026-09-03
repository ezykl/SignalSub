import React, { useCallback, useState } from 'react';
import {
  Modal,
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
  UserAvatar,
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
                accessibilityLabel={`Profile avatar`}
                testID="dashboard-avatar-badge"
              >
                <UserAvatar avatarId={userAvatar} size={38} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => setIsAlertsModalVisible(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Notifications and Alerts"
              testID="dashboard-settings-button"
            >
              <MaterialIcons
                name={alerts.length > 0 ? 'notifications-active' : 'notifications-none'}
                size={24}
                color={alerts.length > 0 ? COLORS.accentPurpleLight : COLORS.textPrimary}
              />
              {alerts.length > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{alerts.length}</Text>
                </View>
              )}
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

        {/* Trial Expiry Prompt Cards */}
        {expiringTrials.length > 0 && (
          <View style={styles.trialPromptContainer} testID="dashboard-trial-expiry-container">
            {expiringTrials.map((sub) => {
              const days = daysUntil(sub.trialEndDate!, now);
              const endsLabel = days === 0 ? 'today' : 'tomorrow';
              return (
                <View
                  key={`trial-expiry-${sub.id}`}
                  style={styles.trialPromptCard}
                  testID={`trial-expiry-card-${sub.id}`}
                >
                  <View style={styles.trialPromptHeader}>
                    <Text style={styles.trialPromptTitle} testID="trial-expiry-title">
                      ⚠️ Free Trial Ending
                    </Text>
                  </View>
                  <Text style={styles.trialPromptSubtitle} testID="trial-expiry-subtitle">
                    {`${sub.name} trial ends ${endsLabel}. Auto-charge of ${sub.currency} ${sub.amount} will occur.`}
                  </Text>
                  <View style={styles.trialPromptButtons}>
                    <TouchableOpacity
                      style={styles.trialPromptCancelButton}
                      onPress={() =>
                        useSubscriptionStore.getState().cancelSubscription(sub.id)
                      }
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`I Cancelled ${sub.name}`}
                      testID={`trial-expiry-cancelled-btn-${sub.id}`}
                    >
                      <Text style={styles.trialPromptCancelText}>I Cancelled It</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.trialPromptKeepButton}
                      onPress={() =>
                        setDismissedTrials((prev) => ({
                          ...prev,
                          [sub.id]: todayStr,
                        }))
                      }
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Keep ${sub.name} Active`}
                      testID={`trial-expiry-keep-btn-${sub.id}`}
                    >
                      <Text style={styles.trialPromptKeepText}>Keep Active</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
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

      {/* Renewal Alerts & Notifications Modal */}
      <Modal
        visible={isAlertsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAlertsModalVisible(false)}
        testID="dashboard-alerts-modal"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <MaterialIcons name="notifications-active" size={22} color={COLORS.accentPurple} />
                <Text style={styles.modalTitle}>Renewal Alerts</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAlertsModalVisible(false)}
                style={styles.modalCloseBtn}
                testID="alerts-modal-close-button"
              >
                <MaterialIcons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {alerts.length > 0 ? (
              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                {alerts.map((alert: DashboardAlert) => (
                  <TouchableOpacity
                    key={alert.id}
                    style={styles.modalAlertItem}
                    onPress={() => {
                      setIsAlertsModalVisible(false);
                      router.push(`/subscription/${alert.subscriptionId}`);
                    }}
                    activeOpacity={0.7}
                    testID={`alerts-modal-item-${alert.id}`}
                  >
                    <View
                      style={[
                        styles.modalAlertIconBox,
                        {
                          backgroundColor:
                            alert.type === 'trial'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(123, 94, 167, 0.15)',
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={alert.type === 'trial' ? 'timer' : 'event'}
                        size={20}
                        color={alert.type === 'trial' ? COLORS.warning : COLORS.accentPurple}
                      />
                    </View>
                    <View style={styles.modalAlertTextCol}>
                      <Text style={styles.modalAlertMessage}>{alert.message}</Text>
                      <Text style={styles.modalAlertAction}>Tap to view subscription →</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.modalEmptyContainer} testID="alerts-modal-empty">
                <MaterialIcons name="check-circle" size={44} color={COLORS.success} />
                <Text style={styles.modalEmptyTitle}>You're All Caught Up!</Text>
                <Text style={styles.modalEmptySubtitle}>
                  No renewal or trial alerts scheduled within the next 3 days.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalSettingsLink}
              onPress={() => {
                setIsAlertsModalVisible(false);
                router.push('/settings');
              }}
              activeOpacity={0.8}
              testID="alerts-modal-settings-link"
            >
              <MaterialIcons name="tune" size={18} color={COLORS.textSecondary} />
              <Text style={styles.modalSettingsLinkText}>Configure Notification Settings</Text>
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
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.bgPrimary,
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
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
  trialPromptContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  trialPromptCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.warning,
    padding: 16,
    marginBottom: 12,
  },
  trialPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  trialPromptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.warning,
  },
  trialPromptSubtitle: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 14,
  },
  trialPromptButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  trialPromptCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trialPromptCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
  },
  trialPromptKeepButton: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trialPromptKeepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheetContainer: {
    backgroundColor: '#161626',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(123, 94, 167, 0.25)',
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalList: {
    marginTop: 14,
    maxHeight: 320,
  },
  modalAlertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalAlertIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalAlertTextCol: {
    flex: 1,
  },
  modalAlertMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  modalAlertAction: {
    fontSize: 12,
    color: COLORS.accentPurpleLight,
    marginTop: 3,
  },
  modalEmptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  modalEmptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  modalSettingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalSettingsLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});