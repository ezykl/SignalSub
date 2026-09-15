import React from 'react';
import { View } from 'react-native';
import { cn } from '@/utils/cn';

interface Props {
  total: number;
  current: number; // 1-indexed
  className?: string;
}

export function OnboardingDots({ total, current, className }: Props) {
  return (
    <View className={cn('flex-row gap-1.5 items-center', className)}>
      {Array.from({ length: total }, (_, i) => {
        const isActive = i + 1 === current;
        return (
          <View
            key={i}
            className={cn(
              'h-2 rounded-full',
              isActive ? 'w-5 bg-primary' : 'w-2 bg-white/30'
            )}
          />
        );
      })}
    </View>
  );
}
