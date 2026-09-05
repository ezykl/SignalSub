import React from 'react';
import {
  StyleProp,
  StyleSheet,
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

export interface UpcomingRenewalCardProps {
  subscription: Subscription;
  onPress?: () => void;
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
      style={[styles.container, style]}
      testID={testID}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${subscription.name}, ${currency} ${amount}, ${renewalText}`}
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrapper}>
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
          <View style={styles.paymentTag}>
            <Text style={styles.paymentTagText} numberOfLines={1}>
              {paymentDef.name}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {subscription.name}
      </Text>

      <Text style={styles.price}>
        {`${currency} ${amount}`}
      </Text>

      <View style={styles.scheduleRow}>
        <MaterialIcons
          name="schedule"
          size={13}
          color={isUrgent ? COLORS.amberWarning : COLORS.textSecondary}
        />
        <Text
          style={[
            styles.scheduleText,
            isUrgent && { color: COLORS.amberWarning, fontWeight: '700' },
          ]}
          numberOfLines={1}
        >
          {renewalText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    minHeight: 140,
    backgroundColor: COLORS.glassBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 14,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 75,
  },
  paymentTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CCC4D1',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accentPurpleLight,
    marginBottom: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
