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
import { BrandIcon } from '@/components/BrandIcon';

// ─── Mock subscription data ───────────────────────────────────────────────────
const MOCK_SUBS = [
  { id: '1', name: 'Netflix', category: 'Streaming', amount: '15.49', color: '#E50914', icon: 'television-play' },
  { id: '2', name: 'Spotify', category: 'Music', amount: '9.99', color: '#1DB954', icon: 'music-circle' },
  { id: '3', name: 'iCloud', category: 'Storage', amount: '2.99', color: '#3a86ff', icon: 'cloud' },
];

const FILTER_CHIPS = ['All', 'Active', 'Streaming', 'Productivity', 'Trial'];

// Spotlight: Search bar is typically at top:56+48+searchBarMargin ≈ top:122
// We compute precisely in component.
const SEARCH_TOP = 116;  // below status bar + header
const SEARCH_HEIGHT = 44;

export default function Step2Screen() {
  const router = useRouter();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const handleNext = () => router.push('/(onboarding)/step-3');
  const handleSkip = () => router.replace('/(onboarding)/currency');

  const SIDE_MARGIN = 16;
  const spotTop = SEARCH_TOP;
  const spotLeft = SIDE_MARGIN;
  const spotW = screenW - SIDE_MARGIN * 2;
  const spotH = SEARCH_HEIGHT;
  const OVERLAY = 'rgba(0,0,0,0.78)';

  // Position callout below filter chips (search bar bottom + chips + gap)
  const calloutTop = spotTop + spotH + 56 + 12; // chips row height ~56

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Mock Subscriptions Screen ─────────────────────────────────── */}
      <View style={[styles.mockScreen, { width: screenW, height: screenH }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Subscriptions</Text>
          <View style={styles.headerIconBtn}>
            <MaterialIcons name="tune" size={20} color={COLORS.textSecondary} />
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={18} color={COLORS.textSecondary} />
          <Text style={styles.searchPlaceholder}>Search subscriptions...</Text>
        </View>

        {/* Category chips */}
        <View style={styles.chipsRow}>
          {FILTER_CHIPS.map((chip, idx) => (
            <View
              key={chip}
              style={[styles.chip, idx === 0 && styles.chipActive]}
            >
              <Text style={[styles.chipText, idx === 0 && styles.chipTextActive]}>
                {chip}
              </Text>
            </View>
          ))}
        </View>

        {/* Subscription rows */}
        {MOCK_SUBS.map((sub) => (
          <View key={sub.id} style={[styles.subRow, { borderLeftColor: sub.color }]}>
            <BrandIcon
              name={sub.name}
              size={36}
              iconSize={20}
              color={sub.color}
              showContainer
              style={styles.subIcon}
            />
            <View style={styles.subCenter}>
              <Text style={styles.subName}>{sub.name}</Text>
              <Text style={styles.subCategory}>{sub.category} · Renews in 14d</Text>
            </View>
            <View style={styles.subRight}>
              <Text style={styles.subAmount}>${sub.amount}</Text>
              <Text style={styles.subCycle}>/mo</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Spotlight overlay ─────────────────────────────────────────── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top */}
        <View style={[styles.overlay, { top: 0, left: 0, right: 0, height: spotTop, backgroundColor: OVERLAY }]} />
        {/* Bottom */}
        <View style={[styles.overlay, { top: spotTop + spotH, left: 0, right: 0, bottom: 0, backgroundColor: OVERLAY }]} />
        {/* Left */}
        <View style={[styles.overlay, { top: spotTop, left: 0, width: spotLeft, height: spotH, backgroundColor: OVERLAY }]} />
        {/* Right */}
        <View style={[styles.overlay, { top: spotTop, left: spotLeft + spotW, right: 0, height: spotH, backgroundColor: OVERLAY }]} />
        {/* Border ring */}
        <View
          style={[
            styles.spotlightBorder,
            { top: spotTop, left: spotLeft, width: spotW, height: spotH, borderRadius: 12 },
          ]}
        />
      </View>

      {/* ── Callout card ─────────────────────────────────────────────── */}
      <View style={[styles.callout, { top: calloutTop }]} pointerEvents="box-none">
        <OnboardingDots total={3} current={2} />
        <Text style={styles.calloutHeadline}>Search & Filter Instantly</Text>
        <Text style={styles.calloutBody}>
          Find any subscription in seconds. Filter by category, status, or trial.
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
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: SEARCH_HEIGHT,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.bgCard,
    marginBottom: 12,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
    flexWrap: 'nowrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
  },
  chipActive: {
    backgroundColor: COLORS.accentPurple,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.bgCard,
    borderLeftWidth: 3,
  },
  subIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subCenter: {
    flex: 1,
  },
  subName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  subRight: {
    alignItems: 'flex-end',
  },
  subAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subCycle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    left: 16,
    right: 16,
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
