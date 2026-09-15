import React from 'react';
import {
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { cn } from '@/utils/cn';

export interface GlassCardProps {
  children?: React.ReactNode;
  onPress?: () => void;
  className?: string;
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
  className,
  style,
  glow = false,
  glowColor = COLORS.glassGlow,
  testID,
  accessibilityLabel,
  accessibilityRole,
}: GlassCardProps) {
  const glowStyle = glow
    ? {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 6,
      }
    : undefined;

  const cardClasses = cn(
    'bg-glass-bg rounded-2xl border border-glass-border overflow-hidden',
    className
  );

  if (onPress) {
    return (
      <TouchableOpacity
        className={cardClasses}
        style={[glowStyle, style]}
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
    <View className={cardClasses} style={[glowStyle, style]} testID={testID}>
      {children}
    </View>
  );
}
