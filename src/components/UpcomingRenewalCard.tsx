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
import { daysUntil, formatRenewalLabel } from '../services/renewalService';
import { BrandIcon } from './BrandIcon';
import { getPaymentMethod } from '../constants/paymentMethods';
import { cn } from '@/utils/cn';

export interface UpcomingRenewalCardProps {
  subscription: Subscription;
  onPress?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * UpcomingRenewalCard
 * Translates the Stitch design system's horizontal "UPCOMING RENEWALS" card:
 * 160px card, glass-panel surface, brand icon squircle, payment wallet pill (GCash, Maya, etc.),
 * bold white name, purple accent price, and renewal countdown with schedule clock icon.
 */
export function UpcomingRenewalCard({
  subscription,
  onPress,
  className,
  style,
  testID,
}: UpcomingRenewalCardProps) {
  const days = daysUntil(subscription.nextRenewalDate);
  const isUrgent = days <= 3;
  const renewalText = formatRenewalLabel(subscription.nextRenewalDate);
  const currency = subscription.currency || '$';
  const amount = (subscription.amount ?? 0).toFixed(2);

  const paymentDef = subscription.paymentMethod
    ? getPaymentMethod(subscription.paymentMethod)
    : null;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      disabled={!onPress}
      className={cn(
        'w-40 min-h-[140px] bg-glass-bg rounded-2xl border border-glass-border p-3.5 mr-3 justify-between',
        className
      )}
      style={style}
      testID={testID}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${subscription.name}, ${currency} ${amount}, ${renewalText}`}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="w-[38px] h-[38px] rounded-[10px] overflow-hidden justify-center items-center">
          <BrandIcon
            name={subscription.name}
            iconType={subscription.iconType}
            iconValue={subscription.iconValue}
            size={36}
            iconSize={24}
            color="rgba(123, 94, 167, 0.15)"
            iconColor={subscription.color || COLORS.accentPurple}
          />
        </View>

        {paymentDef ? (
          <View className="bg-white/[0.08] px-[7px] py-[3px] rounded-md max-w-[75px]">
            <Text className="text-[10px] font-body font-bold text-[#CCC4D1]" numberOfLines={1}>
              {paymentDef.name}
            </Text>
          </View>
        ) : null}
      </View>

      <Text className="text-[15px] font-heading font-bold text-white mb-0.5" numberOfLines={1}>
        {subscription.name}
      </Text>

      <Text className="text-sm font-heading font-bold text-primary-light mb-2">
        {`${currency} ${amount}`}
      </Text>

      <View className="flex-row items-center gap-1">
        <MaterialIcons
          name="schedule"
          size={13}
          color={isUrgent ? COLORS.amberWarning : COLORS.textSecondary}
        />
        <Text
          className={cn(
            'text-[11px] font-body font-medium',
            isUrgent ? 'text-warning font-bold' : 'text-muted'
          )}
          numberOfLines={1}
        >
          {renewalText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
