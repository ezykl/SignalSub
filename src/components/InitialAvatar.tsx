import React from 'react';
import {
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { cn } from '@/utils/cn';

export interface InitialAvatarProps {
  letter: string;
  color: string;
  size?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function InitialAvatar({
  letter,
  color,
  size = 40,
  className,
  style,
  testID,
}: InitialAvatarProps) {
  const trimmed = letter?.trim();
  const displayChar = (trimmed && trimmed.length > 0 ? trimmed[0] : 'S').toUpperCase();
  const fontSize = Math.round(size * 0.45);

  return (
    <View
      testID={testID}
      className={cn('items-center justify-center', className)}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    >
      <Text
        className="text-white font-bold text-center"
        style={{ fontSize, includeFontPadding: false }}
      >
        {displayChar}
      </Text>
    </View>
  );
}
