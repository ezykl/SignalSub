import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { useSettingsStore } from '@/stores/settingsStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const getSetting = useSettingsStore((state) => state.getSetting);
  const hasOnboarded = getSetting('has_onboarded') === 'true';

  const handleGetStarted = () => {
    router.push('/(onboarding)/step-1');
  };

  const handleClose = () => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      {/* Optional Close button for returning users from Settings */}
      {hasOnboarded && (
        <View className="px-5 pt-2 flex-row justify-end">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-card/80 border border-white/[0.08] items-center justify-center"
            onPress={handleClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close guide"
            testID="welcome-close-btn"
          >
            <MaterialIcons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Centered Brand Area */}
      <View className="flex-1 items-center justify-center px-6">

        {/* Wrapper so the glow positions relative to the logo, not the screen */}
        <View className="items-center justify-center relative">

          {/* Glow blob — centered behind the logo circle */}
          <View
            className="absolute w-[440px] h-[440px] -z-8"
            style={{ alignSelf: 'center' }}
            pointerEvents="none"
          >
            <Image
              source={require("../../assets/images/effects/logo-effect.png")}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>

          {/* Logo glow circle with icon */}
   {/* Logo circle with image */}
<View className="rounded-full  items-center justify-center mb-2 shadow-lg shadow-purple-900/35 elevation-8">
  <Image
    source={require("../../assets/images/logo-colored.png")}
    className="w-[140px] h-[140px]"
    resizeMode="contain"
  />
</View>
        </View>

        {/* App Title */}
        <Text className="text-4xl font-extrabold font-heading text-white mt-5 tracking-tight text-center">
          SignalSub
        </Text>

        {/* Tagline */}
        <Text className="text-base text-muted text-center mt-3 leading-6 max-w-[280px] font-body">
          Never get surprised by an auto-charge.
        </Text>
      </View>

      {/* Bottom CTA Area */}
      <View className="px-6 pb-6 items-center">
     
<TouchableOpacity
  onPress={handleGetStarted}
  activeOpacity={0.8}
  accessibilityRole="button"
  accessibilityLabel="Get Started"
  className="w-full max-w-[340px] shadow-md shadow-purple-900/40 elevation-6"
>
  <LinearGradient
    colors={['#A277FF', '#683ACB']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    className="py-4 px-10 items-center justify-center"
    style={{ borderRadius: 9999, overflow: 'hidden' }}
  >
    <Text className="text-base font-bold font-heading text-white">Get Started</Text>
  </LinearGradient>
</TouchableOpacity>

        {/* Trust signal text */}
        <Text className="text-xs text-muted mt-3.5 text-center font-body">
          No account needed · Works offline
        </Text>
      </View>
    </View>
  );
}