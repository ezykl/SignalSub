import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/OnboardingStep';
import { COLORS } from '@/constants/colors';

export default function Step2Screen() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/(onboarding)/step-3');
  };

  const handleSkip = () => {
    router.replace('/(onboarding)/currency');
  };

  return (
    <OnboardingStep
      stepNumber={2}
      heroIcon="bell-ring-outline"
      heroColor={COLORS.warning}
      headline="Never Miss a Renewal"
      body="Get push notifications before each charge. No more surprise auto-renewals."
      nextButtonLabel="Next →"
      onNext={handleNext}
      onSkip={handleSkip}
      testID="onboarding-step-2"
    />
  );
}
