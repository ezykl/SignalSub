import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

export interface InitialAvatarProps {
  letter: string;
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function InitialAvatar({
  letter,
  color,
  size = 40,
  style,
  testID,
}: InitialAvatarProps) {
  const trimmed = letter?.trim();
  const displayChar = (trimmed && trimmed.length > 0 ? trimmed[0] : 'S').toUpperCase();
  const fontSize = Math.round(size * 0.45);

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{displayChar}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
