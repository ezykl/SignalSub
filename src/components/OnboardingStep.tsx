import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

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
  testID,
}: OnboardingStepProps) {
  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      {/* Top Bar: Progress dots + Skip button */}
      <View style={styles.topBar}>
        <View style={styles.progressContainer} accessibilityRole="progressbar" accessibilityLabel={`Step ${stepNumber} of 3`}>
          {[1, 2, 3].map((step) => {
            const isActive = step === stepNumber;
            return (
              <View
                key={step}
                testID={`step-dot-${step}${isActive ? '-active' : ''}`}
                style={[
                  styles.dot,
                  isActive
                    ? [styles.dotActive, { backgroundColor: COLORS.accentPurple }]
                    : styles.dotInactive,
                ]}
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
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area: Hero + Step Info */}
      <View style={styles.contentContainer}>
        {/* Hero Icon with ambient circular backdrop */}
        <View
          style={[
            styles.heroCircle,
            {
              backgroundColor: `${heroColor}1A`,
              borderColor: `${heroColor}33`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={heroIcon}
            size={115}
            color={heroColor}
          />
        </View>

        {/* Step indicator tag */}
        <Text style={styles.stepIndicator}>
          {`STEP ${stepNumber} OF 3`}
        </Text>

        {/* Headline */}
        <Text style={styles.headline}>
          {headline}
        </Text>

        {/* Body */}
        <Text style={styles.body}>
          {body}
        </Text>
      </View>

      {/* Bottom CTA Area */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onNext}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={nextButtonLabel}
        >
          <Text style={styles.primaryButtonText}>{nextButtonLabel}</Text>
        </TouchableOpacity>

        {subtext ? (
          <Text style={styles.subtext}>{subtext}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.28)',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  heroCircle: {
    width: 176,
    height: 176,
    borderRadius: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  stepIndicator: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.accentPurpleLight,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  headline: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  body: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.accentPurple,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: COLORS.accentPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
});
