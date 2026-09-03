import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

export interface AlertBannerProps {
  type: 'renewal' | 'trial';
  message: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AlertBanner({
  type,
  message,
  onPress,
  style,
  testID,
}: AlertBannerProps) {
  const isRenewal = type === 'renewal';
  const accentColor = isRenewal ? COLORS.danger : COLORS.warning;
  const bgColor = isRenewal ? '#EF444422' : '#F59E0B22';
  const iconName = isRenewal ? 'refresh' : 'warning';

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole="button"
      style={[
        styles.banner,
        {
          borderLeftColor: accentColor,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      <MaterialIcons name={iconName} size={20} color={accentColor} />
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <MaterialIcons name="chevron-right" size={20} color={accentColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 4,
    width: '100%',
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginHorizontal: 10,
  },
});
