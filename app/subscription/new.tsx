import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
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
import { BillingCycle, BillingCyclePill } from '@/components/BillingCyclePill';
import { CategoryChip } from '@/components/CategoryChip';
import { BrandIcon } from '@/components/BrandIcon';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
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
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [paymentDetails, setPaymentDetails] = useState<string>('');

  // Filter presets
  const filteredPresets = useMemo(() => {
    return searchPresets(presetSearch);
  }, [presetSearch]);

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
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          testID="header-close-btn"
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Add Subscription</Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={styles.headerButton}
          testID="header-save-btn"
          accessibilityRole="button"
          accessibilityLabel="Save"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Preset Service Selection */}
        <View style={styles.section}>
          <View style={styles.presetSectionHeader}>
            <Text style={styles.sectionLabel}>PRESET SERVICES</Text>
            {selectedPresetKey ? (
              <TouchableOpacity
                onPress={handleClearPreset}
                testID="preset-custom-btn"
                accessibilityRole="button"
                accessibilityLabel="Clear preset"
              >
                <Text style={styles.customPresetText}>Use Custom</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Search Bar */}
          <View style={styles.presetSearchContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={18}
              color={COLORS.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              testID="preset-search-input"
              value={presetSearch}
              onChangeText={setPresetSearch}
              placeholder="Search popular services..."
              placeholderTextColor={COLORS.textSecondary}
              style={styles.presetSearchInput}
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

          {/* 3-Column Grid */}
          <View style={styles.presetGrid} testID="preset-grid">
            {filteredPresets.slice(0, 15).map((preset) => {
              const isSelected = selectedPresetKey === preset.key;
              return (
                <TouchableOpacity
                  key={preset.key}
                  testID={`preset-card-${preset.key}`}
                  style={[
                    styles.presetCard,
                    isSelected && styles.presetCardSelected,
                  ]}
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
                    style={styles.presetIconContainer}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.presetName,
                      isSelected && styles.presetNameSelected,
                    ]}
                  >
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Subscription Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>SUBSCRIPTION NAME *</Text>
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
              style={styles.textInput}
            />
          </View>

          {/* Amount */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>AMOUNT *</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
              <TextInput
                testID="input-amount"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
            </View>
          </View>

          {/* Billing Cycle */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>BILLING CYCLE</Text>
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
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
              testID="category-chips-scroll"
            >
              {CATEGORIES.map((cat) => (
                <CategoryChip
                  key={cat.key}
                  categoryKey={cat.key}
                  selected={selectedCategory === cat.key}
                  onPress={() => setSelectedCategory(cat.key)}
                  testID={`category-chip-${cat.key}`}
                  style={styles.categoryChipItem}
                />
              ))}
            </ScrollView>
          </View>

          {/* Payment Method Selector */}
          <PaymentMethodSelector
            value={paymentMethod}
            details={paymentDetails}
            onChangeMethod={setPaymentMethod}
            onChangeDetails={setPaymentDetails}
            testID="payment-method-selector"
          />

          {/* Free Trial Toggle Row */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Free Trial</Text>
              <Text style={styles.toggleSubtitle}>
                Is this subscription currently on a trial?
              </Text>
            </View>
            <TouchableOpacity
              testID="trial-toggle"
              style={[styles.switchTrack, isTrial && styles.switchTrackActive]}
              onPress={handleToggleTrial}
              activeOpacity={0.8}
              accessibilityRole="switch"
              accessibilityState={{ checked: isTrial }}
            >
              <View
                style={[
                  styles.switchThumb,
                  isTrial ? styles.switchThumbActive : styles.switchThumbInactive,
                ]}
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
          <View style={styles.stepperCard}>
            <View style={styles.stepperInfo}>
              <Text style={styles.stepperTitle}>Reminder Alert</Text>
              <Text style={styles.stepperSubtitle}>
                Notify me {notifyBeforeDays} day{notifyBeforeDays === 1 ? '' : 's'}{' '}
                before renewal
              </Text>
            </View>
            <View style={styles.stepperControls}>
              <TouchableOpacity
                testID="stepper-decrement"
                style={[
                  styles.stepperButton,
                  notifyBeforeDays <= 1 && styles.stepperButtonDisabled,
                ]}
                onPress={() =>
                  setNotifyBeforeDays((prev) => Math.max(1, prev - 1))
                }
                disabled={notifyBeforeDays <= 1}
                accessibilityRole="button"
                accessibilityLabel="Decrease notification days"
              >
                <Text style={styles.stepperButtonText}>−</Text>
              </TouchableOpacity>

              <Text testID="stepper-value" style={styles.stepperValue}>
                {notifyBeforeDays}
              </Text>

              <TouchableOpacity
                testID="stepper-increment"
                style={[
                  styles.stepperButton,
                  notifyBeforeDays >= 14 && styles.stepperButtonDisabled,
                ]}
                onPress={() =>
                  setNotifyBeforeDays((prev) => Math.min(14, prev + 1))
                }
                disabled={notifyBeforeDays >= 14}
                accessibilityRole="button"
                accessibilityLabel="Increase notification days"
              >
                <Text style={styles.stepperButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerButton: {
    padding: 6,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accentPurpleLight,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  presetSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  customPresetText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accentPurpleLight,
  },
  presetSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  presetSearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    padding: 0,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetCard: {
    width: '31.5%',
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  presetCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: `${COLORS.bgSurface}`,
  },
  presetIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  presetName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  presetNameSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accentPurpleLight,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingVertical: 8,
  },
  categoryScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryChipItem: {
    marginRight: 8,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bgSurface,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: COLORS.accentPurple,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  switchThumbInactive: {
    alignSelf: 'flex-start',
  },
  trialDateGroup: {
    marginTop: -4,
  },
  stepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  stepperInfo: {
    flex: 1,
    marginRight: 12,
  },
  stepperTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  stepperSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
});
