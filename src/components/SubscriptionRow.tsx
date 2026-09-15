import React from 'react';
import {
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { COLORS } from '../constants/colors';
import type { Subscription } from '../db/schema';
import { daysUntil, formatRenewalLabel } from '../services/renewalService';
import { BrandIcon } from './BrandIcon';
import { getPaymentMethod } from '../constants/paymentMethods';
import { cn } from '@/utils/cn';

export interface SubscriptionRowProps {
  subscription: Subscription;
  onPress?: () => void;
  onDelete?: () => void;
  onPause?: () => void;
  onReactivate?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SubscriptionRow({
  subscription,
  onPress,
  onDelete,
  onPause,
  onReactivate,
  className,
  style,
  testID,
}: SubscriptionRowProps) {
  const isCurrentlyActive =
    subscription.isActive === 1 ||
    subscription.isActive === (true as any) ||
    (subscription.isActive !== 0 && Boolean(subscription.isActive));

  const isTrialActive = Boolean(
    subscription.isTrial === 1 &&
      (!subscription.trialEndDate || daysUntil(subscription.trialEndDate) >= 0)
  );

  const renewalLabel = formatRenewalLabel(subscription.nextRenewalDate);
  const subtitle = `${subscription.category} · ${renewalLabel}`;
  const amountFormatted = `${subscription.currency || '$'} ${(subscription.amount ?? 0).toFixed(2)}`;
  const billingCycleSubtitle = subscription.billingCycle
    ? `/${subscription.billingCycle}`
    : '';

  const renderRightActions = (
    _progress?: any,
    _dragX?: any,
    swipeableInstance?: any
  ) => {
    const handlePause = () => {
      swipeableInstance?.close?.();
      onPause?.();
    };

    const handleDelete = () => {
      swipeableInstance?.close?.();
      onDelete?.();
    };

    return (
      <View
        className="flex-row mb-2 rounded-xl overflow-hidden"
        testID="swipe-actions"
      >
        <TouchableOpacity
          className="w-[75px] justify-center items-center h-full bg-warning"
          onPress={handlePause}
          activeOpacity={0.8}
          testID="swipe-pause-btn"
        >
          <Text className="text-white font-heading font-bold text-sm">
            {isCurrentlyActive ? 'Pause' : 'Resume'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-[75px] justify-center items-center h-full bg-danger"
          onPress={handleDelete}
          activeOpacity={0.8}
          testID="swipe-delete-btn"
        >
          <Text className="text-white font-heading font-bold text-sm">Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      containerStyle={{ overflow: 'hidden' }}
    >
      <TouchableOpacity
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
        disabled={!onPress}
        className={cn(
          'bg-card rounded-xl p-4 mb-2 border-l-[3px] flex-row items-center',
          !isCurrentlyActive && 'opacity-60',
          className
        )}
        style={[
          { borderLeftColor: subscription.color || COLORS.accentPurple },
          !isCurrentlyActive && { opacity: 0.6 },
          style,
        ]}
        testID={testID}
      >
        {/* Left: 40x40 circular icon */}
        <BrandIcon
          name={subscription.name}
          iconType={subscription.iconType}
          iconValue={subscription.iconValue}
          color={subscription.color || COLORS.accentPurple}
          size={40}
          showContainer
          style={{ marginRight: 12 }}
        />

        {/* Center: Name, trial badge, and subtitle */}
        <View className="flex-1 mr-2 justify-center">
          <View className="flex-row items-center">
            <Text
              className="text-[15px] font-heading font-semibold text-white shrink"
              numberOfLines={1}
            >
              {subscription.name}
            </Text>
            {isTrialActive && (
              <View
                className="bg-warning/15 border border-warning rounded px-1.5 py-0.5 ml-1.5"
                testID="trial-badge"
              >
                <Text className="text-[10px] font-heading font-bold text-warning uppercase">
                  Trial
                </Text>
              </View>
            )}
            {subscription.status === 'cancelled' && (
              <View
                className="bg-danger/15 border border-danger rounded px-1.5 py-0.5 ml-1.5"
                testID="cancelled-badge"
              >
                <Text className="text-[10px] font-heading font-bold text-danger uppercase">
                  Cancelled
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs font-body text-muted mt-1" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {/* Right: Amount and billing cycle */}
        <View className="items-end justify-center">
          <Text className="text-sm font-heading font-bold text-white">{amountFormatted}</Text>
          {billingCycleSubtitle ? (
            <Text className="text-xs font-body text-muted mt-1">{billingCycleSubtitle}</Text>
          ) : null}
          {subscription.status === 'cancelled' && onReactivate ? (
            <TouchableOpacity
              className="bg-primary px-2.5 py-1 rounded-md mt-1 items-center justify-center"
              onPress={(e) => {
                e?.stopPropagation?.();
                onReactivate();
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Reactivate ${subscription.name}`}
              testID={`reactivate-btn-${subscription.id}`}
            >
              <Text className="text-[11px] font-heading font-bold text-white">Reactivate</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}
