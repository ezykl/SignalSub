import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleGetStarted = () => {
    router.push('/(onboarding)/step-1');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      {/* Centered Brand Area */}
      <View style={styles.centerSection}>
        {/* Logo glow circle with icon */}
        <View style={styles.logoGlow}>
          <MaterialCommunityIcons
            name="bell-badge-outline"
            size={52}
            color={COLORS.accentPurpleLight}
          />
        </View>

        {/* App Title */}
        <Text style={styles.title}>SignalSub</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Never get surprised by an auto-charge.
        </Text>
      </View>

      {/* Bottom CTA Area */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Get Started"
        >
          <Text style={styles.buttonText}>Get Started →</Text>
        </TouchableOpacity>

        {/* Trust signal text */}
        <Text style={styles.trustSignal}>
          No account needed · Works offline
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(123, 94, 167, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: COLORS.accentPurple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  logoImage: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 20,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
    maxWidth: 280,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: COLORS.accentPurple,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: COLORS.accentPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trustSignal: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 14,
    textAlign: 'center',
  },
});
