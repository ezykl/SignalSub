import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { getAppIcon } from "@/constants/appIcons";
import { cn } from "@/utils/cn";

export type AppIconName =
  | "bell"
  | "notification"
  | "notifications"
  | "house"
  | "home"
  | "layers"
  | "subscription"
  | "subscriptions"
  | "calendar"
  | "timer"
  | "settings"
  | "save"
  | "user"
  | "plus"
  | "add"
  | "add-plus"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "chevron-up"
  | "arrow-back"
  | "arrow-forward"
  | "arrow-left"
  | "arrow-right"
  | "slider"
  | "tune"
  | "dollar"
  | "currency"
  | "attach-money"
  | "chart"
  | "bar-chart"
  | "analytics"
  | "book"
  | "menu-book"
  | "guide"
  | "playlist-add"
  | "search"
  | "search-off"
  | "check"
  | "check-circle"
  | "close"
  | "x"
  | "trash"
  | "delete"
  | "edit"
  | "moon"
  | "contrast"
  | "oled"
  | (string & {});

export interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppIcon({
  name,
  size = 24,
  color = "#FFFFFF",
  strokeWidth = 2,
  fill = "none",
  className,
  style,
  testID,
}: AppIconProps) {
  const iconData = getAppIcon(name);

  if (!iconData) {
    return null;
  }

  return (
    <View
      className={cn("items-center justify-center", className)}
      style={style}
      testID={testID}
    >
      <Svg width={size} height={size} viewBox={iconData.viewBox}>
        {iconData.paths.map((d, index) => (
          <Path
            key={index}
            d={d}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={fill}
          />
        ))}
      </Svg>
    </View>
  );
}
