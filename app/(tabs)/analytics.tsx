import React, { useCallback, useMemo, useState } from 'react';
import {
  LogBox,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { VictoryPie } from 'victory-native';

LogBox.ignoreLogs([
  'Support for defaultProps will be removed',
  'VictoryPie: Support for defaultProps',
]);
import { COLORS } from '@/constants/colors';
import { getCategoryByKey } from '@/constants/categories';
import type { Subscription } from '@/db/schema';
import {
  computeCategoryBreakdown,
  computeMonthlyTotal,
  computeYearlyTotal,
  toMonthlyAmount,
} from '@/services/analyticsService';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { StatCard, CategoryProgressBar } from '@/components';

export type PeriodType = 'monthly' | 'quarterly' | 'yearly';

export interface AnalyticsStats {
  monthly: number;
  yearly: number;
  avgPerSub: number;
  mostExpensive: Subscription | null;
  cheapest: Subscription | null;
}

export function computeAnalyticsStats(activeSubs: Subscription[]): AnalyticsStats {
  const monthly = computeMonthlyTotal(activeSubs);
  const yearly = computeYearlyTotal(activeSubs);
  const avgPerSub = activeSubs.length > 0 ? monthly / activeSubs.length : 0;

  let mostExpensive: Subscription | null = null;
  let cheapest: Subscription | null = null;

  if (activeSubs.length > 0) {
    let maxMonthly = -1;
    let minMonthly = Infinity;

    for (const sub of activeSubs) {
      const m = toMonthlyAmount(sub.amount, sub.billingCycle);
      if (m > maxMonthly) {
        maxMonthly = m;
        mostExpensive = sub;
      }
      if (m < minMonthly) {
        minMonthly = m;
        cheapest = sub;
      }
    }
  }

  return { monthly, yearly, avgPerSub, mostExpensive, cheapest };
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const loadSubscriptions = useSubscriptionStore(
    (state) => state.loadSubscriptions
  );
  const getSetting = useSettingsStore((state) => state.getSetting);
  const currency = getSetting('default_currency', 'USD');

  const [period, setPeriod] = useState<PeriodType>('monthly');

  useFocusEffect(
    useCallback(() => {
      loadSubscriptions();
    }, [loadSubscriptions])
  );

  const activeSubs = useMemo(() => {
    return subscriptions.filter((s) => s.isActive === 1);
  }, [subscriptions]);

  const stats = useMemo(() => {
    return computeAnalyticsStats(activeSubs);
  }, [activeSubs]);

  const breakdown = useMemo(() => {
    return computeCategoryBreakdown(activeSubs);
  }, [activeSubs]);

  const periodMultiplier = period === 'quarterly' ? 3 : period === 'yearly' ? 12 : 1;
  const periodTotal = stats.monthly * periodMultiplier;

  const pieData = useMemo(() => {
    return breakdown.map((item) => ({
      x: getCategoryByKey(item.category).label,
      y: item.total,
    }));
  }, [breakdown]);

  const pieColors = useMemo(() => {
    return breakdown.map((item) => getCategoryByKey(item.category).color);
  }, [breakdown]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-3 pb-1">
        <Text className="text-2xl font-bold font-heading text-white">Analytics</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View className="flex-row bg-card rounded-xl mx-4 mt-2 mb-4 p-1 border border-surface" testID="period-selector">
          {(['monthly', 'quarterly', 'yearly'] as const).map((p) => {
            const isSelected = period === p;
            const label =
              p === 'monthly'
                ? 'Monthly'
                : p === 'quarterly'
                  ? 'Quarterly'
                  : 'Yearly';
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                className={`flex-1 py-2 items-center justify-center rounded-lg ${
                  isSelected ? 'bg-primary' : ''
                }`}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                testID={`period-${p}`}
              >
                <Text
                  className={`text-[13px] font-semibold font-heading ${
                    isSelected ? 'text-white' : 'text-muted'
                  }`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeSubs.length === 0 ? (
          <View className="bg-card rounded-2xl p-6 mx-4 mt-6 items-center justify-center border border-surface" testID="analytics-empty-state">
            <View className="w-16 h-16 rounded-full bg-primary/15 items-center justify-center mb-4">
              <MaterialIcons
                name="bar-chart"
                size={40}
                color={COLORS.accentPurple}
              />
            </View>
            <Text className="text-base font-bold font-heading text-white mb-2 text-center">No active subscriptions</Text>
            <Text className="text-[13px] text-muted text-center leading-[18px] max-w-[260px] mb-5 font-body">
              Add active subscriptions to view your spending intelligence,
              category breakdown, and extremes.
            </Text>
            <TouchableOpacity
              className="flex-row items-center bg-primary py-2.5 px-4.5 rounded-full"
              onPress={() => router.push('/subscription/new')}
              activeOpacity={0.8}
              testID="analytics-empty-add-btn"
            >
              <MaterialIcons
                name="add"
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text className="text-sm font-semibold font-heading text-white">Add Subscription</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-4" testID="analytics-content">
            {/* StatCards Row */}
            <View className="flex-row gap-2 mb-5" testID="analytics-stats-row">
              <StatCard
                label={
                  period === 'monthly'
                    ? 'Monthly Total'
                    : period === 'quarterly'
                      ? 'Quarterly Total'
                      : 'Yearly Total'
                }
                value={`${currency} ${periodTotal.toFixed(2)}`}
                subtitle={
                  period !== 'monthly'
                    ? `${currency} ${stats.monthly.toFixed(2)}/mo`
                    : undefined
                }
                className="flex-1 p-3"
                testID="stat-monthly-total"
              />
              <StatCard
                label="Yearly Projection"
                value={`${currency} ${stats.yearly.toFixed(2)}`}
                className="flex-1 p-3"
                testID="stat-yearly-projection"
              />
              <StatCard
                label="Avg / Sub"
                value={`${currency} ${stats.avgPerSub.toFixed(2)}`}
                subtitle={`${activeSubs.length} active`}
                className="flex-1 p-3"
                testID="stat-avg-per-sub"
              />
            </View>

            {/* Category Breakdown Section */}
            <View className="mb-6" testID="category-breakdown-section">
              <Text className="text-base font-bold font-heading text-white mb-3">Spending by Category</Text>

              {/* VictoryPie Donut Chart */}
              <View
                className="bg-card rounded-2xl items-center justify-center py-4 relative border border-surface mb-3"
                testID="analytics-chart-container"
              >
                {VictoryPie ? (
                  <VictoryPie
                    data={pieData}
                    width={260}
                    height={260}
                    innerRadius={65}
                    colorScale={pieColors}
                    labels={() => null}
                    padding={10}
                  />
                ) : (
                  <View
                    className="w-[240px] h-[240px]"
                    testID="chart-fallback"
                  />
                )}
                <View className="absolute items-center justify-center" pointerEvents="none">
                  <Text className="text-[11px] text-muted font-medium font-body uppercase">Total / mo</Text>
                  <Text className="text-lg font-bold font-heading text-white mt-0.5">
                    {currency} {stats.monthly.toFixed(0)}
                  </Text>
                </View>
              </View>

              {/* Category List */}
              <View className="bg-card rounded-2xl px-4 py-2 border border-surface" testID="category-list">
                {breakdown.map((item) => {
                  const cat = getCategoryByKey(item.category);
                  const percentageNum =
                    stats.monthly > 0 ? (item.total / stats.monthly) * 100 : 0;
                  return (
                    <CategoryProgressBar
                      key={item.category}
                      category={item.category}
                      categoryLabel={cat.label}
                      amount={item.total}
                      percentage={Math.round(percentageNum)}
                      color={cat.color}
                      currency={currency}
                      count={item.count}
                      testID={`category-row-${item.category}`}
                    />
                  );
                })}
              </View>
            </View>

            {/* Insights / Extremes Section */}
            {(stats.mostExpensive || stats.cheapest) && (
              <View className="mb-6" testID="insights-section">
                <Text className="text-base font-bold font-heading text-white mb-3">Insights & Extremes</Text>
                <View className="flex-row gap-3">
                  {stats.mostExpensive && (
                    <StatCard
                      label="Most Expensive"
                      value={stats.mostExpensive.name}
                      subtitle={`${currency} ${toMonthlyAmount(
                        stats.mostExpensive.amount,
                        stats.mostExpensive.billingCycle
                      ).toFixed(2)}/mo`}
                      className="flex-1"
                      testID="stat-most-expensive"
                    />
                  )}
                  {stats.cheapest && (
                    <StatCard
                      label="Cheapest"
                      value={stats.cheapest.name}
                      subtitle={`${currency} ${toMonthlyAmount(
                        stats.cheapest.amount,
                        stats.cheapest.billingCycle
                      ).toFixed(2)}/mo`}
                      className="flex-1"
                      testID="stat-cheapest"
                    />
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
