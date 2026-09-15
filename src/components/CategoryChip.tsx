import React from 'react';
import {
  StyleProp,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { getCategoryByKey } from '@/constants/categories';
import { cn } from '@/utils/cn';

export interface CategoryChipProps {
  categoryKey: string;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function CategoryChip({
  categoryKey,
  selected = false,
  onPress,
  className,
  style,
  testID,
}: CategoryChipProps) {
  const category = getCategoryByKey(categoryKey);

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        'border rounded-full px-3 py-1.5 self-start items-center justify-center',
        className
      )}
      style={[
        {
          borderColor: category.color,
          backgroundColor: selected ? category.color : 'transparent',
        },
        style,
      ]}
    >
      <Text
        className="text-xs font-heading font-semibold text-center"
        style={{
          color: selected ? '#FFFFFF' : category.color,
        }}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );
}
