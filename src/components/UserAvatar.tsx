import React from 'react';
import { Image, StyleProp, Text, View, ViewStyle } from 'react-native';
import { getAvatarById } from '../constants/personalization';
import { cn } from '@/utils/cn';

export interface UserAvatarProps {
  avatarId?: string | null;
  size?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function UserAvatar({
  avatarId,
  size = 40,
  className,
  style,
  testID,
}: UserAvatarProps) {
  const avatar = avatarId ? getAvatarById(avatarId) : null;
  const radiusStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const containerClasses = cn(
    'border-[1.5px] border-primary overflow-hidden items-center justify-center bg-[#1E1E2E]',
    className
  );

  if (avatar?.image) {
    return (
      <View
        testID={testID}
        className={containerClasses}
        style={[radiusStyle, style]}
      >
        <Image
          source={avatar.image}
          style={radiusStyle}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      testID={testID}
      className={containerClasses}
      style={[radiusStyle, style]}
    >
      <Text style={{ fontSize: size * 0.45 }}>{avatar?.emoji || '👤'}</Text>
    </View>
  );
}
