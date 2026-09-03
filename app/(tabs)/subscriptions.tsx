import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
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
import { FAB, SubscriptionRow } from '@/components';

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

  const filteredSubscriptions = useMemo(() => {
    return filterSubscriptions(subscriptions, searchQuery, selectedFilter);
  }, [subscriptions, searchQuery, selectedFilter]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscriptions</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color={COLORS.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
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
            style={styles.clearButton}
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
      <View style={styles.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
          testID="subscriptions-filter-chips"
        >
          {FILTER_OPTIONS.map((option) => {
            const isActive = selectedFilter === option;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => setSelectedFilter(option)}
                style={[
                  styles.chip,
                  isActive ? styles.chipActive : styles.chipInactive,
                ]}
                activeOpacity={0.7}
                testID={`filter-chip-${option.toLowerCase()}`}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive ? styles.chipTextActive : styles.chipTextInactive,
                  ]}
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
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Savings banner when Cancelled filter is selected */}
        {selectedFilter === 'Cancelled' && (
          <View style={styles.savingsBanner} testID="cancelled-savings-banner">
            <Text style={styles.savingsText} testID="cancelled-savings-text">
              {`🎉 You're saving ${currency === '$' || !currency ? '$' : `${currency} `}${totalMonthlySaved.toFixed(2)}/mo by cancelling unneeded subs`}
            </Text>
          </View>
        )}

        {filteredSubscriptions.length === 0 ? (
          <View style={styles.emptyCard} testID="subscriptions-empty-state">
            <View style={styles.emptyIconCircle}>
              <MaterialIcons
                name="search-off"
                size={40}
                color={COLORS.accentPurple}
              />
            </View>
            <Text style={styles.emptyTitle}>No subscriptions found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.length > 0 || selectedFilter !== 'All'
                ? 'Try adjusting your search or filters.'
                : 'You have not added any subscriptions yet.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/subscription/new')}
              activeOpacity={0.8}
              testID="empty-state-add-btn"
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
          <View style={styles.listContainer} testID="subscriptions-list">
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

      {/* Floating Action Button */}
      <FAB
        onPress={() => router.push('/subscription/new')}
        testID="subscriptions-fab"
      />
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
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.bgSurface,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  chipsWrapper: {
    marginBottom: 12,
  },
  chipsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 9999,
  },
  chipActive: {
    backgroundColor: COLORS.accentPurple,
  },
  chipInactive: {
    backgroundColor: COLORS.bgSurface,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipTextInactive: {
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  listContainer: {
    paddingHorizontal: 16,
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
  savingsBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: COLORS.success,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
    textAlign: 'center',
  },
});
