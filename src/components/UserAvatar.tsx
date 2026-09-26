import React from 'react';
import { Image, StyleProp, Text, View, ViewStyle } from 'react-native';
import { getAvatarById } from '../constants/personalization';
import { cn } from '@/utils/cn';

export interface UserAvatarProps {
  avatarId?: string | null;
  /** Local file URI from image picker — takes priority over avatarId */
  customUri?: string | null;
  size?: number;
  /** 'circle' (default) = fully round | 'square' = rounded rectangle */
  shape?: 'circle' | 'square';
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function UserAvatar({
  avatarId,
  customUri,
  size = 40,
  shape = 'circle',
  className,
  style,
  testID,
}: UserAvatarProps) {
  const avatar = avatarId ? getAvatarById(avatarId) : null;
  const borderRadius = shape === 'square' ? Math.round(size * 0.28) : size / 2;
  const radiusStyle = { width: size, height: size, borderRadius };

  const containerClasses = cn(
    'border-[1.5px] border-primary overflow-hidden items-center justify-center bg-[#1E1E2E]',
    className
  );

  // Custom uploaded photo takes priority over preset avatars
  if (customUri) {
    return (
      <View testID={testID} className={containerClasses} style={[radiusStyle, style]}>
        <Image source={{ uri: customUri }} style={radiusStyle} resizeMode="cover" />
      </View>
    );
  }

  if (avatar?.image) {
    return (
      <View testID={testID} className={containerClasses} style={[radiusStyle, style]}>
        <Image source={avatar.image} style={radiusStyle} resizeMode="cover" />
      </View>
    );
  }

  return (
    <View testID={testID} className={containerClasses} style={[radiusStyle, style]}>
      <Text style={{ fontSize: size * 0.45 }}>{avatar?.emoji || '👤'}</Text>
    </View>
  );
}
