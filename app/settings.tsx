import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { useAppTheme } from '@/constants/theme';
import { AppIcon } from '@/components/AppIcon';
import { POPULAR_CURRENCIES, CurrencyInfo } from '@/constants/currencies';
import { AVATAR_OPTIONS } from '@/constants/personalization';
import {
  PaymentMethodSelector,
} from '@/components/PaymentMethodSelector';
import { UserAvatar } from '@/components/UserAvatar';
import {
  SavedPaymentMethod,
  parseSavedPaymentMethods,
  getPaymentMethod,
} from '@/constants/paymentMethods';
import {
  scheduleWeeklyDigest,
  cancelWeeklyDigest,
  cancelNotification,
} from '@/services/notificationService';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useAppTheme();

  const getSetting = useSettingsStore((state) => state.getSetting);
  const setSetting = useSettingsStore((state) => state.setSetting);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  // Subscribe to cache changes for reactivity
  useSettingsStore((state) => state.cache);

  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const loadSubscriptions = useSubscriptionStore((state) => state.loadSubscriptions);
  const deleteSubscription = useSubscriptionStore((state) => state.deleteSubscription);

  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      loadSubscriptions();
    }, [loadSettings, loadSubscriptions])
  );

  const currentCurrency = getSetting('default_currency', 'USD');
  const isWeeklyDigestEnabled = getSetting('notify_weekly_digest', 'true') === 'true';
  const userAlias = getSetting('user_alias', '');
  const userAvatar = getSetting('user_avatar', 'space') || 'space';
  const defaultPaymentMethod = getSetting('default_payment_method', 'card') || 'card';
  const defaultPaymentDetails = getSetting('default_payment_details', '');
  const appTheme = getSetting('app_theme', 'dark') || 'dark';
  const isGrainEnabled = getSetting('grain_enabled', 'false') === 'true';

  // Draft profile state - requires user confirmation to save
  const [draftAlias, setDraftAlias] = useState<string | null>(null);
  const [draftAvatar, setDraftAvatar] = useState<string | null>(null);
  const [draftPaymentMethod, setDraftPaymentMethod] = useState<string | null>(null);
  const [draftPaymentDetails, setDraftPaymentDetails] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const activeAlias = draftAlias !== null ? draftAlias : userAlias;
  const activeAvatar = draftAvatar !== null ? draftAvatar : userAvatar;
  const activePaymentMethod = draftPaymentMethod !== null ? draftPaymentMethod : defaultPaymentMethod;
  const activePaymentDetails = draftPaymentDetails !== null ? draftPaymentDetails : defaultPaymentDetails;

  const hasProfileChanges =
    (draftAlias !== null && draftAlias !== userAlias) ||
    (draftAvatar !== null && draftAvatar !== userAvatar) ||
    (draftPaymentMethod !== null && draftPaymentMethod !== defaultPaymentMethod) ||
    (draftPaymentDetails !== null && draftPaymentDetails !== defaultPaymentDetails);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      if (draftAlias !== null) await setSetting('user_alias', draftAlias.trim());
      if (draftAvatar !== null) await setSetting('user_avatar', draftAvatar);
      if (draftPaymentMethod !== null) await setSetting('default_payment_method', draftPaymentMethod);
      if (draftPaymentDetails !== null) await setSetting('default_payment_details', draftPaymentDetails.trim());
      setDraftAlias(null);
      setDraftAvatar(null);
      setDraftPaymentMethod(null);
      setDraftPaymentDetails(null);
      Alert.alert('Profile Saved', 'Your profile preferences have been updated.');
    } catch {
      Alert.alert('Error', 'Failed to save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleBack = () => {
    if (hasProfileChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes in your profile. Discard them and leave?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard & Leave',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

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

  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [newMethodKey, setNewMethodKey] = useState('gcash');
  const [newMethodDetails, setNewMethodDetails] = useState('');

  const handleSaveNewPaymentMethod = async () => {
    const newEntry: SavedPaymentMethod = {
      id: `pm_${Date.now()}`,
      methodKey: newMethodKey,
      details: newMethodDetails.trim(),
      isDefault: savedPaymentMethods.length === 0,
    };
    const updated = [...savedPaymentMethods, newEntry];
    await setSetting('saved_payment_methods', JSON.stringify(updated));
    if (newEntry.isDefault) {
      await setSetting('default_payment_method', newEntry.methodKey);
      await setSetting('default_payment_details', newEntry.details);
    }
    setIsAddingPaymentMethod(false);
    setNewMethodDetails('');
  };

  const handleSetDefaultPaymentMethod = async (id: string) => {
    const updated = savedPaymentMethods.map((m) => ({
      ...m,
      isDefault: m.id === id,
    }));
    const defaultOne = updated.find((m) => m.id === id);
    await setSetting('saved_payment_methods', JSON.stringify(updated));
    if (defaultOne) {
      await setSetting('default_payment_method', defaultOne.methodKey);
      await setSetting('default_payment_details', defaultOne.details);
    }
  };

  const handleDeleteSavedPaymentMethod = async (id: string) => {
    const updated = savedPaymentMethods.filter((m) => m.id !== id);
    if (updated.length > 0 && !updated.some((m) => m.isDefault)) {
      updated[0].isDefault = true;
      await setSetting('default_payment_method', updated[0].methodKey);
      await setSetting('default_payment_details', updated[0].details);
    }
    await setSetting('saved_payment_methods', JSON.stringify(updated));
  };

  const filteredCurrencies = useMemo(() => {
    const query = currencySearch.trim().toLowerCase();
    if (!query) return POPULAR_CURRENCIES;
    return POPULAR_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        c.symbol.toLowerCase().includes(query)
    );
  }, [currencySearch]);

  const handleToggleWeeklyDigest = async (value: boolean) => {
    if (value) {
      const scheduledId = await scheduleWeeklyDigest(0, 9, 0);
      if (scheduledId) {
        await setSetting('weekly_digest_notification_id', scheduledId);
      }
      await setSetting('notify_weekly_digest', 'true');
    } else {
      const existingId = getSetting('weekly_digest_notification_id', '');
      if (existingId) {
        await cancelWeeklyDigest(existingId);
      }
      await setSetting('weekly_digest_notification_id', '');
      await setSetting('notify_weekly_digest', 'false');
    }
  };

  const handleSelectCurrency = async (code: string) => {
    await setSetting('default_currency', code);
    setIsCurrencyModalVisible(false);
    setCurrencySearch('');
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all subscriptions. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            const currentSubs = [...useSubscriptionStore.getState().subscriptions];
            for (const sub of currentSubs) {
              if (sub.notificationId) {
                await cancelNotification(sub.notificationId);
              }
              await deleteSubscription(sub.id);
            }
            Alert.alert('Data Cleared', 'All subscriptions have been deleted.', [
              { text: 'OK' },
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bgPrimary }} testID="settings-screen">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-4 border-b border-slate-400/[0.08]">
        <TouchableOpacity
          className="p-1.5 mr-2 rounded-lg"
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="settings-back-btn"
        >
          <AppIcon name="arrow-back" size={24} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold font-heading text-white">Settings</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: PROFILE & DEFAULTS */}
        <View className="mb-6" testID="section-profile">
          <View className="flex-row items-center justify-between mb-2 ml-1">
            <Text className="text-xs font-bold font-heading text-muted tracking-wider uppercase">PROFILE & DEFAULTS</Text>
            {hasProfileChanges && (
              <View className="bg-amber-500/20 border border-amber-500/40 rounded-full px-2 py-0.5">
                <Text className="text-[10px] font-bold text-amber-400 font-heading uppercase">Unsaved Changes</Text>
              </View>
            )}
          </View>
          <View className="bg-card rounded-2xl p-4 border border-white/[0.08]">
            {/* Nickname / Alias */}
            <View className="mb-4">
              <Text className="text-[11px] font-bold font-heading tracking-wider text-muted mb-2 uppercase">NICKNAME / ALIAS</Text>
              <TextInput
                className="bg-[#161626] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm font-body text-white"
                value={activeAlias}
                onChangeText={(text) => setDraftAlias(text)}
                placeholder="e.g. Janre"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="words"
                autoCorrect={false}
                testID="settings-alias-input"
              />
            </View>

            {/* Avatar Selector */}
            <View className="mb-4">
              <Text className="text-[11px] font-bold font-heading tracking-wider text-muted mb-2 uppercase">AVATAR</Text>
              <View className="flex-row items-center justify-between gap-2" testID="settings-avatar-selector">
                {AVATAR_OPTIONS.map((item) => {
                  const isSelected = activeAvatar === item.id || activeAvatar === item.emoji;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      className={`flex-1 py-2.5 items-center justify-center bg-[#161626] rounded-xl border-[1.5px] ${
                        isSelected
                          ? 'border-primary bg-primary/25'
                          : 'border-white/[0.08]'
                      }`}
                      onPress={() => {
                        setDraftAvatar(item.emoji);
                      }}
                      activeOpacity={0.7}
                      testID={`settings-avatar-${item.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.label} avatar`}
                    >
                      <UserAvatar avatarId={item.id} size={42} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Default Payment Method */}
            <PaymentMethodSelector
              value={activePaymentMethod}
              details={activePaymentDetails}
              onChangeMethod={(method) => {
                setDraftPaymentMethod(method);
              }}
              onChangeDetails={(note) => {
                setDraftPaymentDetails(note);
              }}
              testID="settings-payment-selector"
            />

            {/* Save Profile Changes Action Bar */}
            {hasProfileChanges && (
              <View className="mt-4 pt-3 border-t border-white/[0.08] flex-row items-center justify-between">
                <TouchableOpacity
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06]"
                  onPress={() => {
                    setDraftAlias(null);
                    setDraftAvatar(null);
                    setDraftPaymentMethod(null);
                    setDraftPaymentDetails(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text className="text-xs font-semibold font-heading text-muted">Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center bg-primary px-4 py-2.5 rounded-xl shadow-md shadow-primary/30"
                  onPress={handleSaveProfile}
                  activeOpacity={0.8}
                  testID="settings-save-profile-btn"
                  disabled={isSavingProfile}
                >
                  <AppIcon name="check" size={16} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
                  <Text className="text-xs font-bold font-heading text-white">Save Profile Changes</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Saved Payment Methods */}
            <View className="mt-4">
              <Text className="text-[11px] font-bold font-heading tracking-wider text-muted mb-2 uppercase">SAVED PAYMENT METHODS</Text>
              <Text className="text-xs text-muted mb-2.5 font-body">
                Manage multiple wallets and bank cards you use. Tap one to set as default.
              </Text>

              {savedPaymentMethods.map((pm) => {
                const def = getPaymentMethod(pm.methodKey);
                return (
                  <View key={pm.id} className="flex-row items-center justify-between bg-[#161626] rounded-xl p-3 mb-2 border border-white/[0.08]" testID={`saved-payment-${pm.id}`}>
                    <TouchableOpacity
                      className="flex-1 flex-row items-center"
                      onPress={() => handleSetDefaultPaymentMethod(pm.id)}
                      activeOpacity={0.7}
                    >
                      <View className="w-2.5 h-2.5 rounded-full mr-2.5" style={{ backgroundColor: def.color }} />
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm font-semibold font-heading text-white">{def.name}</Text>
                          {pm.isDefault && (
                            <View className="bg-primary/30 rounded px-1.5 py-0.5 border border-primary">
                              <Text className="text-[9px] font-bold font-heading text-purple-300">DEFAULT</Text>
                            </View>
                          )}
                        </View>
                        {pm.details ? (
                          <Text className="text-xs text-muted mt-0.5 font-body">{pm.details}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="p-1.5"
                      onPress={() => handleDeleteSavedPaymentMethod(pm.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={`Delete ${def.name}`}
                    >
                      <AppIcon name="close" size={16} color={COLORS.textSecondary} strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {!isAddingPaymentMethod ? (
                <TouchableOpacity
                  className="flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border border-primary/30 bg-primary/[0.08] mt-1"
                  onPress={() => setIsAddingPaymentMethod(true)}
                  activeOpacity={0.7}
                  testID="settings-add-payment-btn"
                >
                  <AppIcon name="plus" size={18} color={COLORS.accentPurpleLight} strokeWidth={2.2} />
                  <Text className="text-[13px] font-semibold font-heading text-purple-300">Add Another Payment Method</Text>
                </TouchableOpacity>
              ) : (
                <View className="bg-[#161626] rounded-[14px] p-3.5 mt-2 border border-primary/20">
                  <Text className="text-[13px] font-bold font-heading text-white mb-2 uppercase tracking-wider">Add Payment Method</Text>
                  <PaymentMethodSelector
                    value={newMethodKey}
                    details={newMethodDetails}
                    onChangeMethod={setNewMethodKey}
                    onChangeDetails={setNewMethodDetails}
                    testID="settings-new-payment-selector"
                  />
                  <View className="flex-row justify-end gap-2.5 mt-3">
                    <TouchableOpacity
                      className="px-3.5 py-2 rounded-lg bg-white/[0.06]"
                      onPress={() => {
                        setIsAddingPaymentMethod(false);
                        setNewMethodDetails('');
                      }}
                    >
                      <Text className="text-[13px] font-semibold font-heading text-muted">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="px-4 py-2 rounded-lg bg-primary"
                      onPress={handleSaveNewPaymentMethod}
                    >
                      <Text className="text-[13px] font-bold font-heading text-white">Save Method</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Section 1: CURRENCY */}
        <View className="mb-6" testID="section-currency">
          <Text className="text-xs font-bold font-heading text-muted mb-2 ml-1 tracking-wider uppercase">CURRENCY</Text>
          <TouchableOpacity
            className="bg-card rounded-2xl p-4 border border-white/[0.08]"
            onPress={() => setIsCurrencyModalVisible(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Default Currency, currently ${currentCurrency}`}
            testID="settings-currency-row"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold font-heading text-white">Default Currency</Text>
              <View className="flex-row items-center">
                <Text className="text-[15px] font-semibold font-heading text-purple-300 mr-1" testID="settings-currency-value">
                  {currentCurrency}
                </Text>
                <AppIcon
                  name="chevron-right"
                  size={20}
                  color={COLORS.textSecondary}
                  strokeWidth={2}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: THEME */}
        <View className="mb-6" testID="section-theme">
          <Text className="text-xs font-bold font-heading text-muted mb-2 ml-1 tracking-wider uppercase">THEME</Text>
          <View className="gap-2.5">
            <TouchableOpacity
              className={`flex-row items-center bg-[#1A1A2E]/75 rounded-2xl p-3.5 border-[1.5px] ${
                appTheme === 'dark' ? 'border-primary bg-primary/15' : 'border-white/[0.08]'
              }`}
              onPress={async () => {
                await setSetting('app_theme', 'dark');
              }}
              activeOpacity={0.7}
              testID="settings-theme-dark"
              accessibilityRole="radio"
              accessibilityState={{ checked: appTheme === 'dark' }}
            >
              <View className="w-9 h-9 rounded-xl bg-primary/20 items-center justify-center mr-3">
                <AppIcon name="moon" size={18} color="#A78BFA" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold font-heading text-white">SignalSub Dark</Text>
                <Text className="text-xs text-muted mt-0.5 font-body">Default purple & dark slate</Text>
              </View>
              {appTheme === 'dark' && (
                <AppIcon
                  name="check-circle"
                  size={20}
                  color={COLORS.accentPurpleLight}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center bg-[#1A1A2E]/75 rounded-2xl p-3.5 border-[1.5px] ${
                appTheme === 'oled' ? 'border-primary bg-primary/15' : 'border-white/[0.08]'
              }`}
              onPress={async () => {
                await setSetting('app_theme', 'oled');
              }}
              activeOpacity={0.7}
              testID="settings-theme-oled"
              accessibilityRole="radio"
              accessibilityState={{ checked: appTheme === 'oled' }}
            >
              <View className="w-9 h-9 rounded-xl bg-black border border-white/20 items-center justify-center mr-3">
                <AppIcon name="contrast" size={18} color="#A78BFA" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold font-heading text-white">Midnight OLED</Text>
                <Text className="text-xs text-muted mt-0.5 font-body">Pitch black for OLED displays</Text>
              </View>
              {appTheme === 'oled' && (
                <AppIcon
                  name="check-circle"
                  size={20}
                  color={COLORS.accentPurpleLight}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: VISUAL EFFECTS */}
        <View className="mb-6" testID="section-visual-effects">
          <Text className="text-xs font-bold font-heading text-muted mb-2 ml-1 tracking-wider uppercase">VISUAL EFFECTS</Text>
          <View className="bg-card rounded-2xl p-4 border border-white/[0.08]">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-base font-semibold font-heading text-white">Grain Overlay</Text>
                <Text className="text-[13px] text-muted mt-1 leading-[18px] font-body">
                  Subtle film grain texture effect across screens
                </Text>
              </View>
              <Switch
                value={isGrainEnabled}
                onValueChange={async (val) => {
                  await setSetting('grain_enabled', val ? 'true' : 'false');
                }}
                trackColor={{
                  false: COLORS.bgSurface,
                  true: COLORS.accentPurple,
                }}
                thumbColor="#FFFFFF"
                testID="settings-grain-switch"
                accessibilityLabel="Grain Overlay Toggle"
              />
            </View>
          </View>
        </View>

        {/* Section 2: NOTIFICATIONS */}
        <View className="mb-6" testID="section-notifications">
          <Text className="text-xs font-bold font-heading text-muted mb-2 ml-1 tracking-wider uppercase">NOTIFICATIONS</Text>
          <View className="bg-card rounded-2xl p-4 border border-white/[0.08]">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-base font-semibold font-heading text-white">Weekly Spending Digest</Text>
                <Text className="text-[13px] text-muted mt-1 leading-[18px] font-body">
                  Summary sent every Sunday at 9:00 AM
                </Text>
              </View>
              <Switch
                value={isWeeklyDigestEnabled}
                onValueChange={handleToggleWeeklyDigest}
                trackColor={{
                  false: COLORS.bgSurface,
                  true: COLORS.accentPurple,
                }}
                thumbColor="#FFFFFF"
                testID="settings-weekly-digest-switch"
                accessibilityLabel="Weekly Spending Digest Toggle"
              />
            </View>
          </View>
        </View>

        {/* Section 3: DATA */}
        <View className="mb-6" testID="section-data">
          <Text className="text-xs font-bold font-heading text-muted mb-2 ml-1 tracking-wider uppercase">DATA</Text>
          <TouchableOpacity
            className="bg-card rounded-2xl p-4 border border-white/[0.08]"
            onPress={handleClearAllData}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Clear All Data"
            testID="settings-clear-data-btn"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold font-heading text-red-500">
                Clear All Data
              </Text>
              <AppIcon
                name="trash"
                size={22}
                color={COLORS.danger}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: HELP & GUIDE */}
        <View className="mb-6" testID="section-guide">
          <Text className="text-xs font-bold font-heading text-muted mb-2 ml-1 tracking-wider uppercase">HELP & GUIDE</Text>
          <TouchableOpacity
            className="bg-card rounded-2xl p-4 border border-white/[0.08]"
            onPress={() => router.push('/(onboarding)/welcome')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Getting Started Guide"
            testID="settings-getting-started-btn"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl bg-primary/20 items-center justify-center">
                  <AppIcon name="book" size={20} color={COLORS.accentPurpleLight} />
                </View>
                <View>
                  <Text className="text-base font-semibold font-heading text-white">Getting Started</Text>
                  <Text className="text-xs text-muted mt-0.5 font-body">Replay feature tour & onboarding</Text>
                </View>
              </View>
              <AppIcon
                name="chevron-right"
                size={20}
                color={COLORS.textSecondary}
                strokeWidth={2}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 4: ABOUT */}
        <View className="mb-6" testID="section-about">
          <Text className="text-xs font-bold font-heading text-muted mb-2 ml-1 tracking-wider uppercase">ABOUT</Text>
          <View className="bg-card rounded-2xl py-5 px-[18px] border border-white/[0.08]" testID="settings-about-card">
            <Text className="text-base font-bold font-heading text-white">SignalSub</Text>
            <Text className="text-sm text-muted mt-1 font-body">Version 1.0.0</Text>
            <Text className="text-sm text-muted mt-2 leading-5 font-body">
              Never get surprised by an auto-charge.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Currency Selection Modal */}
      <Modal
        visible={isCurrencyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsCurrencyModalVisible(false);
          setCurrencySearch('');
        }}
        testID="currency-picker-modal"
      >
        <View className="flex-1 bg-black/65 justify-end">
          <View className="rounded-t-3xl max-h-[80%] px-5 pt-5 pb-9 border border-surface" style={{ backgroundColor: theme.bgPrimary }} testID="currency-modal-container">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold font-heading text-white">Select Currency</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsCurrencyModalVisible(false);
                  setCurrencySearch('');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                testID="currency-modal-close-btn"
                accessibilityRole="button"
                accessibilityLabel="Close currency modal"
              >
                <AppIcon name="close" size={24} color={COLORS.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center bg-card rounded-xl px-3 h-11 mb-3 border border-surface">
              <AppIcon
                name="search"
                size={20}
                color={COLORS.textSecondary}
                style={{ marginRight: 8 }}
              />
              <TextInput
                className="flex-1 text-white text-[15px] font-body p-0"
                placeholder="Search currency (e.g. USD, EUR, PHP)"
                placeholderTextColor={COLORS.textSecondary}
                value={currencySearch}
                onChangeText={setCurrencySearch}
                autoCapitalize="none"
                autoCorrect={false}
                testID="currency-search-input"
              />
              {currencySearch.length > 0 && (
                <TouchableOpacity
                  onPress={() => setCurrencySearch('')}
                  testID="currency-search-clear-btn"
                >
                  <AppIcon
                    name="close"
                    size={18}
                    color={COLORS.textSecondary}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredCurrencies}
              keyExtractor={(item) => item.code}
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
              testID="currency-list"
              renderItem={({ item }: { item: CurrencyInfo }) => {
                const isSelected = item.code === currentCurrency;
                return (
                  <TouchableOpacity
                    className={`flex-row items-center justify-between py-3 px-3.5 rounded-xl my-1 border-[1.5px] ${
                      isSelected
                        ? 'border-primary bg-primary/15'
                        : 'border-transparent bg-card'
                    }`}
                    onPress={() => handleSelectCurrency(item.code)}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    testID={`currency-option-${item.code}`}
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      <Text className="text-[22px] mr-3">{item.flag}</Text>
                      <View className="flex-1">
                        <Text className="text-[15px] font-bold font-heading text-white">{item.code}</Text>
                        <Text className="text-xs text-muted mt-0.5 font-body" numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <Text
                        className={`text-[15px] font-semibold font-heading ${
                          isSelected ? 'text-purple-300' : 'text-muted'
                        }`}
                      >
                        {item.symbol}
                      </Text>
                      {isSelected && (
                        <AppIcon
                          name="check"
                          size={20}
                          color={COLORS.accentPurpleLight}
                          strokeWidth={2.5}
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
