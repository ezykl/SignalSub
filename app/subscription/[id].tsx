import React, { useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { CATEGORIES } from '@/constants/categories';
import { getCurrencyByCode } from '@/constants/currencies';
import { BillingCycle, BillingCyclePill } from '@/components/BillingCyclePill';
import { CategoryChip } from '@/components/CategoryChip';
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

export default function EditSubscriptionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const updateSubscription = useSubscriptionStore((state) => state.updateSubscription);
  const deleteSubscription = useSubscriptionStore((state) => state.deleteSubscription);
  const getSetting = useSettingsStore((state) => state.getSetting);

  const sub = subscriptions.find((s) => s.id === id);

  // Currency
  const defaultCurrency = getSetting('default_currency', 'USD');
  const currencyCode = sub?.currency || defaultCurrency || 'USD';
  const currencyInfo = getCurrencyByCode(currencyCode);
  const currencySymbol =
    currencyInfo?.symbol ??
    (currencyCode.length <= 3 ? currencyCode : '$');

  // Form states pre-populated from subscription
  const [name, setName] = useState(sub?.name ?? '');
  const [amount, setAmount] = useState(sub ? String(sub.amount) : '');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    (sub?.billingCycle as BillingCycle) || 'monthly'
  );
  const [nextRenewalDate, setNextRenewalDate] = useState(
    sub?.nextRenewalDate ?? ''
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    sub?.category ?? 'other'
  );
  const [color, setColor] = useState<string>(
    sub?.color ?? COLORS.accentPurple
  );
  const [iconType, setIconType] = useState<string>(
    sub?.iconType ?? 'initial'
  );
  const [iconValue, setIconValue] = useState<string>(
    sub?.iconValue ?? 'S'
  );

  // Free trial & notification
  const [isTrial, setIsTrial] = useState(sub ? sub.isTrial === 1 : false);
  const [trialEndDate, setTrialEndDate] = useState(
    sub?.trialEndDate ?? getDefaultTrialEndDate()
  );
  const [notifyBeforeDays, setNotifyBeforeDays] = useState(
    sub?.notifyBeforeDays ?? 3
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Not found fallback
  if (!sub) {
    return (
      <SafeAreaView style={styles.safeArea}>
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
          <Text style={styles.headerTitle}>Edit Subscription</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.notFoundContainer} testID="subscription-not-found">
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={56}
            color={COLORS.textSecondary}
            style={{ marginBottom: 16 }}
          />
          <Text style={styles.notFoundTitle}>Subscription Not Found</Text>
          <Text style={styles.notFoundText}>
            The subscription you are trying to edit does not exist or has been deleted.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            testID="not-found-back-btn"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBillingCycleChange = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
    // Optionally update renewal date if needed
    if (!nextRenewalDate) {
      setNextRenewalDate(computeNextRenewalDate(getTodayIso(), cycle));
    }
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
      const effectiveIconType = iconType === 'preset' ? 'preset' : 'initial';
      const effectiveIconValue =
        effectiveIconType === 'preset'
          ? iconValue
          : trimmedName.charAt(0).toUpperCase() || 'S';

      await updateSubscription(sub.id, {
        name: trimmedName,
        amount: parsedAmount,
        billingCycle,
        nextRenewalDate: nextRenewalDate.trim() || sub.nextRenewalDate,
        category: selectedCategory || 'other',
        color: color || COLORS.accentPurple,
        iconType: effectiveIconType,
        iconValue: effectiveIconValue,
        isTrial: isTrial ? 1 : 0,
        trialEndDate: isTrial ? trialEndDate.trim() || null : null,
        notifyBeforeDays,
      });

      router.back();
    } catch (error) {
      console.error('Failed to update subscription:', error);
      Alert.alert('Error', 'Failed to update subscription. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Subscription',
      `Are you sure you want to delete ${sub.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (isDeleting) return;
            setIsDeleting(true);
            try {
              await deleteSubscription(sub.id);
              router.back();
            } catch (error) {
              console.error('Failed to delete subscription:', error);
              Alert.alert('Error', 'Failed to delete subscription.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
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

        <Text style={styles.headerTitle}>Edit Subscription</Text>

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
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NEXT RENEWAL DATE</Text>
            <TextInput
              testID="input-renewal-date"
              value={nextRenewalDate}
              onChangeText={setNextRenewalDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.textInput}
            />
          </View>

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
            <View style={[styles.fieldGroup, styles.trialDateGroup]}>
              <Text style={styles.fieldLabel}>TRIAL END DATE</Text>
              <TextInput
                testID="input-trial-end-date"
                value={trialEndDate}
                onChangeText={setTrialEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textSecondary}
                style={styles.textInput}
              />
            </View>
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

          {/* Delete Subscription Button */}
          <TouchableOpacity
            testID="delete-subscription-btn"
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={isDeleting}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${sub.name}`}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={20}
              color={COLORS.danger}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.deleteButtonText}>Delete Subscription</Text>
          </TouchableOpacity>
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
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.danger,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  notFoundText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.accentPurple,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
