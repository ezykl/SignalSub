import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { AppIcon } from './AppIcon';
import { cn } from '@/utils/cn';

export interface AppToastProps {
  visible: boolean;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppToast({
  visible,
  title,
  message,
  type = 'success',
  duration = 2600,
  onDismiss,
  style,
  testID = 'app-toast',
}: AppToastProps) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
          speed: 14,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        dismiss();
      }, duration);
    } else {
      dismiss();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, duration]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (visible) {
        onDismiss();
      }
    });
  };

  if (!visible) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  const badgeBg = isSuccess
    ? 'bg-primary/20 border-primary/40'
    : isError
    ? 'bg-rose-500/20 border-rose-500/40'
    : 'bg-cyan-500/20 border-cyan-500/40';

  const iconColor = isSuccess ? '#A78BFA' : isError ? '#F87171' : '#38BDF8';
  const iconName = isSuccess ? 'check' : isError ? 'close' : 'bell';
  const borderColor = isSuccess ? 'border-primary/50' : isError ? 'border-rose-500/50' : 'border-cyan-500/50';

  return (
    <Animated.View
      testID={testID}
      style={[
        {
          position: 'absolute',
          top: 14,
          left: 16,
          right: 16,
          zIndex: 9999,
          transform: [{ translateY }],
          opacity,
        },
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={dismiss}
        className={cn(
          'flex-row items-center p-3.5 rounded-2xl border bg-[#161626]/95 shadow-2xl shadow-purple-950/70',
          borderColor
        )}
        style={{
          elevation: 12,
        }}
      >
        {/* Glow badge */}
        <View
          className={cn(
            'w-10 h-10 rounded-xl border items-center justify-center mr-3',
            badgeBg
          )}
        >
          <AppIcon name={iconName} size={18} color={iconColor} strokeWidth={2.6} />
        </View>

        {/* Content */}
        <View className="flex-1 mr-2">
          {title ? (
            <Text className="text-[13px] font-heading font-bold text-white tracking-wide">
              {title}
            </Text>
          ) : null}
          <Text className="text-xs font-body text-slate-300 leading-4 mt-0.5">
            {message}
          </Text>
        </View>

        {/* Dismiss button */}
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-6 h-6 items-center justify-center rounded-full bg-white/5"
        >
          <AppIcon name="close" size={12} color="#94A3B8" strokeWidth={2.5} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}
