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
import { VictoryPie } from 'victory-native';
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodSelectorContainer} testID="period-selector">
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
                style={[
                  styles.periodTab,
                  isSelected && styles.periodTabActive,
                ]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                testID={`period-${p}`}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    isSelected && styles.periodTabTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeSubs.length === 0 ? (
          <View style={styles.emptyCard} testID="analytics-empty-state">
            <View style={styles.emptyIconCircle}>
              <MaterialIcons
                name="bar-chart"
                size={40}
                color={COLORS.accentPurple}
              />
            </View>
            <Text style={styles.emptyTitle}>No active subscriptions</Text>
            <Text style={styles.emptySubtitle}>
              Add active subscriptions to view your spending intelligence,
              category breakdown, and extremes.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/subscription/new')}
              activeOpacity={0.8}
              testID="analytics-empty-add-btn"
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
          <View style={styles.contentContainer} testID="analytics-content">
            {/* StatCards Row */}
            <View style={styles.statsRow} testID="analytics-stats-row">
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
                style={styles.statCard}
                testID="stat-monthly-total"
              />
              <StatCard
                label="Yearly Projection"
                value={`${currency} ${stats.yearly.toFixed(2)}`}
                style={styles.statCard}
                testID="stat-yearly-projection"
              />
              <StatCard
                label="Avg / Sub"
                value={`${currency} ${stats.avgPerSub.toFixed(2)}`}
                subtitle={`${activeSubs.length} active`}
                style={styles.statCard}
                testID="stat-avg-per-sub"
              />
            </View>

            {/* Category Breakdown Section */}
            <View style={styles.section} testID="category-breakdown-section">
              <Text style={styles.sectionTitle}>Spending by Category</Text>

              {/* VictoryPie Donut Chart */}
              <View
                style={styles.chartContainer}
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
                    style={styles.chartPlaceholder}
                    testID="chart-fallback"
                  />
                )}
                <View style={styles.donutCenter} pointerEvents="none">
                  <Text style={styles.donutCenterLabel}>Total / mo</Text>
                  <Text style={styles.donutCenterValue}>
                    {currency} {stats.monthly.toFixed(0)}
                  </Text>
                </View>
              </View>

              {/* Category List */}
              <View style={styles.categoryList} testID="category-list">
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
              <View style={styles.section} testID="insights-section">
                <Text style={styles.sectionTitle}>Insights & Extremes</Text>
                <View style={styles.extremesRow}>
                  {stats.mostExpensive && (
                    <StatCard
                      label="Most Expensive"
                      value={stats.mostExpensive.name}
                      subtitle={`${currency} ${toMonthlyAmount(
                        stats.mostExpensive.amount,
                        stats.mostExpensive.billingCycle
                      ).toFixed(2)}/mo`}
                      style={styles.extremeCard}
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
                      style={styles.extremeCard}
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
  periodSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.bgSurface,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: COLORS.accentPurple,
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  periodTabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.bgSurface,
    marginBottom: 12,
  },
  chartPlaceholder: {
    width: 240,
    height: 240,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  donutCenterValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  categoryList: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.bgSurface,
  },
  categoryRowWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgSurface,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryProgressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  categoryCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  categoryAmountSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: 'normal',
  },
  extremesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  extremeCard: {
    flex: 1,
  },
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 24,
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
    maxWidth: 260,
    marginBottom: 20,
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
