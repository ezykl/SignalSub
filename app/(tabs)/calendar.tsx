import React, { useCallback, useMemo, useState } from 'react';
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
import { parseDateParts } from '@/services/renewalService';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

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

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatCalendarDateHeader(dateStr: string): string {
  const parts = parseDateParts(dateStr);
  const d = new Date(parts.year, parts.month - 1, parts.day);
  const dayName = DAYS_SHORT[d.getDay()];
  const monthName = MONTHS_SHORT[parts.month - 1];
  return `${dayName}, ${monthName} ${parts.day}`;
}

export interface DateGroup {
  date: string;
  formattedDate: string;
  subscriptions: Subscription[];
}

export function groupRenewalsByDate(
  subscriptions: Subscription[],
  year: number,
  month: number // 0-indexed (0 = Jan, 11 = Dec)
): { groups: DateGroup[]; totalCount: number; totalSpend: number } {
  const activeSubs = subscriptions.filter(
    (s) => s.isActive === 1 && s.nextRenewalDate
  );

  const dateMap = new Map<string, Subscription[]>();
  let totalSpend = 0;
  let totalCount = 0;

  for (const sub of activeSubs) {
    try {
      const parts = parseDateParts(sub.nextRenewalDate);
      if (parts.year === year && parts.month === month + 1) {
        const dateKey = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
        const existing = dateMap.get(dateKey) || [];
        existing.push(sub);
        dateMap.set(dateKey, existing);
        totalSpend += sub.amount ?? 0;
        totalCount += 1;
      }
    } catch {
      // skip invalid dates
    }
  }

  const sortedDates = Array.from(dateMap.keys()).sort();
  const groups: DateGroup[] = sortedDates.map((date) => ({
    date,
    formattedDate: formatCalendarDateHeader(date),
    subscriptions: (dateMap.get(date) || []).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  }));

  return { groups, totalCount, totalSpend };
}

export interface CalendarScreenProps {
  initialDate?: Date;
}

export default function CalendarScreen({ initialDate }: CalendarScreenProps = {}) {
  const router = useRouter();
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const loadSubscriptions = useSubscriptionStore(
    (state) => state.loadSubscriptions
  );
  const getSetting = useSettingsStore((state) => state.getSetting);
  const currency = getSetting('default_currency', 'USD');

  useFocusEffect(
    useCallback(() => {
      loadSubscriptions();
    }, [loadSubscriptions])
  );

  const now = initialDate ?? new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const { groups, totalCount, totalSpend } = useMemo(() => {
    return groupRenewalsByDate(subscriptions, selectedYear, selectedMonth);
  }, [subscriptions, selectedYear, selectedMonth]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
      </View>

      {/* Month Selector */}
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          style={styles.navButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          testID="calendar-prev-month"
        >
          <MaterialIcons
            name="chevron-left"
            size={28}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.monthCenter}>
          <Text style={styles.monthTitle} testID="calendar-month-year">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </Text>
          <Text style={styles.monthSubtitle} testID="calendar-summary">
            {totalCount} {totalCount === 1 ? 'renewal' : 'renewals'} · {currency}{' '}
            {totalSpend.toFixed(2)} this month
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNextMonth}
          style={styles.navButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          testID="calendar-next-month"
        >
          <MaterialIcons
            name="chevron-right"
            size={28}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Timeline / Empty State */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groups.length === 0 ? (
          <View style={styles.emptyCard} testID="calendar-empty-state">
            <View style={styles.emptyIconCircle}>
              <MaterialIcons
                name="event-available"
                size={40}
                color={COLORS.accentPurple}
              />
            </View>
            <Text style={styles.emptyTitle}>No renewals this month</Text>
            <Text style={styles.emptySubtitle}>
              You don&apos;t have any active subscriptions renewing in{' '}
              {MONTH_NAMES[selectedMonth]} {selectedYear}.
            </Text>
          </View>
        ) : (
          <View style={styles.timelineContainer} testID="calendar-timeline">
            {groups.map((group) => (
              <View key={group.date} style={styles.dateSection}>
                <View style={styles.dateHeaderRow}>
                  <View style={styles.dateDot} />
                  <Text style={styles.dateHeaderText}>
                    {group.formattedDate}
                  </Text>
                </View>

                {group.subscriptions.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      styles.card,
                      {
                        borderLeftColor:
                          sub.color || COLORS.accentPurple,
                      },
                    ]}
                    onPress={() => router.push(`/subscription/${sub.id}`)}
                    activeOpacity={0.7}
                    testID={`calendar-card-${sub.id}`}
                  >
                    <View style={styles.cardLeft}>
                      <Text style={styles.subName} numberOfLines={1}>
                        {sub.name}
                      </Text>
                      {sub.category ? (
                        <Text style={styles.subCategory} numberOfLines={1}>
                          {sub.category}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.cardRight}>
                      <Text style={styles.subAmount}>
                        {sub.currency || currency}{' '}
                        {(sub.amount ?? 0).toFixed(2)}
                      </Text>
                      {sub.billingCycle ? (
                        <Text style={styles.subBillingCycle}>
                          /{sub.billingCycle}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 26, 46, 0.75)',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  monthCenter: {
    flex: 1,
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  monthSubtitle: {
    fontSize: 12,
    color: COLORS.accentPurpleLight,
    marginTop: 3,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  timelineContainer: {
    paddingHorizontal: 16,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentPurple,
    marginRight: 8,
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: 'rgba(26, 26, 46, 0.75)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flex: 1,
    marginRight: 8,
  },
  subName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  subCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  subAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subBillingCycle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: 'rgba(26, 26, 46, 0.75)',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    maxWidth: 260,
  },
});
