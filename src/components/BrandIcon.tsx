import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBrandIcon } from '@/constants/brandIcons';
import { InitialAvatar } from './InitialAvatar';
import { COLORS } from '@/constants/colors';

export interface BrandIconProps {
  name: string;
  iconType?: string;
  iconValue?: string;
  size?: number;
  iconSize?: number;
  color?: string;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
  showContainer?: boolean;
  testID?: string;
}

export function BrandIcon({
  name,
  iconType,
  iconValue,
  size = 40,
  iconSize,
  color,
  iconColor = '#FFFFFF',
  style,
  showContainer = false,
  testID,
}: BrandIconProps) {
  // 1. Try to find a vector brand logo by name, key, or iconValue
  const brandIcon = getBrandIcon(name) || getBrandIcon(iconValue);

  const calculatedIconSize = iconSize || (showContainer ? Math.round(size * 0.55) : size);
  const bgColor = color || brandIcon?.defaultColor || COLORS.accentPurple;

  let iconContent: React.ReactNode = null;

  if (brandIcon) {
    const validPaths = brandIcon.paths.filter(
      (d) => typeof d === 'string' && /^[MmLlHhVvCcSsQqTtAaZz]/.test(d.trim())
    );

    iconContent = (
      <Svg
        width={calculatedIconSize}
        height={calculatedIconSize}
        viewBox={brandIcon.viewBox}
      >
        {validPaths.map((d, index) => (
          <Path key={index} d={d} fill={iconColor} />
        ))}
      </Svg>
    );
  } else if (iconType === 'preset' && iconValue) {
    // Fall back to MaterialCommunityIcons if it's a known non-brand preset icon (like dumbbell)
    iconContent = (
      <MaterialCommunityIcons
        name={iconValue as any}
        size={calculatedIconSize}
        color={iconColor}
      />
    );
  } else {
    // Fall back to InitialAvatar
    return (
      <InitialAvatar
        letter={iconValue && iconValue.length === 1 ? iconValue : name}
        color={bgColor}
        size={size}
        style={style}
        testID={testID}
      />
    );
  }

  if (showContainer) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
          },
          style,
        ]}
        testID={testID}
      >
        {iconContent}
      </View>
    );
  }

  return (
    <View style={[styles.inlineWrapper, style]} testID={testID}>
      {iconContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
