import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { CATEGORIES } from '@/constants/categories';
import { getCurrencyByCode } from '@/constants/currencies';
import {
  SERVICE_PRESETS,
  ServicePreset,
  searchPresets,
  getIconForPreset,
} from '@/constants/servicePresets';
import { isPresetInFavoriteCategories } from '@/constants/personalization';
import { BillingCycle, BillingCyclePill } from '@/components/BillingCyclePill';
import { CategoryChip } from '@/components/CategoryChip';
import { BrandIcon } from '@/components/BrandIcon';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import {
  SavedPaymentMethod,
  parseSavedPaymentMethods,
  getPaymentMethod,
} from '@/constants/paymentMethods';
import { DatePickerField } from '@/components/DatePickerModal';
import { computeNextRenewalDate } from '@/services/renewalService';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultTrialEndDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function NewSubscriptionScreen() {
  const router = useRouter();
  const getSetting = useSettingsStore((state) => state.getSetting);
  const addSubscription = useSubscriptionStore((state) => state.addSubscription);

  // Currency
  const defaultCurrency = getSetting('default_currency', 'USD');
  const currencyInfo = getCurrencyByCode(defaultCurrency);
  const currencySymbol =
    currencyInfo?.symbol ??
    (defaultCurrency && defaultCurrency.length <= 3 ? defaultCurrency : '$');

  // Preset search state
  const [presetSearch, setPresetSearch] = useState('');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [nextRenewalDate, setNextRenewalDate] = useState(() =>
    computeNextRenewalDate(getTodayIso(), 'monthly')
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('streaming');
  const [color, setColor] = useState<string>(COLORS.accentPurple);
  const [iconType, setIconType] = useState<'preset' | 'initial'>('initial');
  const [iconValue, setIconValue] = useState<string>('S');

  // Free trial & notification
  const [isTrial, setIsTrial] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState(() => getDefaultTrialEndDate());
  const [notifyBeforeDays, setNotifyBeforeDays] = useState(3);
  const [isSaving, setIsSaving] = useState(false);
  const defaultPaymentMethod =
    getSetting('default_payment_method', 'card') || 'card';
  const defaultPaymentDetails = getSetting('default_payment_details', '');

  const [paymentMethod, setPaymentMethod] = useState<string>(
    () => defaultPaymentMethod
  );
  const [paymentDetails, setPaymentDetails] = useState<string>(
    () => defaultPaymentDetails
  );

  const rawSavedMethods = getSetting('saved_payment_methods', '');
  const savedPaymentMethods: SavedPaymentMethod[] = useMemo(() => {
    const list = parseSavedPaymentMethods(rawSavedMethods);
    if (list.length > 0) return list;
    if (defaultPaymentMethod) {
      return [
        {
          id: 'pm-default',
          methodKey: defaultPaymentMethod,
          details: defaultPaymentDetails,
          isDefault: true,
        },
      ];
    }
    return [];
  }, [rawSavedMethods, defaultPaymentMethod, defaultPaymentDetails]);

  // Favorite categories & recommendations
  const favoriteCategoriesRaw = getSetting('favorite_categories', '');
  const favoriteCategories = useMemo<string[]>(() => {
    if (!favoriteCategoriesRaw) return [];
    try {
      const parsed = JSON.parse(favoriteCategoriesRaw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [favoriteCategoriesRaw]);

  // Filter presets
  const filteredPresets = useMemo(() => {
    return searchPresets(presetSearch);
  }, [presetSearch]);

  // Reorder presets with user's favorite categories at top
  const orderedPresets = useMemo(() => {
    if (favoriteCategories.length === 0 || presetSearch.trim().length > 0) {
      return filteredPresets;
    }
    const recommended: ServicePreset[] = [];
    const others: ServicePreset[] = [];
    for (const preset of filteredPresets) {
      if (isPresetInFavoriteCategories(preset, favoriteCategories)) {
        recommended.push(preset);
      } else {
        others.push(preset);
      }
    }
    return [...recommended, ...others];
  }, [filteredPresets, favoriteCategories, presetSearch]);

  const handleSelectPreset = (preset: ServicePreset) => {
    setSelectedPresetKey(preset.key);
    setName(preset.name);
    setSelectedCategory(preset.category);
    setColor(preset.color);
    const { iconType: pIconType, iconValue: pIconValue } = getIconForPreset(preset);
    // DB schema uses 'preset' for preset/brand icons, 'initial' for letter avatars
    setIconType(pIconType === 'initial' ? 'initial' : 'preset');
    setIconValue(pIconValue);
    if (preset.defaultAmount !== undefined) {
      setAmount(String(preset.defaultAmount));
    }
  };

  const handleClearPreset = () => {
    setSelectedPresetKey(null);
    setIconType('initial');
    setIconValue(name.trim().charAt(0).toUpperCase() || 'S');
    setColor(COLORS.accentPurple);
  };

  const handleBillingCycleChange = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
    setNextRenewalDate(computeNextRenewalDate(getTodayIso(), cycle));
  };

  const handleToggleTrial = () => {
    const next = !isTrial;
    setIsTrial(next);
    if (next && !trialEndDate) {
      setTrialEndDate(getDefaultTrialEndDate());
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Subscription name is required');
      return;
    }

    const parsedAmount = parseFloat(amount.trim());
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive amount');
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    try {
      const today = getTodayIso();
      const effectiveIconType = iconType === 'preset' ? 'preset' : 'initial';
      const effectiveIconValue =
        effectiveIconType === 'preset'
          ? iconValue
          : trimmedName.charAt(0).toUpperCase() || 'S';

      await addSubscription({
        name: trimmedName,
        amount: parsedAmount,
        currency: defaultCurrency || 'USD',
        billingCycle,
        nextRenewalDate:
          nextRenewalDate.trim() || computeNextRenewalDate(today, billingCycle),
        startDate: today,
        color: color || COLORS.accentPurple,
        iconType: effectiveIconType,
        iconValue: effectiveIconValue,
        category: selectedCategory || 'other',
        isTrial: isTrial ? 1 : 0,
        trialEndDate: isTrial ? trialEndDate.trim() || null : null,
        isActive: 1,
        notifyBeforeDays,
        paymentMethod: paymentMethod || 'card',
        paymentDetails: paymentDetails.trim() || null,
      });

      router.back();
    } catch (error) {
      console.error('Failed to add subscription:', error);
      Alert.alert('Error', 'Failed to save subscription. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="h-14 flex-row items-center justify-between px-4 border-b border-white/[0.08]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1.5 min-w-[44px] items-center justify-center"
          testID="header-close-btn"
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-xl text-muted font-bold font-heading">✕</Text>
        </TouchableOpacity>

        <Text className="text-lg font-bold font-heading text-white">Add Subscription</Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className="p-1.5 min-w-[44px] items-center justify-center"
          testID="header-save-btn"
          accessibilityRole="button"
          accessibilityLabel="Save"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-base font-bold font-heading text-purple-300">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Preset Service Selection */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs font-bold font-heading text-muted tracking-wider">PRESET SERVICES</Text>
            {selectedPresetKey ? (
              <TouchableOpacity
                onPress={handleClearPreset}
                testID="preset-custom-btn"
                accessibilityRole="button"
                accessibilityLabel="Clear preset"
              >
                <Text className="text-xs font-semibold font-heading text-purple-300">Use Custom</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-[#1A1A2E]/75 rounded-xl px-3 py-2 border border-white/[0.08] mb-3">
            <MaterialCommunityIcons
              name="magnify"
              size={18}
              color={COLORS.textSecondary}
              style={{ marginRight: 8 }}
            />
            <TextInput
              testID="preset-search-input"
              value={presetSearch}
              onChangeText={setPresetSearch}
              placeholder="Search popular services..."
              placeholderTextColor={COLORS.textSecondary}
              className="flex-1 text-sm font-body text-white p-0"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {presetSearch.length > 0 ? (
              <TouchableOpacity
                testID="preset-search-clear"
                onPress={() => setPresetSearch('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={16}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Recommended Section Header */}
          {favoriteCategories.length > 0 && !presetSearch.trim() ? (
            <View className="flex-row items-center mb-2" testID="recommended-presets-section">
              <Text className="text-[11px] font-bold font-heading text-purple-300 tracking-wider">RECOMMENDED FOR YOU</Text>
            </View>
          ) : null}

          {/* 3-Column Grid */}
          <View className="flex-row flex-wrap gap-2" testID="preset-grid">
            {orderedPresets.slice(0, 15).map((preset) => {
              const isSelected = selectedPresetKey === preset.key;
              return (
                <TouchableOpacity
                  key={preset.key}
                  testID={`preset-card-${preset.key}`}
                  style={{ borderColor: isSelected ? '#FFFFFF' : 'transparent' }}
                  className={`w-[31.5%] rounded-[14px] py-3 px-2 items-center justify-center border-[1.5px] ${
                    isSelected ? 'bg-[#7B5EA7]/[0.22]' : 'bg-[#1A1A2E]/75'
                  }`}
                  onPress={() => handleSelectPreset(preset)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <BrandIcon
                    name={preset.key}
                    iconType={preset.iconType === 'mci' ? 'preset' : 'initial'}
                    iconValue={preset.icon}
                    color={preset.color}
                    size={38}
                    iconSize={22}
                    showContainer
                    className="w-[38px] h-[38px] rounded-[10px] items-center justify-center mb-1.5"
                  />
                  <Text
                    numberOfLines={1}
                    className={`text-xs text-center ${
                      isSelected ? 'text-white font-bold font-heading' : 'text-muted font-semibold font-body'
                    }`}
                  >
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Form Fields */}
        <View className="px-4 pt-3">
          {/* Subscription Name */}
          <View className="mb-[18px]">
            <Text className="text-xs font-bold font-heading text-muted mb-2 tracking-wider">SUBSCRIPTION NAME *</Text>
            <TextInput
              testID="input-name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (iconType === 'initial') {
                  setIconValue(text.trim().charAt(0).toUpperCase() || 'S');
                }
              }}
              placeholder="e.g. Netflix, Spotify, AWS"
              placeholderTextColor={COLORS.textSecondary}
              className="bg-[#1A1A2E]/75 rounded-[14px] px-3.5 py-3 text-[15px] font-body text-white border border-white/[0.08]"
            />
          </View>

          {/* Amount */}
          <View className="mb-[18px]">
            <Text className="text-xs font-bold font-heading text-muted mb-2 tracking-wider">AMOUNT *</Text>
            <View className="flex-row items-center bg-[#1A1A2E]/75 rounded-[14px] px-3.5 py-1 border border-white/[0.08]">
              <Text className="text-lg font-bold font-heading text-purple-300 mr-2">{currencySymbol}</Text>
              <TextInput
                testID="input-amount"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
                className="flex-1 text-base font-semibold font-heading text-white py-2"
              />
            </View>
          </View>

          {/* Billing Cycle */}
          <View className="mb-[18px]">
            <Text className="text-xs font-bold font-heading text-muted mb-2 tracking-wider">BILLING CYCLE</Text>
            <BillingCyclePill
              value={billingCycle}
              onChange={handleBillingCycleChange}
              testID="billing-cycle-pill"
            />
          </View>

          {/* Next Renewal Date */}
          <DatePickerField
            label="NEXT RENEWAL DATE"
            value={nextRenewalDate}
            onChange={setNextRenewalDate}
            title="Select Renewal Date"
            testID="input-renewal-date"
          />

          {/* Category */}
          <View className="mb-[18px]">
            <Text className="text-xs font-bold font-heading text-muted mb-2 tracking-wider">CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              testID="category-chips-scroll"
            >
              {CATEGORIES.map((cat) => (
                <CategoryChip
                  key={cat.key}
                  categoryKey={cat.key}
                  selected={selectedCategory === cat.key}
                  onPress={() => setSelectedCategory(cat.key)}
                  testID={`category-chip-${cat.key}`}
                  className="mr-2"
                />
              ))}
            </ScrollView>
          </View>

          {/* Saved Payment Methods Quick Select */}
          {savedPaymentMethods.length > 0 && (
            <View className="mb-5" testID="saved-methods-quick-select">
              <Text className="text-xs font-bold font-heading text-muted mb-2 tracking-wider">MY SAVED WALLETS & CARDS</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
              >
                {savedPaymentMethods.map((pm) => {
                  const def = getPaymentMethod(pm.methodKey);
                  const isSelected = paymentMethod === pm.methodKey && paymentDetails === pm.details;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      className={`flex-row items-center bg-[#161626] border rounded-[10px] px-3 py-2 gap-2 ${
                        isSelected
                          ? 'border-accent bg-accent/20'
                          : 'border-white/10'
                      }`}
                      onPress={() => {
                        setPaymentMethod(pm.methodKey);
                        setPaymentDetails(pm.details);
                      }}
                      activeOpacity={0.7}
                      testID={`saved-method-chip-${pm.id}`}
                    >
                      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: def.color }} />
                      <Text className={`text-[13px] font-semibold font-heading ${isSelected ? 'text-white' : 'text-muted'}`}>
                        {def.shortName}
                        {pm.details ? ` (${pm.details})` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Payment Method Selector */}
          <PaymentMethodSelector
            value={paymentMethod}
            details={paymentDetails}
            onChangeMethod={setPaymentMethod}
            onChangeDetails={setPaymentDetails}
            testID="payment-method-selector"
          />

          {/* Free Trial Toggle Row */}
          <View className="flex-row items-center justify-between bg-[#1A1A2E]/75 rounded-[14px] px-3.5 py-3 mb-3.5 border border-white/[0.08]">
            <View className="flex-1 mr-3">
              <Text className="text-[15px] font-semibold font-heading text-white mb-0.5">Free Trial</Text>
              <Text className="text-xs text-muted font-body">
                Is this subscription currently on a trial?
              </Text>
            </View>
            <TouchableOpacity
              testID="trial-toggle"
              className={`w-12 h-7 rounded-full p-0.5 justify-center ${
                isTrial ? 'bg-accent' : 'bg-surface'
              }`}
              onPress={handleToggleTrial}
              activeOpacity={0.8}
              accessibilityRole="switch"
              accessibilityState={{ checked: isTrial }}
            >
              <View
                className={`w-6 h-6 rounded-full bg-white ${
                  isTrial ? 'self-end' : 'self-start'
                }`}
              />
            </TouchableOpacity>
          </View>

          {/* Trial End Date (if trial enabled) */}
          {isTrial ? (
            <DatePickerField
              label="TRIAL END DATE"
              value={trialEndDate}
              onChange={setTrialEndDate}
              title="Select Trial End Date"
              testID="input-trial-end-date"
            />
          ) : null}

          {/* Notification Stepper */}
          <View className="flex-row items-center justify-between bg-[#1A1A2E]/75 rounded-[14px] px-3.5 py-3 border border-white/[0.08]">
            <View className="flex-1 mr-3">
              <Text className="text-[15px] font-semibold font-heading text-white mb-0.5">Reminder Alert</Text>
              <Text className="text-xs text-muted font-body">
                Notify me {notifyBeforeDays} day{notifyBeforeDays === 1 ? '' : 's'}{' '}
                before renewal
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                testID="stepper-decrement"
                className={`w-8 h-8 rounded-lg bg-surface items-center justify-center ${
                  notifyBeforeDays <= 1 ? 'opacity-40' : ''
                }`}
                onPress={() =>
                  setNotifyBeforeDays((prev) => Math.max(1, prev - 1))
                }
                disabled={notifyBeforeDays <= 1}
                accessibilityRole="button"
                accessibilityLabel="Decrease notification days"
              >
                <Text className="text-lg font-bold font-heading text-white leading-5">−</Text>
              </TouchableOpacity>

              <Text testID="stepper-value" className="text-[15px] font-bold font-heading text-white min-w-[24px] text-center">
                {notifyBeforeDays}
              </Text>

              <TouchableOpacity
                testID="stepper-increment"
                className={`w-8 h-8 rounded-lg bg-surface items-center justify-center ${
                  notifyBeforeDays >= 14 ? 'opacity-40' : ''
                }`}
                onPress={() =>
                  setNotifyBeforeDays((prev) => Math.min(14, prev + 1))
                }
                disabled={notifyBeforeDays >= 14}
                accessibilityRole="button"
                accessibilityLabel="Increase notification days"
              >
                <Text className="text-lg font-bold font-heading text-white leading-5">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
