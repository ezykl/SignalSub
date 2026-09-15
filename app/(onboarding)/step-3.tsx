import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { OnboardingDots } from '@/components/OnboardingDots';
import { useSettingsStore } from '@/stores/settingsStore';

// ─── Mock chart / legend data ─────────────────────────────────────────────────
const LEGEND = [
  { label: 'Streaming', pct: 48, color: '#E50914' },
  { label: 'Music', pct: 24, color: '#1DB954' },
  { label: 'Productivity', pct: 18, color: '#3a86ff' },
  { label: 'Storage', pct: 10, color: COLORS.accentPurple },
];

const DONUT_SIZE = 140;
const DONUT_HOLE = 76;

// ─── Donut component (no SVG) ─────────────────────────────────────────────────
function MockDonut() {
  return (
    <View className="w-[140px] h-[140px] items-center justify-center">
      {/* Bottom layer: full solid circle in the largest segment color */}
      <View className="w-[140px] h-[140px] rounded-full overflow-hidden relative">
        {/* Quadrant coloring approximation using absolute quarter circles */}
        <View className="absolute w-[70px] h-[70px] top-0 left-0 bg-[#E50914]" />
        <View className="absolute w-[70px] h-[70px] top-0 right-0 bg-[#1DB954]" />
        <View className="absolute w-[70px] h-[70px] bottom-0 left-0 bg-primary" />
        <View className="absolute w-[70px] h-[70px] bottom-0 right-0 bg-[#3a86ff]" />
        {/* Center hole */}
        <View
          className="absolute w-[76px] h-[76px] rounded-full bg-card self-center items-center justify-center"
          style={{
            top: (DONUT_SIZE - DONUT_HOLE) / 2,
            left: (DONUT_SIZE - DONUT_HOLE) / 2,
          }}
        >
          <Text className="text-sm font-extrabold font-heading text-white">$28.47</Text>
          <Text className="text-[9px] text-muted mt-0.5 font-body">/ month</Text>
        </View>
      </View>
    </View>
  );
}

const CHART_SECTION_TOP = 164;
const CHART_SECTION_HEIGHT = DONUT_SIZE + 8;

export default function Step3Screen() {
  const router = useRouter();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const getSetting = useSettingsStore((state) => state.getSetting);
  const hasOnboarded = getSetting('has_onboarded') === 'true';

  const handleNext = () => {
    if (hasOnboarded) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(onboarding)/currency');
    }
  };
  const handleSkip = () => {
    if (hasOnboarded) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(onboarding)/currency');
    }
  };

  const SIDE_MARGIN = (screenW - DONUT_SIZE) / 2;
  const spotTop = CHART_SECTION_TOP;
  const spotLeft = SIDE_MARGIN;
  const spotW = DONUT_SIZE;
  const spotH = CHART_SECTION_HEIGHT;
  const OVERLAY = 'rgba(0,0,0,0.78)';

  // Callout: below the spotlight
  const calloutTop = spotTop + spotH + 16;

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      {/* ── Mock Analytics Screen ─────────────────────────────────────── */}
      <View className="bg-background pt-[52px]" style={{ width: screenW, height: screenH }}>
        {/* Header */}
        <View className="px-5 mb-4">
          <Text className="text-[22px] font-bold font-heading text-white">Analytics</Text>
        </View>

        {/* Summary row */}
        <View className="flex-row mx-4 mb-4 bg-card rounded-2xl overflow-hidden">
          <View className="flex-1 p-4 items-center">
            <Text className="text-[11px] text-muted uppercase tracking-wider mb-1 font-body">Monthly</Text>
            <Text className="text-xl font-bold font-heading text-white">$28.47</Text>
          </View>
          <View className="w-px bg-white/[0.08]" />
          <View className="flex-1 p-4 items-center">
            <Text className="text-[11px] text-muted uppercase tracking-wider mb-1 font-body">Yearly</Text>
            <Text className="text-xl font-bold font-heading text-white">$341.64</Text>
          </View>
        </View>

        {/* Donut chart */}
        <View className="items-center mb-5">
          <MockDonut />
        </View>

        {/* Legend */}
        <View className="mx-5 gap-2.5">
          {LEGEND.map((item) => (
            <View key={item.label} className="flex-row items-center gap-2.5">
              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <Text className="flex-1 text-[13px] text-muted font-body">{item.label}</Text>
              <Text className="text-[13px] font-semibold font-heading text-white">{item.pct}%</Text>
            </View>
          ))}
        </View>
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
          style={{ top: spotTop, left: spotLeft, width: spotW, height: spotH, borderRadius: DONUT_SIZE / 2 }}
        />
      </View>

      {/* ── Callout card ─────────────────────────────────────────────── */}
      <View
        className="absolute left-4 right-4 bg-card rounded-2xl p-5 border border-[#7B5EA7]/30 gap-2.5"
        style={{ top: calloutTop }}
        pointerEvents="box-none"
      >
        <OnboardingDots total={3} current={3} />
        <Text className="text-[17px] font-bold font-heading text-white">Understand Your Spending</Text>
        <Text className="text-[13px] text-muted leading-[19px] font-body">
          See a breakdown by category. Know exactly where your money goes each month.
        </Text>
        <View className="flex-row items-center justify-end gap-3 mt-1">
          <TouchableOpacity onPress={handleSkip} className="px-3 py-2" activeOpacity={0.7}>
            <Text className="text-sm text-muted font-body">Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} className="bg-primary px-5 py-2.5 rounded-full" activeOpacity={0.8}>
            <Text className="text-sm font-bold font-heading text-white">Get Started 🎉</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
