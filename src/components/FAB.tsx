import React from 'react';
import {
  StyleProp,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { cn } from '@/utils/cn';

export interface FABProps {
  onPress: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function FAB({ onPress, className, style, testID }: FABProps) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Add subscription"
      className={cn(
        'absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg z-50',
        className
      )}
      style={style}
    >
      <MaterialIcons name="add" size={28} color="#FFFFFF" />
    </TouchableOpacity>
  );
}
