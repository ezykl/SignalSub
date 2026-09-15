import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { cn } from '@/utils/cn';

export interface OnboardingStepProps {
  stepNumber: 1 | 2 | 3;
  heroIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  heroColor: string;
  headline: string;
  body: string;
  nextButtonLabel: string;
  subtext?: string;
  onNext: () => void;
  onSkip: () => void;
  className?: string;
  testID?: string;
}

export function OnboardingStep({
  stepNumber,
  heroIcon,
  heroColor,
  headline,
  body,
  nextButtonLabel,
  subtext,
  onNext,
  onSkip,
  className,
  testID,
}: OnboardingStepProps) {
  return (
    <SafeAreaView
      className={cn('flex-1 bg-background', className)}
      testID={testID}
    >
      {/* Top Bar: Progress dots + Skip button */}
      <View className="flex-row items-center justify-between px-6 pt-3 pb-2">
        <View
          className="flex-row items-center gap-2"
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${stepNumber} of 3`}
        >
          {[1, 2, 3].map((step) => {
            const isActive = step === stepNumber;
            return (
              <View
                key={step}
                testID={`step-dot-${step}${isActive ? '-active' : ''}`}
                className={`h-2 rounded-full ${isActive ? 'w-6 bg-accent' : 'w-2 bg-slate-400/[0.28]'}`}
                style={{
                  height: 8,
                  borderRadius: 4,
                  width: isActive ? 24 : 8,
                  backgroundColor: isActive ? COLORS.accentPurple : 'rgba(148, 163, 184, 0.28)',
                }}
              />
            );
          })}
        </View>

        <TouchableOpacity
          onPress={onSkip}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text className="text-[15px] font-body font-semibold text-muted">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area: Hero + Step Info */}
      <View className="flex-1 items-center justify-center px-7">
        {/* Hero Icon with ambient circular backdrop */}
        <View
          className="w-44 h-44 rounded-full items-center justify-center border-[1.5px] mb-9 shadow-xl"
          style={{
            backgroundColor: `${heroColor}1A`,
            borderColor: `${heroColor}33`,
            elevation: 6,
          }}
        >
          <MaterialCommunityIcons
            name={heroIcon}
            size={115}
            color={heroColor}
          />
        </View>

        {/* Step indicator tag */}
        <Text className="text-[11px] font-heading font-bold tracking-widest text-primary-light uppercase mb-2.5">
          {`STEP ${stepNumber} OF 3`}
        </Text>

        {/* Headline */}
        <Text className="text-[28px] font-heading font-bold text-white text-center mb-3 leading-8">
          {headline}
        </Text>

        {/* Body */}
        <Text className="text-[15px] font-body text-muted text-center leading-[22px] max-w-[320px]">
          {body}
        </Text>
      </View>

      {/* Bottom CTA Area */}
      <View className="px-6 pb-6 pt-3 items-center">
        <TouchableOpacity
          className="bg-primary py-4 px-8 rounded-full items-center justify-center w-full shadow-lg"
          style={{ elevation: 6 }}
          onPress={onNext}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={nextButtonLabel}
        >
          <Text className="text-base font-heading font-bold text-white">{nextButtonLabel}</Text>
        </TouchableOpacity>

        {subtext ? (
          <Text className="text-xs font-body text-muted mt-3 text-center">{subtext}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
