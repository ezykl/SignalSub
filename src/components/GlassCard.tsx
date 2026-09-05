import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../constants/colors';

export interface GlassCardProps {
  children?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
  glowColor?: string;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'none';
}

/**
 * GlassCard
 * Translates the Stitch design system's glass-panel element:
 * Translucent elevated background (#1A1A2E / 75%), 1px subtle white border,
 * 16px rounded corners, and optional colored glow.
 */
export function GlassCard({
  children,
  onPress,
  style,
  glow = false,
  glowColor = COLORS.glassGlow,
  testID,
  accessibilityLabel,
  accessibilityRole,
}: GlassCardProps) {
  const containerStyle = [
    styles.panel,
    glow && {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 6,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.75}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole ?? 'button'}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.glassBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
});
