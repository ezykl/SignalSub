import React, { useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface NoiseOverlayProps {
  colors: readonly [string, string, ...string[]] | [string, string, ...string[]];
  className?: string;
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
  className,
  style,
  children,
  borderRadius,
  testID,
}: NoiseOverlayProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <LinearGradient
      testID={testID}
      colors={colors}
      className={className}
      style={[
        style,
        borderRadius !== undefined && { borderRadius },
        { overflow: 'hidden' },
      ]}
      onLayout={handleLayout}
    >
      {noiseAsset ? (
        <Image
          source={noiseAsset}
          resizeMode="repeat"
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              width: size.width || '100%',
              height: size.height || '100%',
              opacity: 0.1,
            },
            borderRadius !== undefined && { borderRadius },
          ]}
        />
      ) : null}
      {children}
    </LinearGradient>
  );
}