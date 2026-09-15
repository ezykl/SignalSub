import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { UserAvatar } from '@/components/UserAvatar';
import { useSettingsStore } from '@/stores/settingsStore';

export default function PersonalizeScreen() {
  const router = useRouter();
  const setSetting = useSettingsStore((state) => state.setSetting);
  const getSetting = useSettingsStore((state) => state.getSetting);

  const [alias, setAlias] = useState<string>(() => getSetting('user_alias', ''));
  const [avatar, setAvatar] = useState<string>(() => getSetting('user_avatar', 'astronaut') || 'astronaut');
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
    <SafeAreaView className="flex-1 bg-background" testID="personalize-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-5">
            <Text className="text-[11px] font-bold font-heading text-purple-300 tracking-[1.5px] mb-1.5 uppercase">
              FINAL STEP
            </Text>
            <Text className="text-2xl font-bold font-heading text-white mb-1.5">Personalize SignalSub</Text>
            <Text className="text-sm text-muted leading-5 font-body">
              Customize your profile and set defaults to make tracking effortless.
            </Text>
          </View>

          {/* 1. Nickname / Alias */}
          <View className="mb-5">
            <Text className="text-[11px] font-bold font-heading tracking-wider text-muted mb-2 uppercase">
              NICKNAME / ALIAS
            </Text>
            <View className="bg-card rounded-xl border border-white/[0.08] px-3.5 py-3">
              <TextInput
                testID="personalize-alias-input"
                className="text-[15px] font-body text-white p-0"
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
          <View className="mb-5">
            <Text className="text-[11px] font-bold font-heading tracking-wider text-muted mb-2 uppercase">
              CHOOSE YOUR AVATAR
            </Text>
            <View className="flex-row flex-wrap gap-2" testID="personalize-avatar-selector">
              {AVATAR_OPTIONS.map((item) => {
                const isSelected = avatar === item.id || avatar === item.emoji;
                return (
                  <TouchableOpacity
                    key={item.id}
                    testID={`avatar-option-${item.id}`}
                    className={`w-[31.5%] bg-card rounded-[14px] py-3 items-center justify-center border-[1.5px] ${
                      isSelected
                        ? 'border-primary bg-primary/25'
                        : 'border-white/[0.08]'
                    }`}
                    onPress={() => setAvatar(item.emoji)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${item.label} avatar`}
                  >
                    <UserAvatar avatarId={item.id} size={48} />
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-white font-bold font-heading' : 'text-muted font-body'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3. Primary Payment Method */}
          <View className="mb-5">
            <PaymentMethodSelector
              value={paymentMethod}
              details={paymentDetails}
              onChangeMethod={setPaymentMethod}
              onChangeDetails={setPaymentDetails}
              testID="personalize-payment-selector"
            />
          </View>

          {/* 4. Favorite Categories */}
          <View className="mb-5">
            <Text className="text-[11px] font-bold font-heading tracking-wider text-muted mb-2 uppercase">
              FAVORITE CATEGORIES
            </Text>
            <Text className="text-xs text-muted mb-2.5 leading-4 font-body">
              Select the types of subscriptions you use most to see tailored recommendations.
            </Text>
            <View className="flex-row flex-wrap gap-2" testID="personalize-categories">
              {FAVORITE_CATEGORY_OPTIONS.map((cat) => {
                const isSelected = selectedCategories.includes(cat.key);
                return (
                  <TouchableOpacity
                    key={cat.key}
                    testID={`category-pill-${cat.key}`}
                    className={`flex-row items-center py-[9px] px-3.5 rounded-full bg-card border ${
                      isSelected
                        ? 'border-primary bg-primary/25'
                        : 'border-white/[0.08]'
                    }`}
                    onPress={() => toggleCategory(cat.key)}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <Text className="text-sm mr-1.5">{cat.icon}</Text>
                    <Text
                      className={`text-[13px] font-semibold ${
                        isSelected ? 'text-white font-heading' : 'text-muted font-body'
                      }`}
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
        <View className="px-5 pt-3 pb-6 bg-background border-t border-white/[0.05]">
          <TouchableOpacity
            testID="personalize-continue-btn"
            className={`bg-primary py-4 rounded-full items-center justify-center shadow-md shadow-purple-900/35 elevation-6 ${
              isSubmitting ? 'opacity-60' : ''
            }`}
            onPress={handleContinue}
            disabled={isSubmitting}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Continue to Dashboard"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-base font-bold font-heading text-white">
                Continue to Dashboard →
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="personalize-skip-btn"
            className="items-center justify-center py-3 mt-1.5"
            onPress={handleSkip}
            disabled={isSubmitting}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Skip for Now"
          >
            <Text className="text-sm text-muted font-semibold font-heading">Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
