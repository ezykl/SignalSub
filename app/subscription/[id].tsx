import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
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

export default function EditSubscriptionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const updateSubscription = useSubscriptionStore((state) => state.updateSubscription);
  const deleteSubscription = useSubscriptionStore((state) => state.deleteSubscription);
  const cancelSubscription = useSubscriptionStore((state) => state.cancelSubscription);
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
  const [paymentMethod, setPaymentMethod] = useState<string>(
    sub?.paymentMethod ?? 'card'
  );
  const [paymentDetails, setPaymentDetails] = useState<string>(
    sub?.paymentDetails ?? ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Not found fallback
  if (!sub) {
    return (
      <SafeAreaView className="flex-1 bg-background">
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
          <Text className="text-lg font-bold font-heading text-white">Edit Subscription</Text>
          <View className="p-1.5 min-w-[44px]" />
        </View>

        <View className="flex-1 items-center justify-center px-8" testID="subscription-not-found">
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={56}
            color={COLORS.textSecondary}
            style={{ marginBottom: 16 }}
          />
          <Text className="text-xl font-bold font-heading text-white mb-2 text-center">Subscription Not Found</Text>
          <Text className="text-sm text-muted text-center leading-[22px] mb-6 font-body">
            The subscription you are trying to edit does not exist or has been deleted.
          </Text>
          <TouchableOpacity
            className="bg-accent px-6 py-3 rounded-full"
            onPress={() => router.back()}
            testID="not-found-back-btn"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text className="text-[15px] font-bold font-heading text-white">Go Back</Text>
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
        paymentMethod: paymentMethod || 'card',
        paymentDetails: paymentDetails.trim() || null,
      });

      router.back();
    } catch (error) {
      console.error('Failed to update subscription:', error);
      Alert.alert('Error', 'Failed to update subscription. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      `Are you sure you want to cancel ${sub.name}? Auto-renewals will be stopped, but your data will be saved.`,
      [
        {
          text: 'Keep Subscription',
          style: 'cancel',
        },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            if (isCancelling) return;
            setIsCancelling(true);
            try {
              await cancelSubscription(sub.id);
              router.back();
            } catch (error) {
              console.error('Failed to cancel subscription:', error);
              Alert.alert('Error', 'Failed to cancel subscription.');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
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

        <Text className="text-lg font-bold font-heading text-white">Edit Subscription</Text>

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
        <View className="px-4 pt-4">
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
              className="bg-card rounded-xl px-3.5 py-3 text-[15px] font-body text-white border border-slate-400/[0.15]"
            />
          </View>

          {/* Amount */}
          <View className="mb-[18px]">
            <Text className="text-xs font-bold font-heading text-muted mb-2 tracking-wider">AMOUNT *</Text>
            <View className="flex-row items-center bg-card rounded-xl px-3.5 py-1 border border-slate-400/[0.15]">
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

          {/* Payment Method Selector */}
          <PaymentMethodSelector
            value={paymentMethod}
            details={paymentDetails}
            onChangeMethod={setPaymentMethod}
            onChangeDetails={setPaymentDetails}
            testID="payment-method-selector"
          />

          {/* Free Trial Toggle Row */}
          <View className="flex-row items-center justify-between bg-card rounded-xl px-3.5 py-3 mb-3.5 border border-slate-400/[0.15]">
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
          <View className="flex-row items-center justify-between bg-card rounded-xl px-3.5 py-3 border border-slate-400/[0.15]">
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

          {/* Cancel Subscription Button */}
          {sub.status !== 'cancelled' && (
            <TouchableOpacity
              testID="cancel-subscription-btn"
              className="flex-row items-center justify-center mt-7 py-3.5 rounded-xl border-[1.5px] border-amber-500 bg-amber-500/[0.08]"
              onPress={handleCancel}
              disabled={isCancelling}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Cancel ${sub.name}`}
            >
              <MaterialCommunityIcons
                name="close-circle-outline"
                size={20}
                color={COLORS.warning}
                style={{ marginRight: 8 }}
              />
              <Text className="text-base font-bold font-heading text-amber-500">Cancel Subscription</Text>
            </TouchableOpacity>
          )}

          {/* Delete Subscription Button */}
          <TouchableOpacity
            testID="delete-subscription-btn"
            className="flex-row items-center justify-center mt-3 py-3.5 rounded-xl border-[1.5px] border-red-500 bg-red-500/[0.08]"
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
            <Text className="text-base font-bold font-heading text-red-500">Delete Subscription</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
