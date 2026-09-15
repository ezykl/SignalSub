import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { OnboardingDots } from '@/components/OnboardingDots';
import { BrandIcon } from '@/components/BrandIcon';
import { useSettingsStore } from '@/stores/settingsStore';

// ─── Mock subscription data ───────────────────────────────────────────────────
const MOCK_SUBS = [
  { id: '1', name: 'Netflix', category: 'Streaming', amount: '15.49', color: '#E50914', icon: 'television-play' },
  { id: '2', name: 'Spotify', category: 'Music', amount: '9.99', color: '#1DB954', icon: 'music-circle' },
  { id: '3', name: 'iCloud', category: 'Storage', amount: '2.99', color: '#3a86ff', icon: 'cloud' },
];

const FILTER_CHIPS = ['All', 'Active', 'Streaming', 'Productivity', 'Trial'];

const SEARCH_TOP = 116;  // below status bar + header
const SEARCH_HEIGHT = 44;

export default function Step2Screen() {
  const router = useRouter();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const getSetting = useSettingsStore((state) => state.getSetting);
  const hasOnboarded = getSetting('has_onboarded') === 'true';

  const handleNext = () => router.push('/(onboarding)/step-3');
  const handleSkip = () => {
    if (hasOnboarded) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(onboarding)/currency');
    }
  };

  const SIDE_MARGIN = 16;
  const spotTop = SEARCH_TOP;
  const spotLeft = SIDE_MARGIN;
  const spotW = screenW - SIDE_MARGIN * 2;
  const spotH = SEARCH_HEIGHT;
  const OVERLAY = 'rgba(0,0,0,0.78)';

  // Position callout below filter chips (search bar bottom + chips + gap)
  const calloutTop = spotTop + spotH + 56 + 12;

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      {/* ── Mock Subscriptions Screen ─────────────────────────────────── */}
      <View className="bg-background pt-[52px]" style={{ width: screenW, height: screenH }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 mb-3">
          <Text className="text-[22px] font-bold font-heading text-white">Subscriptions</Text>
          <View className="w-[38px] h-[38px] rounded-[19px] bg-card items-center justify-center">
            <MaterialIcons name="tune" size={20} color={COLORS.textSecondary} />
          </View>
        </View>

        {/* Search bar */}
        <View className="flex-row items-center gap-2 h-11 mx-4 px-3.5 rounded-xl bg-card mb-3">
          <MaterialIcons name="search" size={18} color={COLORS.textSecondary} />
          <Text className="text-sm font-body text-muted">Search subscriptions...</Text>
        </View>

        {/* Category chips */}
        <View className="flex-row px-4 gap-2 mb-4 flex-nowrap">
          {FILTER_CHIPS.map((chip, idx) => (
            <View
              key={chip}
              className={`px-3.5 py-[7px] rounded-full bg-card ${idx === 0 ? 'bg-primary' : ''}`}
            >
              <Text className={`text-[13px] ${idx === 0 ? 'text-white font-semibold font-heading' : 'text-muted font-medium font-body'}`}>
                {chip}
              </Text>
            </View>
          ))}
        </View>

        {/* Subscription rows */}
        {MOCK_SUBS.map((sub) => (
          <View
            key={sub.id}
            className="flex-row items-center mx-4 mb-2 p-3.5 rounded-xl bg-card border-l-[3px]"
            style={{ borderLeftColor: sub.color }}
          >
            <BrandIcon
              name={sub.name}
              size={36}
              iconSize={20}
              color={sub.color}
              showContainer
              className="mr-3"
            />
            <View className="flex-1">
              <Text className="text-[15px] font-semibold font-heading text-white">{sub.name}</Text>
              <Text className="text-xs text-muted mt-0.5 font-body">{sub.category} · Renews in 14d</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm font-bold font-heading text-white">${sub.amount}</Text>
              <Text className="text-xs text-muted mt-0.5 font-body">/mo</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Spotlight overlay ─────────────────────────────────────────── */}
      <View className="absolute inset-0" pointerEvents="none">
        {/* Top */}
        <View className="absolute" style={{ top: 0, left: 0, right: 0, height: spotTop, backgroundColor: OVERLAY }} />
        {/* Bottom */}
        <View className="absolute" style={{ top: spotTop + spotH, left: 0, right: 0, bottom: 0, backgroundColor: OVERLAY }} />
        {/* Left */}
        <View className="absolute" style={{ top: spotTop, left: 0, width: spotLeft, height: spotH, backgroundColor: OVERLAY }} />
        {/* Right */}
        <View className="absolute" style={{ top: spotTop, left: spotLeft + spotW, right: 0, height: spotH, backgroundColor: OVERLAY }} />
        {/* Border ring */}
        <View
          className="absolute border-2 border-[#7B5EA7]/85"
          style={{ top: spotTop, left: spotLeft, width: spotW, height: spotH, borderRadius: 12 }}
        />
      </View>

      {/* ── Callout card ─────────────────────────────────────────────── */}
      <View
        className="absolute left-4 right-4 bg-card rounded-2xl p-5 border border-[#7B5EA7]/30 gap-2.5"
        style={{ top: calloutTop }}
        pointerEvents="box-none"
      >
        <OnboardingDots total={3} current={2} />
        <Text className="text-[17px] font-bold font-heading text-white">Search & Filter Instantly</Text>
        <Text className="text-[13px] text-muted leading-[19px] font-body">
          Find any subscription in seconds. Filter by category, status, or trial.
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
