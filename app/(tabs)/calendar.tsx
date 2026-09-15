import React, { useCallback, useMemo, useState } from 'react';
import {
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
import { parseDateParts } from '@/services/renewalService';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { BrandIcon } from '@/components';

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
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-3 pb-1">
        <Text className="text-2xl font-bold font-heading text-white">Calendar</Text>
      </View>

      {/* Month Selector */}
      <View className="flex-row items-center justify-between bg-[#1A1A2E]/75 mx-4 mt-2 mb-4 py-3.5 px-3 rounded-2xl border border-white/[0.08]">
        <TouchableOpacity
          onPress={handlePrevMonth}
          className="w-11 h-11 rounded-full items-center justify-center bg-white/[0.04]"
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

        <View className="flex-1 items-center">
          <Text className="text-[17px] font-bold font-heading text-white" testID="calendar-month-year">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </Text>
          <Text className="text-xs text-purple-300 mt-0.5 font-medium font-body" testID="calendar-summary">
            {totalCount} {totalCount === 1 ? 'renewal' : 'renewals'} · {currency}{' '}
            {totalSpend.toFixed(2)} this month
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNextMonth}
          className="w-11 h-11 rounded-full items-center justify-center bg-white/[0.04]"
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
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {groups.length === 0 ? (
          <View className="bg-[#1A1A2E]/75 rounded-2xl p-6 mx-4 mt-6 items-center justify-center border border-white/[0.08]" testID="calendar-empty-state">
            <View className="w-16 h-16 rounded-full bg-primary/15 items-center justify-center mb-4">
              <MaterialIcons
                name="event-available"
                size={40}
                color={COLORS.accentPurple}
              />
            </View>
            <Text className="text-base font-bold font-heading text-white mb-2 text-center">No renewals this month</Text>
            <Text className="text-[13px] text-muted text-center leading-[18px] max-w-[260px] font-body">
              You don&apos;t have any active subscriptions renewing in{' '}
              {MONTH_NAMES[selectedMonth]} {selectedYear}.
            </Text>
          </View>
        ) : (
          <View className="px-4" testID="calendar-timeline">
            {groups.map((group) => (
              <View key={group.date} className="mb-5">
                <View className="flex-row items-center mb-2">
                  <View className="w-2 h-2 rounded-full bg-primary mr-2" />
                  <Text className="text-sm font-bold font-heading text-muted uppercase tracking-wider">
                    {group.formattedDate}
                  </Text>
                </View>

                {group.subscriptions.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    className="bg-[#1A1A2E]/75 rounded-[14px] p-3.5 mb-2 border-l-[3px] border border-white/[0.06] flex-row items-center justify-between"
                    style={{
                      borderLeftColor:
                        sub.color || COLORS.accentPurple,
                    }}
                    onPress={() => router.push(`/subscription/${sub.id}`)}
                    activeOpacity={0.7}
                    testID={`calendar-card-${sub.id}`}
                  >
                    <View className="flex-1 flex-row items-center mr-2">
                      <BrandIcon
                        name={sub.name}
                        iconType={sub.iconType}
                        iconValue={sub.iconValue}
                        size={36}
                        iconSize={20}
                        color="rgba(123, 94, 167, 0.15)"
                        iconColor={sub.color || COLORS.accentPurple}
                        className="mr-3"
                      />
                      <View className="flex-1">
                        <Text className="text-[15px] font-semibold font-heading text-white" numberOfLines={1}>
                          {sub.name}
                        </Text>
                        {sub.category ? (
                          <Text className="text-xs text-muted mt-0.5 capitalize font-body" numberOfLines={1}>
                            {sub.category}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-[15px] font-bold font-heading text-white">
                        {sub.currency || currency}{' '}
                        {(sub.amount ?? 0).toFixed(2)}
                      </Text>
                      {sub.billingCycle ? (
                        <Text className="text-[11px] text-muted mt-0.5 font-body">
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
