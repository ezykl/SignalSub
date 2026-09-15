import React from 'react';
import {
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { cn } from '@/utils/cn';

export interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  className,
  style,
  testID,
}: StatCardProps) {
  return (
    <View
      testID={testID}
      className={cn('bg-card rounded-2xl p-4', className)}
      style={style}
    >
      <Text
        className="text-muted text-[11px] font-body font-semibold uppercase tracking-wider mb-1"
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        className="text-white text-lg font-heading font-bold"
        numberOfLines={1}
      >
        {value}
      </Text>
      {subtitle ? (
        <Text
          className="text-muted text-[11px] font-caption mt-1"
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
