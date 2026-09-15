import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
      await requestNotificationPermission();
      router.push('/(onboarding)/personalize');
    } catch (error) {
      console.error('Failed to finalize onboarding:', error);
      router.push('/(onboarding)/personalize');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrencyItem = ({ item }: { item: CurrencyInfo }) => {
    const isSelected = item.code === selected;

    return (
      <TouchableOpacity
        testID={`currency-option-${item.code}`}
        className={`flex-row items-center justify-between py-3.5 px-4 my-1 rounded-[14px] border-[1.5px] ${
          isSelected
            ? 'border-primary bg-primary/20'
            : 'border-transparent bg-card'
        }`}
        onPress={() => setSelected(item.code)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${item.name} (${item.code})`}
      >
        <View className="flex-row items-center flex-1 mr-3">
          <Text className="text-2xl mr-3.5">{item.flag}</Text>
          <View className="flex-1">
            <Text className="text-base font-bold font-heading text-white mb-0.5">{item.code}</Text>
            <Text className="text-[13px] text-muted font-body" numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <Text
            className={`text-[15px] font-semibold font-heading ${
              isSelected ? 'text-purple-300' : 'text-muted'
            }`}
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
            <View className="w-5 h-5 rounded-full border-[1.5px] border-slate-400/30" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <Text className="text-2xl font-bold font-heading text-white mb-1.5">What currency do you use?</Text>
        <Text className="text-sm text-muted leading-5 mb-4 font-body">
          Choose your primary currency for subscription tracking. You can change this anytime in Settings.
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-card rounded-xl px-3.5 py-2.5 border border-slate-400/15">
          <MaterialIcons
            name="search"
            size={20}
            color={COLORS.textSecondary}
            style={{ marginRight: 10 }}
          />
          <TextInput
            testID="currency-search-input"
            className="flex-1 text-[15px] font-body text-white p-0"
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
      <View className="flex-1 px-5">
        <FlatList
          data={filteredCurrencies}
          keyExtractor={(item) => item.code}
          renderItem={renderCurrencyItem}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 px-6">
              <MaterialCommunityIcons
                name="currency-usd-off"
                size={44}
                color={COLORS.textSecondary}
                style={{ opacity: 0.6, marginBottom: 8 }}
              />
              <Text className="text-sm text-muted text-center leading-5 font-body">
                No currencies found matching &quot;{searchQuery}&quot;
              </Text>
            </View>
          }
        />
      </View>

      {/* Bottom CTA Button */}
      <View className="px-5 pt-3 pb-6 bg-background">
        <TouchableOpacity
          testID="continue-button"
          className={`bg-primary py-4 rounded-full items-center justify-center shadow-md shadow-purple-900/35 elevation-6 ${
            isSubmitting ? 'opacity-60' : ''
          }`}
          onPress={handleContinue}
          disabled={isSubmitting}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Continue with ${selected}`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-base font-bold font-heading text-white">
              Continue with {selected} →
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
