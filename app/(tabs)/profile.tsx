import React, { useCallback, useMemo, useState } from "react";
import { LogBox, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { VictoryPie } from "victory-native";

LogBox.ignoreLogs([
  "Support for defaultProps will be removed",
  "VictoryPie: Support for defaultProps",
]);

import { COLORS } from "@/constants/colors";
import { useAppTheme } from "@/constants/theme";
import { AppIcon } from "@/components/AppIcon";
import { getCategoryByKey } from "@/constants/categories";
import type { Subscription } from "@/db/schema";
import {
  computeCategoryBreakdown,
  computeMonthlyTotal,
  computeYearlyTotal,
  toMonthlyAmount,
} from "@/services/analyticsService";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { StatCard, CategoryProgressBar, UserAvatar } from "@/components";

export type PeriodType = "monthly" | "quarterly" | "yearly";

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const loadSubscriptions = useSubscriptionStore(
    (state) => state.loadSubscriptions,
  );
  const getSetting = useSettingsStore((state) => state.getSetting);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  useSettingsStore((state) => state.cache);

  const [period, setPeriod] = useState<PeriodType>("monthly");

  useFocusEffect(
    useCallback(() => {
      loadSubscriptions();
      loadSettings();
    }, [loadSubscriptions, loadSettings]),
  );

  const currency = getSetting("default_currency", "USD");
  const userAvatar = getSetting("user_avatar", "space");
  const userName = getSetting("user_name", "SignalSub Member");

  const activeSubs = useMemo(() => {
    return subscriptions.filter((s) => s.isActive === 1);
  }, [subscriptions]);

  const stats = useMemo(() => {
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
  }, [activeSubs]);

  const breakdown = useMemo(() => {
    return computeCategoryBreakdown(activeSubs);
  }, [activeSubs]);

  const periodMultiplier =
    period === "quarterly" ? 3 : period === "yearly" ? 12 : 1;
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
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.bgPrimary }}
    >
      {/* Header */}
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold font-heading text-white">
          Profile & Analytics
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          className="w-10 h-10 rounded-full bg-card border border-surface items-center justify-center"
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open Settings"
          testID="profile-settings-btn"
        >
          <AppIcon name="settings" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View className="mx-4 mt-2 mb-4 p-4 rounded-2xl bg-card border border-surface flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <UserAvatar avatarId={userAvatar} size={52} />
            <View>
              <Text className="text-base font-bold font-heading text-white">
                {userName}
              </Text>
              <Text className="text-xs text-muted font-body mt-0.5">
                {activeSubs.length} active{" "}
                {activeSubs.length === 1 ? "subscription" : "subscriptions"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            className="py-1.5 px-3 rounded-full bg-surface border border-[#A78BFA]/30 flex-row items-center gap-1"
            activeOpacity={0.7}
          >
            <Text className="text-xs font-semibold text-[#A78BFA] font-heading">
              Settings
            </Text>
            <AppIcon
              name="chevron-right"
              size={16}
              color="#A78BFA"
              strokeWidth={2.2}
            />
          </TouchableOpacity>
        </View>

        {/* Analytics Section Header */}
        <View className="px-4 mt-2 mb-2">
          <Text className="text-lg font-bold font-heading text-white">
            Spending Analytics
          </Text>
        </View>

        {/* Period Selector */}
        <View
          className="flex-row bg-card rounded-xl mx-4 mb-4 p-1 border border-surface"
          testID="period-selector"
        >
          {(["monthly", "quarterly", "yearly"] as const).map((p) => {
            const isSelected = period === p;
            const label =
              p === "monthly"
                ? "Monthly"
                : p === "quarterly"
                  ? "Quarterly"
                  : "Yearly";
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                className={`flex-1 py-2 items-center justify-center rounded-lg ${
                  isSelected ? "bg-primary" : ""
                }`}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                testID={`period-${p}`}
              >
                <Text
                  className={`text-[13px] font-semibold font-heading ${
                    isSelected ? "text-white" : "text-muted"
                  }`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeSubs.length === 0 ? (
          <View
            className="bg-card rounded-2xl p-6 mx-4 mt-2 items-center justify-center border border-surface"
            testID="analytics-empty-state"
          >
            <View className="w-16 h-16 rounded-full bg-primary/15 items-center justify-center mb-4">
              <AppIcon name="chart" size={38} color={COLORS.accentPurple} />
            </View>
            <Text className="text-base font-bold font-heading text-white mb-2 text-center">
              No active subscriptions
            </Text>
            <Text className="text-[13px] text-muted text-center leading-[18px] max-w-[260px] mb-5 font-body">
              Add active subscriptions to view your spending intelligence,
              category breakdown, and monthly trends.
            </Text>
            <TouchableOpacity
              className="flex-row items-center justify-center bg-primary py-3.5 px-6 rounded-full shadow-lg shadow-purple-900/40 gap-2 mt-1"
              onPress={() => router.push("/subscription/new")}
              activeOpacity={0.8}
              testID="empty-state-add-btn"
            >
              <AppIcon
                name="plus"
                size={18}
                color="#FFFFFF"
                strokeWidth={2.5}
              />
              <Text className="text-sm font-heading font-bold text-white">
                Add Subscription
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-4" testID="analytics-content">
            {/* StatCards Row */}
            <View className="flex-row gap-2 mb-5" testID="analytics-stats-row">
              <StatCard
                label={
                  period === "monthly"
                    ? "Monthly Total"
                    : period === "quarterly"
                      ? "Quarterly Total"
                      : "Yearly Total"
                }
                value={`${currency} ${periodTotal.toFixed(2)}`}
                subtitle={
                  period !== "monthly"
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
              <Text className="text-base font-bold font-heading text-white mb-3">
                Spending by Category
              </Text>

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
                ) : null}
                <View className="absolute items-center justify-center pointer-events-none">
                  <Text className="text-xs text-muted font-body">Total</Text>
                  <Text className="text-lg font-bold font-heading text-white mt-0.5">
                    {currency} {periodTotal.toFixed(0)}
                  </Text>
                </View>
              </View>

              {/* Breakdown List */}
              <View className="bg-card rounded-2xl p-4 border border-surface">
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
                    />
                  );
                })}
              </View>
            </View>

            {/* Extremes (Highest & Lowest) */}
            {stats.mostExpensive && (
              <View className="mb-6">
                <Text className="text-base font-bold font-heading text-white mb-3">
                  Subscription Insights
                </Text>
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-card rounded-2xl p-4 border border-surface">
                    <Text className="text-xs text-muted font-body mb-1">
                      Highest Cost
                    </Text>
                    <Text
                      className="text-sm font-bold text-white font-heading"
                      numberOfLines={1}
                    >
                      {stats.mostExpensive.name}
                    </Text>
                    <Text className="text-sm font-semibold text-accentPurpleLight font-heading mt-1">
                      {currency} {stats.mostExpensive.amount.toFixed(2)} /{" "}
                      {stats.mostExpensive.billingCycle}
                    </Text>
                  </View>
                  {stats.cheapest && (
                    <View className="flex-1 bg-card rounded-2xl p-4 border border-surface">
                      <Text className="text-xs text-muted font-body mb-1">
                        Lowest Cost
                      </Text>
                      <Text
                        className="text-sm font-bold text-white font-heading"
                        numberOfLines={1}
                      >
                        {stats.cheapest.name}
                      </Text>
                      <Text className="text-sm font-semibold text-accentPurpleLight font-heading mt-1">
                        {currency} {stats.cheapest.amount.toFixed(2)} /{" "}
                        {stats.cheapest.billingCycle}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Quick Settings Section */}
        <View className="px-4 mt-2">
          <Text className="text-base font-bold font-heading text-white mb-3">
            Preferences & Controls
          </Text>
          <View className="bg-card rounded-2xl border border-surface overflow-hidden">
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className="flex-row items-center justify-between p-4 border-b border-surface"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                  <AppIcon
                    name="dollar"
                    size={18}
                    color={COLORS.accentPurpleLight}
                    strokeWidth={2.5}
                  />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-white font-heading">
                    Default Currency
                  </Text>
                  <Text className="text-xs text-muted font-body">
                    {currency}
                  </Text>
                </View>
              </View>
              <AppIcon
                name="chevron-right"
                size={18}
                color="#94A3B8"
                strokeWidth={2}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className="flex-row items-center justify-between p-4 border-b border-surface"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                  <AppIcon
                    name="bell"
                    size={18}
                    color={COLORS.accentPurpleLight}
                  />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-white font-heading">
                    Notifications & Reminders
                  </Text>
                  <Text className="text-xs text-muted font-body">
                    Manage renewal alerts
                  </Text>
                </View>
              </View>
              <AppIcon
                name="chevron-right"
                size={18}
                color="#94A3B8"
                strokeWidth={2}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className="flex-row items-center justify-between p-4"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                  <AppIcon
                    name="slider"
                    size={18}
                    color={COLORS.accentPurpleLight}
                    strokeWidth={2.2}
                  />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-white font-heading">
                    Theme & Personalization
                  </Text>
                  <Text className="text-xs text-muted font-body">
                    Avatar, dark theme, OLED
                  </Text>
                </View>
              </View>
              <AppIcon
                name="chevron-right"
                size={18}
                color="#94A3B8"
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
