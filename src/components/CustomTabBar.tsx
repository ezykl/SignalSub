import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppIcon } from '@/components/AppIcon';

export interface TabConfig {
  name: string;
  label: string;
  icon: string;
}

const TAB_CONFIGS: TabConfig[] = [
  { name: 'index', label: 'Home', icon: 'house' },
  { name: 'subscriptions', label: 'Subscription', icon: 'layers' },
  { name: 'calendar', label: 'Calendar', icon: 'calendar' },
  { name: 'profile', label: 'Profile', icon: 'user' },
];

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Find active route
  const currentRoute = state.routes[state.index];
  const currentRouteName = currentRoute?.name;

  const handleTabPress = (routeName: string) => {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return;

    const isFocused = currentRouteName === routeName;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const renderTabItem = (tab: TabConfig) => {
    const isFocused = currentRouteName === tab.name;

    return (
      <TouchableOpacity
        key={tab.name}
        onPress={() => handleTabPress(tab.name)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={tab.label}
        testID={`tab-button-${tab.name}`}
        className="flex-1 items-center justify-start pt-0 h-full relative"
      >
        {/* Top Active Indicator Pill */}
        <View
          className={`w-16 h-1 rounded-b-full mb-2 ${
            isFocused ? 'bg-[#A277FF]' : 'bg-transparent'
          }`}
          style={isFocused ? styles.activeGlow : undefined}
        />

        {/* Tab Icon */}
        <AppIcon
          name={tab.icon}
          size={24}
          color={isFocused ? '#A277FF' : '#94A3B8'}
        />

        {/* Tab Label */}
        <Text
          className={`text-[11px] mt-1 font-heading ${
            isFocused
              ? 'text-[#A277FF] font-bold'
              : 'text-[#94A3B8] font-light'
          }`}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <View
      className="bg-[#12111A] border-t border-[#232033]"
      style={[
        styles.container,
        {
          paddingBottom: bottomPadding,
          height: 62 + bottomPadding,
        },
      ]}
      testID="custom-tab-bar"
    >
      <View className="flex-row items-center justify-between w-full h-full relative">
        {/* Tab 1: Home */}
        {renderTabItem(TAB_CONFIGS[0])}

        {/* Tab 2: Subscription */}
        {renderTabItem(TAB_CONFIGS[1])}

        {/* Center Slot: Elevated Add Button */}
        <View className="flex-1 items-center justify-center relative h-full border-red">
          <TouchableOpacity
            onPress={() => router.push('/subscription/new')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Add Subscription"
            testID="tab-bar-add-button"
            style={styles.addButton}
          >
            <LinearGradient
              colors={['#A277FF', '#683ACB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <MaterialIcons name="add" size={30} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tab 3: Calendar */}
        {renderTabItem(TAB_CONFIGS[2])}

        {/* Tab 4: Profile */}
        {renderTabItem(TAB_CONFIGS[3])}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  activeGlow: {
    shadowColor: '#A277FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  addButton: {
    position: 'absolute',
    top: -24,
    width: 54,
    height: 54,
    borderRadius: 27,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  gradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
