import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { POPULAR_CURRENCIES, CurrencyInfo } from '@/constants/currencies';
import { useSettingsStore } from '@/stores/settingsStore';
import { requestNotificationPermission } from '@/services/notificationService';

export default function CurrencyScreen() {
  const router = useRouter();
  const setSetting = useSettingsStore((state) => state.setSetting);

  const [selected, setSelected] = useState<string>('USD');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const filteredCurrencies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return POPULAR_CURRENCIES;

    return POPULAR_CURRENCIES.filter(
      (curr) =>
        curr.code.toLowerCase().includes(query) ||
        curr.name.toLowerCase().includes(query) ||
        curr.symbol.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleContinue = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await setSetting('default_currency', selected);
      await setSetting('has_onboarded', 'true');
      await requestNotificationPermission();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to finalize onboarding:', error);
      router.replace('/(tabs)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrencyItem = ({ item }: { item: CurrencyInfo }) => {
    const isSelected = item.code === selected;

    return (
      <TouchableOpacity
        testID={`currency-option-${item.code}`}
        style={[
          styles.currencyItem,
          isSelected ? styles.currencyItemSelected : styles.currencyItemUnselected,
        ]}
        onPress={() => setSelected(item.code)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${item.name} (${item.code})`}
      >
        <View style={styles.currencyLeft}>
          <Text style={styles.currencyFlag}>{item.flag}</Text>
          <View style={styles.currencyInfo}>
            <Text style={styles.currencyCode}>{item.code}</Text>
            <Text style={styles.currencyName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        </View>

        <View style={styles.currencyRight}>
          <Text
            style={[
              styles.currencySymbol,
              isSelected && { color: COLORS.accentPurpleLight },
            ]}
          >
            {item.symbol}
          </Text>
          {isSelected ? (
            <MaterialIcons
              name="check-circle"
              size={22}
              color={COLORS.accentPurpleLight}
            />
          ) : (
            <View style={styles.unselectedRadio} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>What currency do you use?</Text>
        <Text style={styles.subtitle}>
          Choose your primary currency for subscription tracking. You can change this anytime in Settings.
        </Text>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <MaterialIcons
            name="search"
            size={20}
            color={COLORS.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            testID="currency-search-input"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search currency (e.g. USD, EUR, PHP)"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="never"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              testID="clear-search-button"
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Currencies List */}
      <View style={styles.listContainer}>
        <FlatList
          data={filteredCurrencies}
          keyExtractor={(item) => item.code}
          renderItem={renderCurrencyItem}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons
                name="currency-usd-off"
                size={44}
                color={COLORS.textSecondary}
                style={{ opacity: 0.6, marginBottom: 8 }}
              />
              <Text style={styles.emptyStateText}>
                No currencies found matching &quot;{searchQuery}&quot;
              </Text>
            </View>
          }
        />
      </View>

      {/* Bottom CTA Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          testID="continue-button"
          style={[
            styles.continueButton,
            isSubmitting && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={isSubmitting}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Continue with ${selected}`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>
              Continue with {selected} →
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    padding: 0,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  currencyItemSelected: {
    borderColor: COLORS.accentPurple,
    backgroundColor: `${COLORS.accentPurple}33`,
  },
  currencyItemUnselected: {
    borderColor: 'transparent',
    backgroundColor: COLORS.bgCard,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  currencyFlag: {
    fontSize: 24,
    marginRight: 14,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  currencyName: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  currencyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  unselectedRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: COLORS.bgPrimary,
  },
  continueButton: {
    backgroundColor: COLORS.accentPurple,
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
