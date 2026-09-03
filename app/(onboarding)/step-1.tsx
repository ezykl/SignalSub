import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/OnboardingStep';
import { COLORS } from '@/constants/colors';

export default function Step1Screen() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/(onboarding)/step-2');
  };

  const handleSkip = () => {
    router.replace('/(onboarding)/currency');
  };

  return (
    <OnboardingStep
      stepNumber={1}
      heroIcon="plus-circle-multiple-outline"
      heroColor={COLORS.accentPurple}
      headline="Add Your Subscriptions"
      body="Search from 50+ popular services or add your own. We'll keep track so you don't have to."
      nextButtonLabel="Next →"
      subtext="Takes less than 2 minutes to set up"
      onNext={handleNext}
      onSkip={handleSkip}
      testID="onboarding-step-1"
    />
  );
}
