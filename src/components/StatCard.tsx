import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '@/constants/colors';

export interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  style,
  testID,
}: StatCardProps) {
  return (
    <View testID={testID} style={[styles.card, style]}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 16,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
});
