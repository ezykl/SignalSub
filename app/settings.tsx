import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { POPULAR_CURRENCIES, CurrencyInfo } from '@/constants/currencies';
import { AVATAR_OPTIONS } from '@/constants/personalization';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import {
  scheduleWeeklyDigest,
  cancelWeeklyDigest,
  cancelNotification,
} from '@/services/notificationService';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

export default function SettingsScreen() {
  const router = useRouter();

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
  const [aliasInput, setAliasInput] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      loadSubscriptions();
    }, [loadSettings, loadSubscriptions])
  );

  const currentCurrency = getSetting('default_currency', 'USD');
  const isWeeklyDigestEnabled = getSetting('notify_weekly_digest', 'true') === 'true';
  const userAlias = getSetting('user_alias', '');
  const userAvatar = getSetting('user_avatar', '🚀') || '🚀';
  const defaultPaymentMethod = getSetting('default_payment_method', 'card') || 'card';
  const defaultPaymentDetails = getSetting('default_payment_details', '');
  const appTheme = getSetting('app_theme', 'dark') || 'dark';
  const isGrainEnabled = getSetting('grain_enabled', 'false') === 'true';

  const currentAliasDisplay = aliasInput !== null ? aliasInput : userAlias;

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
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="settings-back-btn"
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: PROFILE & DEFAULTS */}
        <View style={styles.section} testID="section-profile">
          <Text style={styles.sectionHeader}>PROFILE & DEFAULTS</Text>
          <View style={styles.card}>
            {/* Nickname / Alias */}
            <View style={styles.fieldBlock}>
              <Text style={styles.subfieldLabel}>NICKNAME / ALIAS</Text>
              <TextInput
                style={styles.profileInput}
                value={currentAliasDisplay}
                onChangeText={async (text) => {
                  setAliasInput(text);
                  await setSetting('user_alias', text);
                }}
                placeholder="e.g. Janre"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="words"
                autoCorrect={false}
                testID="settings-alias-input"
              />
            </View>

            {/* Avatar Selector */}
            <View style={styles.fieldBlock}>
              <Text style={styles.subfieldLabel}>AVATAR</Text>
              <View style={styles.avatarRow} testID="settings-avatar-selector">
                {AVATAR_OPTIONS.map((item) => {
                  const isSelected = userAvatar === item.emoji;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.avatarChip,
                        isSelected && styles.avatarChipSelected,
                      ]}
                      onPress={async () => {
                        await setSetting('user_avatar', item.emoji);
                      }}
                      activeOpacity={0.7}
                      testID={`settings-avatar-${item.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.label} avatar`}
                    >
                      <Text style={styles.avatarChipEmoji}>{item.emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Default Payment Method */}
            <PaymentMethodSelector
              value={defaultPaymentMethod}
              details={defaultPaymentDetails}
              onChangeMethod={async (method) => {
                await setSetting('default_payment_method', method);
              }}
              onChangeDetails={async (note) => {
                await setSetting('default_payment_details', note);
              }}
              testID="settings-payment-selector"
            />
          </View>
        </View>

        {/* Section 1: CURRENCY */}
        <View style={styles.section} testID="section-currency">
          <Text style={styles.sectionHeader}>CURRENCY</Text>
          <TouchableOpacity
            style={styles.card}
            onPress={() => setIsCurrencyModalVisible(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Default Currency, currently ${currentCurrency}`}
            testID="settings-currency-row"
          >
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Default Currency</Text>
              <View style={styles.rowRight}>
                <Text style={styles.currencyValueText} testID="settings-currency-value">
                  {currentCurrency}
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={COLORS.textSecondary}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: THEME */}
        <View style={styles.section} testID="section-theme">
          <Text style={styles.sectionHeader}>THEME</Text>
          <View style={styles.themeRowContainer}>
            <TouchableOpacity
              style={[
                styles.themeOptionCard,
                appTheme === 'dark' && styles.themeOptionCardActive,
              ]}
              onPress={async () => {
                await setSetting('app_theme', 'dark');
              }}
              activeOpacity={0.7}
              testID="settings-theme-dark"
              accessibilityRole="radio"
              accessibilityState={{ checked: appTheme === 'dark' }}
            >
              <View style={styles.themePreviewRow}>
                <View style={[styles.themeSwatch, { backgroundColor: '#7B5EA7' }]} />
                <View style={[styles.themeSwatch, { backgroundColor: '#0F0F1A' }]} />
              </View>
              <View style={styles.themeTextContainer}>
                <Text style={styles.themeOptionTitle}>SignalSub Dark</Text>
                <Text style={styles.themeOptionSubtitle}>Default purple & dark slate</Text>
              </View>
              {appTheme === 'dark' && (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={COLORS.accentPurpleLight}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOptionCard,
                appTheme === 'oled' && styles.themeOptionCardActive,
              ]}
              onPress={async () => {
                await setSetting('app_theme', 'oled');
              }}
              activeOpacity={0.7}
              testID="settings-theme-oled"
              accessibilityRole="radio"
              accessibilityState={{ checked: appTheme === 'oled' }}
            >
              <View style={styles.themePreviewRow}>
                <View style={[styles.themeSwatch, { backgroundColor: '#000000' }]} />
                <View style={[styles.themeSwatch, { backgroundColor: '#111111' }]} />
              </View>
              <View style={styles.themeTextContainer}>
                <Text style={styles.themeOptionTitle}>Midnight OLED</Text>
                <Text style={styles.themeOptionSubtitle}>Pitch black for OLED displays</Text>
              </View>
              {appTheme === 'oled' && (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={COLORS.accentPurpleLight}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: VISUAL EFFECTS */}
        <View style={styles.section} testID="section-visual-effects">
          <Text style={styles.sectionHeader}>VISUAL EFFECTS</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.notificationTextContainer}>
                <Text style={styles.rowLabel}>Grain Overlay</Text>
                <Text style={styles.rowSubtitle}>
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
        <View style={styles.section} testID="section-notifications">
          <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.notificationTextContainer}>
                <Text style={styles.rowLabel}>Weekly Spending Digest</Text>
                <Text style={styles.rowSubtitle}>
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
        <View style={styles.section} testID="section-data">
          <Text style={styles.sectionHeader}>DATA</Text>
          <TouchableOpacity
            style={styles.card}
            onPress={handleClearAllData}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Clear All Data"
            testID="settings-clear-data-btn"
          >
            <View style={styles.row}>
              <Text style={[styles.rowLabel, styles.dangerText]}>
                Clear All Data
              </Text>
              <MaterialIcons
                name="delete-outline"
                size={22}
                color={COLORS.danger}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 4: ABOUT */}
        <View style={styles.section} testID="section-about">
          <Text style={styles.sectionHeader}>ABOUT</Text>
          <View style={[styles.card, styles.aboutCard]} testID="settings-about-card">
            <Text style={styles.aboutAppName}>SignalSub</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <Text style={styles.aboutTagline}>
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
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent} testID="currency-modal-container">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
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
                <MaterialIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <MaterialIcons
                name="search"
                size={20}
                color={COLORS.textSecondary}
                style={styles.modalSearchIcon}
              />
              <TextInput
                style={styles.modalSearchInput}
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
                  <MaterialIcons
                    name="close"
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredCurrencies}
              keyExtractor={(item) => item.code}
              contentContainerStyle={styles.currencyListContent}
              keyboardShouldPersistTaps="handled"
              testID="currency-list"
              renderItem={({ item }: { item: CurrencyInfo }) => {
                const isSelected = item.code === currentCurrency;
                return (
                  <TouchableOpacity
                    style={[
                      styles.currencyItem,
                      isSelected && styles.currencyItemSelected,
                    ]}
                    onPress={() => handleSelectCurrency(item.code)}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    testID={`currency-option-${item.code}`}
                  >
                    <View style={styles.currencyItemLeft}>
                      <Text style={styles.currencyFlag}>{item.flag}</Text>
                      <View style={styles.currencyTextContainer}>
                        <Text style={styles.currencyCode}>{item.code}</Text>
                        <Text style={styles.currencyName} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.currencyItemRight}>
                      <Text
                        style={[
                          styles.currencySymbol,
                          isSelected && { color: COLORS.accentPurpleLight },
                        ]}
                      >
                        {item.symbol}
                      </Text>
                      {isSelected && (
                        <MaterialIcons
                          name="check"
                          size={20}
                          color={COLORS.accentPurpleLight}
                          style={styles.currencyCheckIcon}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.08)',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.bgSurface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rowSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  notificationTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyValueText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accentPurpleLight,
    marginRight: 4,
  },
  dangerText: {
    color: COLORS.danger,
  },
  aboutCard: {
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  aboutAppName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  aboutVersion: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  aboutTagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bgPrimary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: COLORS.bgSurface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.bgSurface,
  },
  modalSearchIcon: {
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    padding: 0,
  },
  currencyListContent: {
    paddingBottom: 16,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: COLORS.bgCard,
  },
  currencyItemSelected: {
    borderColor: COLORS.accentPurple,
    backgroundColor: `${COLORS.accentPurple}26`,
  },
  currencyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  currencyFlag: {
    fontSize: 22,
    marginRight: 12,
  },
  currencyTextContainer: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currencyName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  currencyItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  currencyCheckIcon: {
    marginLeft: 8,
  },
  fieldBlock: {
    marginBottom: 16,
  },
  subfieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  profileInput: {
    backgroundColor: '#161626',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  avatarChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161626',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarChipSelected: {
    borderColor: COLORS.accentPurple,
    backgroundColor: 'rgba(123, 94, 167, 0.25)',
  },
  avatarChipEmoji: {
    fontSize: 22,
  },
  themeRowContainer: {
    gap: 10,
  },
  themeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.bgSurface,
  },
  themeOptionCardActive: {
    borderColor: COLORS.accentPurple,
    backgroundColor: 'rgba(123, 94, 167, 0.15)',
  },
  themePreviewRow: {
    flexDirection: 'row',
    marginRight: 12,
    gap: 4,
  },
  themeSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  themeTextContainer: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  themeOptionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
