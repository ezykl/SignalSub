import '../global.css';
import React, { useEffect, useState } from 'react';
import { LogBox, StatusBar } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import {
  Roboto_300Light,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import { runMigrations } from '@/db/client';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { COLORS } from '@/constants/colors';

// Suppress known third-party React 18.3 defaultProps deprecation warnings (e.g. VictoryPie)
LogBox.ignoreLogs([
  'Support for defaultProps will be removed',
  'VictoryPie: Support for defaultProps',
]);

if (__DEV__) {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Support for defaultProps will be removed')
    ) {
      return;
    }
    originalConsoleError(...args);
  };
}

// Keep the splash screen visible until we explicitly hide it after DB init
// Wrapped in try/catch — in Expo Go this can throw if called after auto-hide
try {
  SplashScreen.preventAutoHideAsync();
} catch {}

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
        await Font.loadAsync({
          Montserrat_400Regular,
          Montserrat_500Medium,
          Montserrat_600SemiBold,
          Montserrat_700Bold,
          Montserrat_800ExtraBold,
          Roboto_300Light,
          Roboto_400Regular,
          Roboto_500Medium,
          Roboto_700Bold,
          // Aliases
          Montserrat: Montserrat_400Regular,
          'Montserrat-Medium': Montserrat_500Medium,
          'Montserrat-SemiBold': Montserrat_600SemiBold,
          'Montserrat-Bold': Montserrat_700Bold,
          'Montserrat-ExtraBold': Montserrat_800ExtraBold,
          Roboto: Roboto_400Regular,
          'Roboto-Light': Roboto_300Light,
          'Roboto-Medium': Roboto_500Medium,
          'Roboto-Bold': Roboto_700Bold,
        });
        await runMigrations();
        await loadSettings();
        await loadSubscriptions();
      } catch (error) {
        console.error('Failed to initialize SignalSub database/stores/fonts:', error);
      } finally {
        setIsReady(true);
        // Splash screen hides here — after DB + stores are ready
        await SplashScreen.hideAsync();
      }
    }

    init();
  }, [loadSettings, loadSubscriptions]);

  const [initialRouteResolved, setInitialRouteResolved] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    const hasOnboarded = getSetting('has_onboarded') === 'true';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    // On initial app launch, route onboarded users to tabs
    if (!initialRouteResolved) {
      setInitialRouteResolved(true);
      if (hasOnboarded && inOnboardingGroup) {
        router.replace('/(tabs)');
        return;
      }
    }

    // Guard: Un-onboarded users cannot access screens outside onboarding
    if (!hasOnboarded && !inOnboardingGroup) {
      router.replace('/(onboarding)/welcome');
    }
  }, [isReady, segments, cache, getSetting, router, initialRouteResolved]);

  // Render the Stack immediately — the splash screen overlays it until hideAsync() is called
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
