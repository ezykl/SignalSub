import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { AppIcon } from "@/components/AppIcon";

export interface TabConfig {
  name: string;
  label: string;
  icon: string;
}

const TAB_CONFIGS: TabConfig[] = [
  { name: "index", label: "Home", icon: "house" },
  { name: "subscriptions", label: "Subscription", icon: "layers" },
  { name: "calendar", label: "Calendar", icon: "calendar" },
  { name: "profile", label: "Profile", icon: "user" },
];

const ROUTE_COLUMN_MAP: Record<string, number> = {
  index: 0,
  subscriptions: 1,
  calendar: 3,
  profile: 4,
};

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const [barWidth, setBarWidth] = useState(windowWidth || 375);

  // Find active route
  const currentRoute = state.routes[state.index];
  const currentRouteName = currentRoute?.name;

  // Active column index (0, 1, 3, or 4)
  const activeColIndex = ROUTE_COLUMN_MAP[currentRouteName] ?? 0;
  const slideAnim = useRef(new Animated.Value(activeColIndex)).current;

  // Spring animation values for each tab (0 = inactive, 1 = active)
  const tabAnims = useRef(
    TAB_CONFIGS.map(
      (t) => new Animated.Value(currentRouteName === t.name ? 1 : 0),
    ),
  ).current;

  // Spring animation on tab change
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeColIndex,
      damping: 18,
      stiffness: 190,
      mass: 0.8,
      useNativeDriver: true,
    }).start();

    TAB_CONFIGS.forEach((tab, i) => {
      const isFocused = currentRouteName === tab.name;
      Animated.spring(tabAnims[i], {
        toValue: isFocused ? 1 : 0,
        damping: 16,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: true,
      }).start();
    });
  }, [activeColIndex, currentRouteName, slideAnim, tabAnims]);

  // Center button scale on press
  const addBtnScale = useRef(new Animated.Value(1)).current;
  const handleAddPressIn = () => {
    Animated.spring(addBtnScale, {
      toValue: 0.92,
      speed: 25,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };
  const handleAddPressOut = () => {
    Animated.spring(addBtnScale, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const colWidth = barWidth / 5;
  const indicatorTranslateX = slideAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [0, colWidth, colWidth * 2, colWidth * 3, colWidth * 4],
  });

  const handleTabPress = (routeName: string) => {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return;

    const isFocused = currentRouteName === routeName;
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const renderTabItem = (tab: TabConfig, index: number) => {
    const isFocused = currentRouteName === tab.name;
    const scale = tabAnims[index].interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.08],
    });
    const translateY = tabAnims[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, -1.5],
    });

    return (
      <TouchableOpacity
        key={tab.name}
        onPress={() => handleTabPress(tab.name)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={tab.label}
        testID={`tab-button-${tab.name}`}
        className="flex-1 items-center justify-center pt-2 h-full relative"
      >
        <Animated.View
          style={{
            alignItems: "center",
            transform: [{ scale }, { translateY }],
          }}
        >
          <AppIcon
            name={tab.icon}
            size={24}
            color={isFocused ? "#A277FF" : "#94A3B8"}
          />
          <Text
            className={`text-[10px] mt-1 font-heading ${
              isFocused
                ? "text-[#A277FF] font-semibold"
                : "text-[#94A3B8] font-normal"
            }`}
            numberOfLines={1}
          >
            {tab.label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <View
      className="bg-[#12111A] border-t border-[#232033]"
      onLayout={(e) => {
        const measuredWidth = e.nativeEvent.layout.width;
        if (measuredWidth > 0 && measuredWidth !== barWidth) {
          setBarWidth(measuredWidth);
        }
      }}
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
        {/* Animated Sliding Indicator Pill */}
        <Animated.View
          pointerEvents="none"
          testID="tab-bar-sliding-indicator"
          style={[
            styles.slidingIndicatorContainer,
            {
              width: colWidth,
              transform: [{ translateX: indicatorTranslateX }],
            },
          ]}
        >
          <View
            className="w-14 h-1 rounded-b-full bg-[#A277FF]"
            style={styles.activeGlow}
          />
        </Animated.View>

        {/* Tab 1: Home */}
        {renderTabItem(TAB_CONFIGS[0], 0)}

        {/* Tab 2: Subscription */}
        {renderTabItem(TAB_CONFIGS[1], 1)}

        {/* Center Slot: Elevated Add Button with Spring Feedback */}
        <View className="flex-1 items-center justify-center relative h-full">
          <Animated.View style={{ transform: [{ scale: addBtnScale }] }}>
            <TouchableOpacity
              onPress={() => router.push("/subscription/new")}
              onPressIn={handleAddPressIn}
              onPressOut={handleAddPressOut}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Add Subscription"
              testID="tab-bar-add-button"
              style={styles.addButton}
            >
              <LinearGradient
                colors={["#A277FF", "#683ACB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
              >
                <AppIcon name="plus" size={26} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Tab 3: Calendar */}
        {renderTabItem(TAB_CONFIGS[2], 2)}

        {/* Tab 4: Profile */}
        {renderTabItem(TAB_CONFIGS[3], 3)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "visible",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  slidingIndicatorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    zIndex: 10,
  },
  activeGlow: {
    shadowColor: "#A277FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  addButton: {
    marginTop: -24,
    width: 54,
    height: 54,
    borderRadius: 27,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },
  gradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
});
