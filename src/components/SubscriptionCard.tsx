import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Subscription } from '../db/schema';
import { daysUntil, formatRenewalLabel } from '../services/renewalService';
import { InitialAvatar } from './InitialAvatar';
import { NoiseOverlay } from './NoiseOverlay';

export interface SubscriptionCardProps {
  subscription: Subscription;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SubscriptionCard({
  subscription,
  onPress,
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
      style={[styles.container, style]}
      testID={testID}
    >
      <NoiseOverlay
        colors={overlayColors}
        borderRadius={16}
        style={styles.card}
      >
        <View style={styles.topRow}>
          {subscription.iconType === 'preset' ? (
            <MaterialCommunityIcons
              name={subscription.iconValue as any}
              size={28}
              color="#fff"
            />
          ) : (
            <InitialAvatar
              letter={subscription.iconValue || subscription.name}
              color="rgba(255,255,255,0.3)"
              size={28}
            />
          )}

          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{renewalText}</Text>
          </View>
        </View>

        <View style={styles.bottomArea}>
          <Text style={styles.name} numberOfLines={1}>
            {subscription.name}
          </Text>
          <Text style={styles.price}>
            {`${currency} ${amount}`}
          </Text>
        </View>
      </NoiseOverlay>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 130,
    marginRight: 12,
  },
  card: {
    width: 160,
    height: 130,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  bottomArea: {
    justifyContent: 'flex-end',
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  price: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});
