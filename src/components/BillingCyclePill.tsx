import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '@/constants/colors';

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface BillingCyclePillProps {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
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
  style,
  testID,
}: BillingCyclePillProps) {
  return (
    <View testID={testID} style={[styles.container, style]}>
      {CYCLES.map((cycle) => {
        const isSelected = value === cycle.key;
        return (
          <TouchableOpacity
            key={cycle.key}
            onPress={() => onChange(cycle.key)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.segment,
              isSelected && styles.segmentSelected,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                isSelected ? styles.textSelected : styles.textUnselected,
              ]}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 9999,
    flexDirection: 'row',
    padding: 4,
    alignItems: 'center',
    width: '100%',
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  segmentSelected: {
    backgroundColor: COLORS.accentPurple,
  },
  segmentText: {
    fontSize: 12,
    textAlign: 'center',
  },
  textSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textUnselected: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
