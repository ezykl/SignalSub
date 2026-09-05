import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../constants/colors';

export interface CategoryProgressBarProps {
  category: string;
  categoryLabel?: string;
  amount: number;
  percentage: number;
  color: string;
  currency?: string;
  count?: number;
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
  style,
  testID,
}: CategoryProgressBarProps) {
  const label = categoryLabel || category;
  const clampedPercent = Math.min(100, Math.max(0, percentage));
  const amountStr = `${currency} ${amount.toFixed(2)}`;

  return (
    <View style={[styles.container, style]} testID={testID || `category-progress-${category}`}>
      <View style={styles.headerRow}>
        <View style={styles.leftInfo}>
          <View style={[styles.indicatorDot, { backgroundColor: color }]} />
          <Text style={styles.categoryTitle} numberOfLines={1}>
            {label}
          </Text>
          {count !== undefined && (
            <Text style={styles.countText}>
              ({count})
            </Text>
          )}
        </View>

        <View style={styles.rightInfo}>
          <Text style={styles.amountText}>{amountStr}</Text>
          <View style={[styles.badge, { backgroundColor: `${color}25` }]}>
            <Text style={[styles.badgeText, { color }]}>{clampedPercent}%</Text>
          </View>
        </View>
      </View>

      {/* Progress Track */}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedPercent}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  countText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  rightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
