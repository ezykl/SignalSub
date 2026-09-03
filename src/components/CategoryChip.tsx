import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { getCategoryByKey } from '@/constants/categories';

export interface CategoryChipProps {
  categoryKey: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function CategoryChip({
  categoryKey,
  selected = false,
  onPress,
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
      style={[
        styles.chip,
        {
          borderColor: category.color,
          backgroundColor: selected ? category.color : 'transparent',
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: selected ? '#FFFFFF' : category.color,
          },
        ]}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
