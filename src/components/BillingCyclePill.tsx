import React from 'react';
import {
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { cn } from '@/utils/cn';

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface BillingCyclePillProps {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const CYCLES: { key: BillingCycle; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'yearly', label: 'Yearly' },
];

export function BillingCyclePill({
  value,
  onChange,
  className,
  style,
  testID,
}: BillingCyclePillProps) {
  return (
    <View
      testID={testID}
      className={cn('bg-surface rounded-full flex-row p-1 items-center w-full', className)}
      style={style}
    >
      {CYCLES.map((cycle) => {
        const isSelected = value === cycle.key;
        return (
          <TouchableOpacity
            key={cycle.key}
            onPress={() => onChange(cycle.key)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className={cn(
              'flex-1 py-2 rounded-full items-center justify-center',
              isSelected ? 'bg-primary' : 'bg-transparent'
            )}
          >
            <Text
              className={cn(
                'text-xs text-center font-heading',
                isSelected ? 'text-white font-semibold' : 'text-muted font-medium'
              )}
              numberOfLines={1}
            >
              {cycle.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
