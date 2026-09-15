import React from 'react';
import {
  StyleProp,
  Text,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { NoiseOverlay } from './NoiseOverlay';
import { cn } from '@/utils/cn';

export interface SpendingCardProps {
  monthlyTotal: number;
  yearlyTotal: number;
  currency: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SpendingCard({
  monthlyTotal,
  yearlyTotal,
  currency,
  className,
  style,
  testID,
}: SpendingCardProps) {
  const safeMonthly =
    typeof monthlyTotal === 'number' && !isNaN(monthlyTotal) ? monthlyTotal : 0;
  const safeYearly =
    typeof yearlyTotal === 'number' && !isNaN(yearlyTotal) ? yearlyTotal : 0;
  const curr = currency || '$';

  return (
    <NoiseOverlay
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      borderRadius={24}
      className={cn('p-5 mx-4 mb-6 rounded-3xl overflow-hidden', className)}
      style={style}
      testID={testID}
    >
      <Text className="text-xs font-heading font-semibold text-primary-light uppercase tracking-widest">
        MONTHLY TOTAL
      </Text>
      <Text className="text-4xl font-metric font-extrabold text-white my-1">
        {`${curr} ${safeMonthly.toFixed(2)}`}
      </Text>
      <Text className="text-[13px] font-body text-muted">
        {`Yearly estimate: ${curr} ${safeYearly.toFixed(2)}`}
      </Text>
    </NoiseOverlay>
  );
}
