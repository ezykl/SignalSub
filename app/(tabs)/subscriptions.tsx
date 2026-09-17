import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { CATEGORIES } from '@/constants/categories';
import type { Subscription } from '@/db/schema';
import { toMonthlyAmount } from '@/services/analyticsService';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { SubscriptionRow } from '@/components';

export const FILTER_TABS = [
  'All',
  'Active',
  'Trials',
  'Paused',
  'Cancelled',
  ...CATEGORIES.map((c) => c.label),
];

export const FILTER_OPTIONS = FILTER_TABS;

export function filterSubscriptions(
  subscriptions: Subscription[],
  searchQuery: string,
  filter: string
): Subscription[] {
  let list = subscriptions;

  const normalizedFilter = (filter || 'All').trim().toLowerCase();
  if (normalizedFilter === 'active') {
    list = list.filter((s) => s.isActive === 1 && s.status !== 'cancelled');
  } else if (normalizedFilter === 'trials') {
    list = list.filter((s) => s.isTrial === 1);
  } else if (normalizedFilter === 'paused') {
    list = list.filter((s) => s.isActive === 0 && s.status !== 'cancelled');
  } else if (normalizedFilter === 'cancelled') {
    list = list.filter((s) => s.status === 'cancelled');
  } else if (normalizedFilter !== 'all') {
    list = list.filter((s) => (s.category || '').toLowerCase() === normalizedFilter);
  }

  const query = searchQuery.trim().toLowerCase();
  if (query) {
    list = list.filter((s) => s.name.toLowerCase().includes(query));
  }

  return list;
}

export default function SubscriptionsScreen() {
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
  const reactivateSubscription = useSubscriptionStore(
    (state) => state.reactivateSubscription
  );
  const getSetting = useSettingsStore((state) => state.getSetting);
  const currency = getSetting('default_currency', '$');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  useFocusEffect(
    useCallback(() => {
      loadSubscriptions();
    }, [loadSubscriptions])
  );

  const totalMonthlySaved = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === 'cancelled')
      .reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.billingCycle), 0);
  }, [subscriptions]);

  const activeCount = useMemo(() => {
    return subscriptions.filter(
      (s) => s.isActive === 1 && s.status !== 'cancelled'
    ).length;
  }, [subscriptions]);

  const activeMonthlySpend = useMemo(() => {
    return subscriptions
      .filter((s) => s.isActive === 1 && s.status !== 'cancelled')
      .reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.billingCycle), 0);
  }, [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    return filterSubscriptions(subscriptions, searchQuery, selectedFilter);
  }, [subscriptions, searchQuery, selectedFilter]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-3 pb-2">
        <Text className="text-2xl font-heading font-bold text-white">Subscriptions</Text>
        <Text className="text-[13px] font-body text-muted mt-1">
          {activeCount} Active ·{' '}
          <Text className="text-purple-300 font-heading font-bold">
            {currency} {activeMonthlySpend.toFixed(2)}/mo
          </Text>
        </Text>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center bg-[#1A1A2E]/75 rounded-[14px] mx-4 mt-2 mb-3 px-3.5 h-12 border border-white/[0.08]">
        <MaterialIcons
          name="search"
          size={20}
          color={COLORS.textSecondary}
          style={{ marginRight: 8 }}
        />
        <TextInput
          className="flex-1 text-white font-body text-[15px] h-full p-0"
          placeholder="Search subscriptions..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          testID="subscriptions-search-input"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            className="p-1"
            testID="subscriptions-search-clear"
          >
            <MaterialIcons
              name="close"
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View className="mb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          testID="subscriptions-filter-chips"
        >
          {FILTER_OPTIONS.map((option) => {
            const isActive = selectedFilter === option;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => setSelectedFilter(option)}
                className={`py-[7px] px-3.5 rounded-full border ${
                  isActive
                    ? 'bg-primary border-primary'
                    : 'bg-[#1A1A2E]/75 border-white/[0.08]'
                }`}
                activeOpacity={0.7}
                testID={`filter-chip-${option.toLowerCase()}`}
              >
                <Text
                  className={`text-[13px] font-heading font-semibold ${
                    isActive ? 'text-white' : 'text-muted'
                  }`}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Subscriptions List / Empty State */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Savings banner when Cancelled filter is selected */}
        {selectedFilter === 'Cancelled' && (
          <View className="bg-green-500/10 border border-green-500 rounded-xl py-3 px-4 mx-4 mb-3 items-center justify-center" testID="cancelled-savings-banner">
            <Text className="text-sm font-heading font-bold text-green-500 text-center" testID="cancelled-savings-text">
              {`🎉 You're saving ${currency === '$' || !currency ? '$' : `${currency} `}${totalMonthlySaved.toFixed(2)}/mo by cancelling unneeded subs`}
            </Text>
          </View>
        )}

        {filteredSubscriptions.length === 0 ? (
          <View className="bg-[#1A1A2E]/75 rounded-2xl p-6 mx-4 mt-6 items-center justify-center border border-white/[0.08]" testID="subscriptions-empty-state">
            <View className="w-16 h-16 rounded-full bg-primary/15 items-center justify-center mb-4">
              <MaterialIcons
                name="search-off"
                size={40}
                color={COLORS.accentPurple}
              />
            </View>
            <Text className="text-base font-heading font-bold text-white mb-2 text-center">No subscriptions found</Text>
            <Text className="text-[13px] font-body text-muted text-center leading-[18px] mb-5 max-w-[260px]">
              {searchQuery.length > 0 || selectedFilter !== 'All'
                ? 'Try adjusting your search or filters.'
                : 'You have not added any subscriptions yet.'}
            </Text>
            <TouchableOpacity
              className="flex-row items-center bg-primary py-2.5 px-4.5 rounded-full"
              onPress={() => router.push('/subscription/new')}
              activeOpacity={0.8}
              testID="empty-state-add-btn"
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
          <View className="px-4" testID="subscriptions-list">
            {filteredSubscriptions.map((sub) => (
              <SubscriptionRow
                key={sub.id}
                subscription={sub}
                onPress={() => router.push(`/subscription/${sub.id}`)}
                onDelete={() => deleteSubscription(sub.id)}
                onPause={() =>
                  pauseSubscription(sub.id, sub.isActive === 1)
                }
                onReactivate={() => reactivateSubscription(sub.id)}
                testID={`sub-row-${sub.id}`}
              />
            ))}
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}
