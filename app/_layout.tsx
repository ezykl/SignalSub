import '../global.css';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { runMigrations } from '@/db/client';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { COLORS } from '@/constants/colors';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const getSetting = useSettingsStore((state) => state.getSetting);
  const cache = useSettingsStore((state) => state.cache);
  const loadSubscriptions = useSubscriptionStore((state) => state.loadSubscriptions);

  useEffect(() => {
    async function init() {
      try {
        await runMigrations();
        await loadSettings();
        await loadSubscriptions();
      } catch (error) {
        console.error('Failed to initialize SignalSub database/stores:', error);
      } finally {
        setIsReady(true);
      }
    }

    init();
  }, [loadSettings, loadSubscriptions]);

  useEffect(() => {
    if (!isReady) return;

    const hasOnboarded = getSetting('has_onboarded') === 'true';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!hasOnboarded && !inOnboardingGroup) {
      router.replace('/(onboarding)/welcome');
    } else if (hasOnboarded && inOnboardingGroup) {
      router.replace('/(tabs)');
    }
  }, [isReady, segments, cache, getSetting, router]);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bgPrimary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
        <ActivityIndicator color={COLORS.accentPurple} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bgPrimary },
        }}
      />
    </GestureHandlerRootView>
  );
}
