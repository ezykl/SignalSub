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
import { daysUntil } from '../services/renewalService';

export interface TrialAlertCardProps {
  subscription: Subscription;
  onCancel: () => void;
  onKeepActive: () => void;
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
  style,
  testID = 'trial-alert-card',
  referenceDate,
}: TrialAlertCardProps) {
  const days = subscription.trialEndDate
    ? daysUntil(subscription.trialEndDate, referenceDate)
    : 0;
  const endsLabel = days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
  const curr = subscription.currency || '$';
  const amountStr = `${curr} ${subscription.amount ?? 0}`;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.topRow}>
        <MaterialIcons
          name="warning"
          size={20}
          color={COLORS.amberWarning}
          style={styles.icon}
        />
        <View style={styles.content}>
          <Text style={styles.title} testID="trial-expiry-title">
            ⚠️ Free Trial Ending
          </Text>
          <Text style={styles.body} testID="trial-expiry-subtitle">
            {`${subscription.name} trial ends ${endsLabel}. Auto-charge of ${curr} ${subscription.amount} will occur.`}
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
              testID={`trial-expiry-cancelled-btn-${subscription.id}`}
              accessibilityRole="button"
              accessibilityLabel={`I Cancelled ${subscription.name}`}
            >
              <Text style={styles.cancelButtonText}>I Cancelled It</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keepButton}
              onPress={onKeepActive}
              activeOpacity={0.7}
              testID={`trial-expiry-keep-btn-${subscription.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Keep ${subscription.name} Active`}
            >
              <Text style={styles.keepButtonText}>Keep Active</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(26, 26, 46, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.amberWarning,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.amberWarning,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#E7E0E7',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E7E0E7',
  },
  keepButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.3)',
    backgroundColor: 'rgba(255, 183, 3, 0.15)',
  },
  keepButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.amberWarning,
  },
});
