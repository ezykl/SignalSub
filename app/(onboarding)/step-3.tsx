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
import { COLORS } from '@/constants/colors';
import { OnboardingDots } from '@/components/OnboardingDots';

// ─── Mock chart / legend data ─────────────────────────────────────────────────
const LEGEND = [
  { label: 'Streaming', pct: 48, color: '#E50914' },
  { label: 'Music', pct: 24, color: '#1DB954' },
  { label: 'Productivity', pct: 18, color: '#3a86ff' },
  { label: 'Storage', pct: 10, color: COLORS.accentPurple },
];

// Donut: pure View with nested Views + borderRadius trick
// We render a solid circle and a smaller cutout circle on top.
const DONUT_SIZE = 140;
const DONUT_HOLE = 76;

// ─── Donut component (no SVG) ─────────────────────────────────────────────────
function MockDonut() {
  // Render stacked quarter arcs via gradients-free technique:
  // Use a solid circle split visually into segments using box colors stacked.
  // For a simple approximation, render colored concentric border-radius rings.
  return (
    <View style={donutStyles.wrapper}>
      {/* Bottom layer: full solid circle in the largest segment color */}
      <View style={donutStyles.ring}>
        {/* Quadrant coloring approximation using absolute quarter circles */}
        <View style={[donutStyles.quadrant, donutStyles.q1]} />
        <View style={[donutStyles.quadrant, donutStyles.q2]} />
        <View style={[donutStyles.quadrant, donutStyles.q3]} />
        <View style={[donutStyles.quadrant, donutStyles.q4]} />
        {/* Center hole */}
        <View style={donutStyles.hole}>
          <Text style={donutStyles.holeTotal}>$28.47</Text>
          <Text style={donutStyles.holeLabel}>/ month</Text>
        </View>
      </View>
    </View>
  );
}

const donutStyles = StyleSheet.create({
  wrapper: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    borderRadius: DONUT_SIZE / 2,
    overflow: 'hidden',
    position: 'relative',
  },
  quadrant: {
    position: 'absolute',
    width: DONUT_SIZE / 2,
    height: DONUT_SIZE / 2,
  },
  q1: { top: 0, left: 0, backgroundColor: '#E50914' },       // top-left  → Streaming
  q2: { top: 0, right: 0, backgroundColor: '#1DB954' },      // top-right → Music
  q3: { bottom: 0, left: 0, backgroundColor: COLORS.accentPurple }, // bottom-left → Storage
  q4: { bottom: 0, right: 0, backgroundColor: '#3a86ff' },   // bottom-right → Productivity
  hole: {
    position: 'absolute',
    width: DONUT_HOLE,
    height: DONUT_HOLE,
    borderRadius: DONUT_HOLE / 2,
    backgroundColor: COLORS.bgCard,
    alignSelf: 'center',
    top: (DONUT_SIZE - DONUT_HOLE) / 2,
    left: (DONUT_SIZE - DONUT_HOLE) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holeTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  holeLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

// Spotlight wraps the donut area
// Header: ~52 paddingTop + 22 title + 8 mb + summary row ~50 + gap ~12 = ~144 top for chart row
const CHART_SECTION_TOP = 164;
const CHART_SECTION_HEIGHT = DONUT_SIZE + 8; // a little padding

export default function Step3Screen() {
  const router = useRouter();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const handleNext = () => router.replace('/(onboarding)/currency');
  const handleSkip = () => router.replace('/(onboarding)/currency');

  const SIDE_MARGIN = (screenW - DONUT_SIZE) / 2;
  const spotTop = CHART_SECTION_TOP;
  const spotLeft = SIDE_MARGIN;
  const spotW = DONUT_SIZE;
  const spotH = CHART_SECTION_HEIGHT;
  const OVERLAY = 'rgba(0,0,0,0.78)';

  // Callout: below the spotlight
  const calloutTop = spotTop + spotH + 16;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Mock Analytics Screen ─────────────────────────────────────── */}
      <View style={[styles.mockScreen, { width: screenW, height: screenH }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>

        {/* Summary row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Monthly</Text>
            <Text style={styles.summaryAmount}>$28.47</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Yearly</Text>
            <Text style={styles.summaryAmount}>$341.64</Text>
          </View>
        </View>

        {/* Donut chart */}
        <View style={styles.chartRow}>
          <MockDonut />
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {LEGEND.map((item) => (
            <View key={item.label} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
              <Text style={styles.legendPct}>{item.pct}%</Text>
            </View>
          ))}
        </View>
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
            { top: spotTop, left: spotLeft, width: spotW, height: spotH, borderRadius: DONUT_SIZE / 2 },
          ]}
        />
      </View>

      {/* ── Callout card ─────────────────────────────────────────────── */}
      <View style={[styles.callout, { top: calloutTop }]} pointerEvents="box-none">
        <OnboardingDots total={3} current={3} />
        <Text style={styles.calloutHeadline}>Understand Your Spending</Text>
        <Text style={styles.calloutBody}>
          See a breakdown by category. Know exactly where your money goes each month.
        </Text>
        <View style={styles.calloutActions}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={styles.nextBtn} activeOpacity={0.8}>
            <Text style={styles.nextText}>Get Started 🎉</Text>
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
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chartRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  legend: {
    marginHorizontal: 20,
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  legendPct: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
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
