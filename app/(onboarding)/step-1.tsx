import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { OnboardingDots } from '@/components/OnboardingDots';

// ─── spotlight config (relative to mock screen) ─────────────────────────────
// The FAB is positioned bottom:24, right:24, width:56, height:56
// We compute it inside the component using screen dimensions.

export default function Step1Screen() {
  const router = useRouter();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const handleNext = () => router.push('/(onboarding)/step-2');
  const handleSkip = () => router.replace('/(onboarding)/currency');

  // FAB position within the mock (absolute bottom-right)
  const FAB_SIZE = 56;
  const FAB_MARGIN = 24;
  const spotTop = screenH - FAB_SIZE - FAB_MARGIN - 16; // 16 = approx status bar
  const spotLeft = screenW - FAB_SIZE - FAB_MARGIN;
  const spotW = FAB_SIZE;
  const spotH = FAB_SIZE;
  const OVERLAY = 'rgba(0,0,0,0.78)';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Mock Dashboard Screen ─────────────────────────────────────── */}
      <View style={[styles.mockScreen, { width: screenW, height: screenH }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Good Morning 👋</Text>
            <Text style={styles.headerSubtitle}>Here's your overview</Text>
          </View>
          <View style={styles.headerIconBtn}>
            <MaterialIcons name="notifications-none" size={22} color={COLORS.textSecondary} />
          </View>
        </View>

        {/* Spending card */}
        <View style={styles.spendingCard}>
          <Text style={styles.spendingLabel}>MONTHLY TOTAL</Text>
          <Text style={styles.spendingAmount}>$ 0.00</Text>
          <Text style={styles.spendingYearly}>Yearly estimate: $ 0.00</Text>
        </View>

        {/* Active Subscriptions section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Subscriptions</Text>
          <Text style={styles.sectionCount}>0</Text>
        </View>

        {/* Empty-state card */}
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons
            name="playlist-plus"
            size={40}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyText}>No subscriptions yet</Text>
          <Text style={styles.emptySubtext}>Tap + to add your first one</Text>
        </View>

        {/* FAB */}
        <View style={styles.fab}>
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </View>
      </View>

      {/* ── Spotlight overlay (4 rectangles) ─────────────────────────── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top */}
        <View style={[styles.overlay, { top: 0, left: 0, right: 0, height: spotTop, backgroundColor: OVERLAY }]} />
        {/* Bottom */}
        <View style={[styles.overlay, { top: spotTop + spotH, left: 0, right: 0, bottom: 0, backgroundColor: OVERLAY }]} />
        {/* Left */}
        <View style={[styles.overlay, { top: spotTop, left: 0, width: spotLeft, height: spotH, backgroundColor: OVERLAY }]} />
        {/* Right */}
        <View style={[styles.overlay, { top: spotTop, left: spotLeft + spotW, right: 0, height: spotH, backgroundColor: OVERLAY }]} />
        {/* Spotlight border ring */}
        <View
          style={[
            styles.spotlightBorder,
            { top: spotTop, left: spotLeft, width: spotW, height: spotH, borderRadius: spotW / 2 },
          ]}
        />
      </View>

      {/* ── Callout card ─────────────────────────────────────────────── */}
      <View style={[styles.callout, { bottom: screenH - spotTop + 16 }]} pointerEvents="box-none">
        <OnboardingDots total={3} current={1} />
        <Text style={styles.calloutHeadline}>Tap + to Add a Subscription</Text>
        <Text style={styles.calloutBody}>
          Search from 50+ services or add your own. We'll track renewals automatically.
        </Text>
        <View style={styles.calloutActions}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={styles.nextBtn} activeOpacity={0.8}>
            <Text style={styles.nextText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  // ── Mock screen ──────────────────────────────────────────────────────────
  mockScreen: {
    backgroundColor: COLORS.bgPrimary,
    paddingTop: 52,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerGreeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spendingCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: COLORS.gradientStart,
    padding: 20,
  },
  spendingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentPurpleLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  spendingAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  spendingYearly: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    marginHorizontal: 16,
    padding: 28,
    borderRadius: 16,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptySubtext: {
    fontSize: 13,
    color: 'rgba(148,163,184,0.6)',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Spotlight overlay ────────────────────────────────────────────────────
  overlay: {
    position: 'absolute',
  },
  spotlightBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(123,94,167,0.85)',
  },
  // ── Callout card ─────────────────────────────────────────────────────────
  callout: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginHorizontal: 16,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(123,94,167,0.3)',
    gap: 10,
  },
  calloutHeadline: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  calloutBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  calloutActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  nextBtn: {
    backgroundColor: COLORS.accentPurple,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  nextText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
