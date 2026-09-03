import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';

interface Props {
  total: number;
  current: number; // 1-indexed
}

export function OnboardingDots({ total, current }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i + 1 === current ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 20, backgroundColor: COLORS.accentPurple },
  dotInactive: { width: 8, backgroundColor: 'rgba(255,255,255,0.3)' },
});
