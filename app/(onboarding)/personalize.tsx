import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import {
  AVATAR_OPTIONS,
  FAVORITE_CATEGORY_OPTIONS,
} from '@/constants/personalization';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { useSettingsStore } from '@/stores/settingsStore';

export default function PersonalizeScreen() {
  const router = useRouter();
  const setSetting = useSettingsStore((state) => state.setSetting);
  const getSetting = useSettingsStore((state) => state.getSetting);

  const [alias, setAlias] = useState<string>(() => getSetting('user_alias', ''));
  const [avatar, setAvatar] = useState<string>(() => getSetting('user_avatar', '🚀') || '🚀');
  const [paymentMethod, setPaymentMethod] = useState<string>(
    () => getSetting('default_payment_method', 'card') || 'card'
  );
  const [paymentDetails, setPaymentDetails] = useState<string>(
    () => getSetting('default_payment_details', '')
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const raw = getSetting('favorite_categories', '');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleCategory = (catKey: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catKey)
        ? prev.filter((k) => k !== catKey)
        : [...prev, catKey]
    );
  };

  const handleContinue = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (alias.trim()) {
        await setSetting('user_alias', alias.trim());
      }
      await setSetting('user_avatar', avatar);
      await setSetting('default_payment_method', paymentMethod);
      if (paymentDetails.trim()) {
        await setSetting('default_payment_details', paymentDetails.trim());
      }
      await setSetting('favorite_categories', JSON.stringify(selectedCategories));
      await setSetting('has_onboarded', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save personalization settings:', error);
      router.replace('/(tabs)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await setSetting('has_onboarded', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to skip personalization:', error);
      router.replace('/(tabs)');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="personalize-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.stepBadge}>FINAL STEP</Text>
            <Text style={styles.title}>Personalize SignalSub</Text>
            <Text style={styles.subtitle}>
              Customize your profile and set defaults to make tracking effortless.
            </Text>
          </View>

          {/* 1. Nickname / Alias */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NICKNAME / ALIAS</Text>
            <View style={styles.inputContainer}>
              <TextInput
                testID="personalize-alias-input"
                style={styles.textInput}
                value={alias}
                onChangeText={setAlias}
                placeholder="e.g. Janre"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={30}
              />
            </View>
          </View>

          {/* 2. Avatar Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CHOOSE YOUR AVATAR</Text>
            <View style={styles.avatarGrid} testID="personalize-avatar-selector">
              {AVATAR_OPTIONS.map((item) => {
                const isSelected = avatar === item.emoji;
                return (
                  <TouchableOpacity
                    key={item.id}
                    testID={`avatar-option-${item.id}`}
                    style={[
                      styles.avatarOption,
                      isSelected && styles.avatarOptionSelected,
                    ]}
                    onPress={() => setAvatar(item.emoji)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${item.label} avatar`}
                  >
                    <Text style={styles.avatarEmoji}>{item.emoji}</Text>
                    <Text
                      style={[
                        styles.avatarLabel,
                        isSelected && styles.avatarLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3. Primary Payment Method */}
          <View style={styles.section}>
            <PaymentMethodSelector
              value={paymentMethod}
              details={paymentDetails}
              onChangeMethod={setPaymentMethod}
              onChangeDetails={setPaymentDetails}
              testID="personalize-payment-selector"
            />
          </View>

          {/* 4. Favorite Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FAVORITE CATEGORIES</Text>
            <Text style={styles.sectionHint}>
              Select the types of subscriptions you use most to see tailored recommendations.
            </Text>
            <View style={styles.categoryPillsContainer} testID="personalize-categories">
              {FAVORITE_CATEGORY_OPTIONS.map((cat) => {
                const isSelected = selectedCategories.includes(cat.key);
                return (
                  <TouchableOpacity
                    key={cat.key}
                    testID={`category-pill-${cat.key}`}
                    style={[
                      styles.categoryPill,
                      isSelected && styles.categoryPillSelected,
                    ]}
                    onPress={() => toggleCategory(cat.key)}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <Text style={styles.categoryPillIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.categoryPillText,
                        isSelected && styles.categoryPillTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            testID="personalize-continue-btn"
            style={[
              styles.continueButton,
              isSubmitting && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={isSubmitting}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Continue to Dashboard"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>
                Continue to Dashboard →
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="personalize-skip-btn"
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isSubmitting}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Skip for Now"
          >
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 20,
  },
  stepBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentPurpleLight,
    letterSpacing: 1.5,
    marginBottom: 6,
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
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },
  inputContainer: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textInput: {
    fontSize: 15,
    color: '#FFFFFF',
    padding: 0,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarOption: {
    width: '31.5%',
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarOptionSelected: {
    borderColor: COLORS.accentPurple,
    backgroundColor: 'rgba(123, 94, 167, 0.22)',
  },
  avatarEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  avatarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  avatarLabelSelected: {
    color: '#FFFFFF',
  },
  categoryPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryPillSelected: {
    borderColor: COLORS.accentPurple,
    backgroundColor: 'rgba(123, 94, 167, 0.25)',
  },
  categoryPillIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryPillTextSelected: {
    color: '#FFFFFF',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: COLORS.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
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
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  skipButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
