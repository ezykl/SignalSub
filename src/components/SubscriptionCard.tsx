import React from 'react';
import {
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import type { Subscription } from '../db/schema';
import { daysUntil, formatRenewalLabel } from '../services/renewalService';
import { BrandIcon } from './BrandIcon';
import { NoiseOverlay } from './NoiseOverlay';
import { cn } from '@/utils/cn';

export interface SubscriptionCardProps {
  subscription: Subscription;
  onPress?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SubscriptionCard({
  subscription,
  onPress,
  className,
  style,
  testID,
}: SubscriptionCardProps) {
  const baseColor = subscription.color || '#7B5EA7';
  const overlayColors: [string, string] = [
    `${baseColor}EE`,
    `${baseColor}99`,
  ];

  const days = daysUntil(subscription.nextRenewalDate);
  let badgeColor = 'rgba(255,255,255,0.2)';
  if (days <= 3) {
    badgeColor = '#EF4444';
  } else if (days <= 7) {
    badgeColor = '#F59E0B';
  }

  const renewalText = formatRenewalLabel(subscription.nextRenewalDate);
  const amount = (subscription.amount ?? 0).toFixed(2);
  const currency = subscription.currency || '$';

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      disabled={!onPress}
      className={cn('w-40 h-[130px] mr-3', className)}
      style={style}
      testID={testID}
    >
      <NoiseOverlay
        colors={overlayColors}
        borderRadius={16}
        className="w-40 h-[130px] rounded-2xl p-3 justify-between"
      >
        <View className="flex-row justify-between items-start">
          <BrandIcon
            name={subscription.name}
            iconType={subscription.iconType}
            iconValue={subscription.iconValue}
            size={28}
            iconSize={26}
            color="rgba(255,255,255,0.2)"
            iconColor="#FFFFFF"
          />

          <View
            className="rounded-full px-2 py-0.5 self-start"
            style={{ backgroundColor: badgeColor }}
          >
            <Text className="text-white font-body font-bold text-[10px]">
              {renewalText}
            </Text>
          </View>
        </View>

        <View className="justify-end">
          <Text className="text-sm font-heading font-bold text-white" numberOfLines={1}>
            {subscription.name}
          </Text>
          <Text className="text-[13px] font-heading font-semibold text-white/85 mt-0.5">
            {`${currency} ${amount}`}
          </Text>
        </View>
      </NoiseOverlay>
    </TouchableOpacity>
  );
}
