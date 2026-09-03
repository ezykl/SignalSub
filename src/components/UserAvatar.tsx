import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { getAvatarById } from '../constants/personalization';
import { COLORS } from '../constants/colors';

export interface UserAvatarProps {
  avatarId?: string | null;
  size?: number;
  style?: ViewStyle;
  testID?: string;
}

export function UserAvatar({
  avatarId,
  size = 40,
  style,
  testID,
}: UserAvatarProps) {
  const avatar = avatarId ? getAvatarById(avatarId) : null;

  if (avatar?.image) {
    return (
      <View
        testID={testID}
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
      >
        <Image
          source={avatar.image}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        styles.fallbackContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.45 }}>{avatar?.emoji || '👤'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderColor: COLORS.accentPurple,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E2E',
  },
  fallbackContainer: {
    backgroundColor: '#1E1E2E',
  },
});
