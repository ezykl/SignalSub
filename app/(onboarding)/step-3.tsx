import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/OnboardingStep';
import { COLORS } from '@/constants/colors';

export default function Step3Screen() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/(onboarding)/currency');
  };

  const handleSkip = () => {
    router.replace('/(onboarding)/currency');
  };

  return (
    <OnboardingStep
      stepNumber={3}
      heroIcon="chart-donut"
      heroColor={COLORS.success}
      headline="See Where Your Money Goes"
      body="Get a clear breakdown of your spending by category. Know exactly what you're paying for."
      nextButtonLabel="Get Started 🎉"
      subtext="No account needed · Works offline"
      onNext={handleNext}
      onSkip={handleSkip}
      testID="onboarding-step-3"
    />
  );
}
