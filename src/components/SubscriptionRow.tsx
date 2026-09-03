import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import type { Subscription } from '../db/schema';
import { daysUntil, formatRenewalLabel } from '../services/renewalService';
import { InitialAvatar } from './InitialAvatar';

export interface SubscriptionRowProps {
  subscription: Subscription;
  onPress?: () => void;
  onDelete?: () => void;
  onPause?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SubscriptionRow({
  subscription,
  onPress,
  onDelete,
  onPause,
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
      <View style={styles.actionsContainer} testID="swipe-actions">
        <TouchableOpacity
          style={[styles.actionButton, styles.pauseButton]}
          onPress={handlePause}
          activeOpacity={0.8}
          testID="swipe-pause-btn"
        >
          <Text style={styles.actionButtonText}>
            {isCurrentlyActive ? 'Pause' : 'Resume'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
          activeOpacity={0.8}
          testID="swipe-delete-btn"
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      containerStyle={styles.swipeableContainer}
    >
      <TouchableOpacity
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
        disabled={!onPress}
        style={[
          styles.card,
          { borderLeftColor: subscription.color || COLORS.accentPurple },
          !isCurrentlyActive && styles.inactiveCard,
          style,
        ]}
        testID={testID}
      >
        {/* Left: 40x40 circular icon */}
        {subscription.iconType === 'preset' ? (
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: subscription.color || COLORS.accentPurple },
            ]}
          >
            <MaterialCommunityIcons
              name={subscription.iconValue as any}
              size={22}
              color="#FFFFFF"
            />
          </View>
        ) : (
          <InitialAvatar
            letter={subscription.iconValue || subscription.name}
            color={subscription.color || COLORS.accentPurple}
            size={40}
            style={styles.avatar}
          />
        )}

        {/* Center: Name, trial badge, and subtitle */}
        <View style={styles.centerContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {subscription.name}
            </Text>
            {isTrialActive && (
              <View style={styles.trialBadge} testID="trial-badge">
                <Text style={styles.trialBadgeText}>Trial</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitleText} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {/* Right: Amount and billing cycle */}
        <View style={styles.rightContainer}>
          <Text style={styles.amountText}>{amountFormatted}</Text>
          {billingCycleSubtitle ? (
            <Text style={styles.billingCycleText}>{billingCycleSubtitle}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeableContainer: {
    overflow: 'hidden',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButton: {
    width: 75,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  pauseButton: {
    backgroundColor: COLORS.warning,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inactiveCard: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatar: {
    marginRight: 12,
  },
  centerContainer: {
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  trialBadge: {
    backgroundColor: '#F59E0B22',
    borderColor: COLORS.warning,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  trialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.warning,
    textTransform: 'uppercase',
  },
  subtitleText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  billingCycleText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
