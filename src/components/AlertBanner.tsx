import React from 'react';
import {
  StyleProp,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { cn } from '@/utils/cn';

export interface AlertBannerProps {
  type: 'renewal' | 'trial';
  message: string;
  onPress?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AlertBanner({
  type,
  message,
  onPress,
  className,
  style,
  testID,
}: AlertBannerProps) {
  const isRenewal = type === 'renewal';
  const accentColor = isRenewal ? COLORS.danger : COLORS.warning;
  const iconName = isRenewal ? 'refresh' : 'warning';

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole="button"
      className={cn(
        'flex-row items-center border-l-[3px] rounded-lg py-2.5 px-3 my-1 w-full',
        isRenewal
          ? 'border-l-danger bg-danger/15'
          : 'border-l-warning bg-warning/15',
        className
      )}
      style={style}
    >
      <MaterialIcons name={iconName} size={20} color={accentColor} />
      <Text
        className="flex-1 text-[13px] font-body font-medium text-white mx-2.5"
        numberOfLines={2}
      >
        {message}
      </Text>
      <MaterialIcons name="chevron-right" size={20} color={accentColor} />
    </TouchableOpacity>
  );
}
