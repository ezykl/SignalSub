import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { OnboardingDots } from '@/components/OnboardingDots';
import { AppIcon } from '@/components/AppIcon';
import { useSettingsStore } from '@/stores/settingsStore';

export default function Step1Screen() {
  const router = useRouter();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const getSetting = useSettingsStore((state) => state.getSetting);
  const hasOnboarded = getSetting('has_onboarded') === 'true';

  const handleNext = () => router.push('/(onboarding)/step-2');
  const handleSkip = () => {
    if (hasOnboarded) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(onboarding)/currency');
    }
  };

  // Elevated tab bar Add button position within the mock (centered bottom)
  const BTN_SIZE = 54;
  const spotTop = screenH - BTN_SIZE - 28;
  const spotLeft = (screenW - BTN_SIZE) / 2;
  const spotW = BTN_SIZE;
  const spotH = BTN_SIZE;
  const OVERLAY = 'rgba(0,0,0,0.78)';

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      {/* ── Mock Dashboard Screen ─────────────────────────────────────── */}
      <View className="bg-background pt-[52px]" style={{ width: screenW, height: screenH }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 mb-5">
          <View>
            <Text className="text-xl font-bold font-heading text-white">Good Morning 👋</Text>
            <Text className="text-[13px] text-muted mt-0.5 font-body">Here's your overview</Text>
          </View>
          <View className="w-[38px] h-[38px] rounded-[19px] bg-card items-center justify-center">
            <AppIcon name="bell" size={22} color={COLORS.textSecondary} />
          </View>
        </View>

        {/* Spending card */}
        <View className="mx-4 mb-6 rounded-3xl bg-surface p-5">
          <Text className="text-[11px] font-semibold font-heading text-purple-300 tracking-wider uppercase">
            MONTHLY TOTAL
          </Text>
          <Text className="text-4xl font-extrabold font-heading text-white my-1">$ 0.00</Text>
          <Text className="text-[13px] text-muted font-body">Yearly estimate: $ 0.00</Text>
        </View>

        {/* Active Subscriptions section */}
        <View className="flex-row items-center px-5 mb-3">
          <Text className="text-base font-bold font-heading text-white flex-1">Active Subscriptions</Text>
          <Text className="text-sm text-muted font-body">0</Text>
        </View>

        {/* Empty-state card */}
        <View className="mx-4 p-7 rounded-2xl bg-card items-center gap-2">
          <MaterialCommunityIcons
            name="playlist-plus"
            size={40}
            color={COLORS.textSecondary}
          />
          <Text className="text-[15px] font-semibold font-heading text-muted">No subscriptions yet</Text>
          <Text className="text-[13px] text-slate-400/60 font-body">Tap + to add your first one</Text>
        </View>

        {/* Mock Center Elevated Tab Bar Add Button */}
        <View
          className="absolute items-center justify-center rounded-full bg-primary"
          style={{
            top: spotTop,
            left: spotLeft,
            width: spotW,
            height: spotH,
            shadowColor: '#8B5CF6',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </View>
      </View>

      {/* ── Spotlight overlay (4 rectangles) ─────────────────────────── */}
      <View className="absolute inset-0" pointerEvents="none">
        {/* Top */}
        <View className="absolute" style={{ top: 0, left: 0, right: 0, height: spotTop, backgroundColor: OVERLAY }} />
        {/* Bottom */}
        <View className="absolute" style={{ top: spotTop + spotH, left: 0, right: 0, bottom: 0, backgroundColor: OVERLAY }} />
        {/* Left */}
        <View className="absolute" style={{ top: spotTop, left: 0, width: spotLeft, height: spotH, backgroundColor: OVERLAY }} />
        {/* Right */}
        <View className="absolute" style={{ top: spotTop, left: spotLeft + spotW, right: 0, height: spotH, backgroundColor: OVERLAY }} />
        {/* Spotlight border ring */}
        <View
          className="absolute border-2 border-[#7B5EA7]/85"
          style={{ top: spotTop, left: spotLeft, width: spotW, height: spotH, borderRadius: spotW / 2 }}
        />
      </View>

      {/* ── Callout card ─────────────────────────────────────────────── */}
      <View
        className="absolute left-0 right-0 mx-4 bg-card rounded-2xl p-5 border border-[#7B5EA7]/30 gap-2.5"
        style={{ bottom: screenH - spotTop + 16 }}
        pointerEvents="box-none"
      >
        <OnboardingDots total={3} current={1} />
        <Text className="text-[17px] font-bold font-heading text-white">Tap + to Add a Subscription</Text>
        <Text className="text-[13px] text-muted leading-[19px] font-body">
          Search from 50+ services or add your own. We'll track renewals automatically.
        </Text>
        <View className="flex-row items-center justify-end gap-3 mt-1">
          <TouchableOpacity onPress={handleSkip} className="px-3 py-2" activeOpacity={0.7}>
            <Text className="text-sm text-muted font-body">Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} className="bg-primary px-5 py-2.5 rounded-full" activeOpacity={0.8}>
            <Text className="text-sm font-bold font-heading text-white">Next →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
