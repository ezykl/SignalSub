import React from 'react';
import {
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import type { Subscription } from '../db/schema';
import { daysUntil } from '../services/renewalService';
import { cn } from '@/utils/cn';

export interface TrialAlertCardProps {
  subscription: Subscription;
  onCancel: () => void;
  onKeepActive: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  referenceDate?: Date | string;
}

/**
 * TrialAlertCard
 * Translates the Stitch design system's prominent warning banner:
 * Amber left-border stripe (#FFB703), glassmorphic card, clear headline,
 * auto-charge details, and immediate [I Cancelled It] / [Keep Active] action pills.
 */
export function TrialAlertCard({
  subscription,
  onCancel,
  onKeepActive,
  className,
  style,
  testID = 'trial-alert-card',
  referenceDate,
}: TrialAlertCardProps) {
  const days = subscription.trialEndDate
    ? daysUntil(subscription.trialEndDate, referenceDate)
    : 0;
  const endsLabel = days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
  const curr = subscription.currency || '$';

  return (
    <View
      className={cn(
        'bg-[#1A1A2E]/85 rounded-2xl border border-white/[0.08] border-l-4 border-l-warning p-4 mb-3 overflow-hidden',
        className
      )}
      style={style}
      testID={testID}
    >
      <View className="flex-row items-start gap-3">
        <MaterialIcons
          name="warning"
          size={20}
          color={COLORS.amberWarning}
          className="mt-0.5"
        />
        <View className="flex-1">
          <Text
            className="text-xs font-heading font-bold text-warning tracking-wide uppercase mb-1"
            testID="trial-expiry-title"
          >
            ⚠️ Free Trial Ending
          </Text>
          <Text
            className="text-sm font-body text-[#E7E0E7] leading-5 mb-3"
            testID="trial-expiry-subtitle"
          >
            {`${subscription.name} trial ends ${endsLabel}. Auto-charge of ${curr} ${subscription.amount} will occur.`}
          </Text>

          <View className="flex-row gap-2.5">
            <TouchableOpacity
              className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5"
              onPress={onCancel}
              activeOpacity={0.7}
              testID={`trial-expiry-cancelled-btn-${subscription.id}`}
              accessibilityRole="button"
              accessibilityLabel={`I Cancelled ${subscription.name}`}
            >
              <Text className="text-[13px] font-heading font-semibold text-[#E7E0E7]">
                I Cancelled It
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-3 py-1.5 rounded-lg border border-warning/30 bg-warning/15"
              onPress={onKeepActive}
              activeOpacity={0.7}
              testID={`trial-expiry-keep-btn-${subscription.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Keep ${subscription.name} Active`}
            >
              <Text className="text-[13px] font-heading font-bold text-warning">
                Keep Active
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
