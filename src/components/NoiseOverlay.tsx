import React from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface NoiseOverlayProps {
  colors: readonly [string, string, ...string[]] | [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  borderRadius?: number;
  testID?: string;
}

let noiseAsset: any;
try {
  noiseAsset = require('../../assets/images/noise.png');
} catch {
  noiseAsset = null;
}

export function NoiseOverlay({
  colors,
  style,
  children,
  borderRadius,
  testID,
}: NoiseOverlayProps) {
  return (
    <LinearGradient
      testID={testID}
      colors={colors}
      style={[
        styles.container,
        style,
        borderRadius !== undefined && { borderRadius },
        { overflow: 'hidden' },
      ]}
    >
      {noiseAsset ? (
        <Image
          source={noiseAsset}
          style={[
            StyleSheet.absoluteFill,
            styles.noiseImage,
            borderRadius !== undefined && { borderRadius },
          ]}
          resizeMode="repeat"
        />
      ) : null}
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  noiseImage: {
    opacity: 0.1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});
