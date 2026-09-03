import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { NoiseOverlay } from './NoiseOverlay';

export interface SpendingCardProps {
  monthlyTotal: number;
  yearlyTotal: number;
  currency: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SpendingCard({
  monthlyTotal,
  yearlyTotal,
  currency,
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
      style={[styles.container, style]}
      testID={testID}
    >
      <Text style={styles.label}>MONTHLY TOTAL</Text>
      <Text style={styles.heroFigure}>
        {`${curr} ${safeMonthly.toFixed(2)}`}
      </Text>
      <Text style={styles.yearlySubtitle}>
        {`Yearly estimate: ${curr} ${safeYearly.toFixed(2)}`}
      </Text>
    </NoiseOverlay>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accentPurpleLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroFigure: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  yearlySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
