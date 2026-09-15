import React from 'react';
import {
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { cn } from '@/utils/cn';

export interface CategoryProgressBarProps {
  category: string;
  categoryLabel?: string;
  amount: number;
  percentage: number;
  color: string;
  currency?: string;
  count?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * CategoryProgressBar
 * Translates the Stitch design system's spending breakdown item:
 * Top label row with category name + subscription count, amount + percentage badge,
 * and a glowing rounded progress bar filled to the exact percentage.
 */
export function CategoryProgressBar({
  category,
  categoryLabel,
  amount,
  percentage,
  color,
  currency = '$',
  count,
  className,
  style,
  testID,
}: CategoryProgressBarProps) {
  const label = categoryLabel || category;
  const clampedPercent = Math.min(100, Math.max(0, percentage));
  const amountStr = `${currency} ${amount.toFixed(2)}`;

  return (
    <View
      className={cn('my-1.5 w-full', className)}
      style={style}
      testID={testID || `category-progress-${category}`}
    >
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center flex-1 mr-2">
          <View
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: color }}
          />
          <Text className="text-white text-sm font-heading font-semibold" numberOfLines={1}>
            {label}
          </Text>
          {count !== undefined && (
            <Text className="text-muted text-xs font-body ml-1">
              ({count})
            </Text>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          <Text className="text-white text-sm font-heading font-bold">{amountStr}</Text>
          <View
            className="px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: `${color}25` }}
          >
            <Text className="text-[11px] font-heading font-bold" style={{ color }}>
              {clampedPercent}%
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Track */}
      <View className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden w-full">
        <View
          className="h-full rounded-full"
          style={{
            width: `${clampedPercent}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}
