import React from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '@/constants/colors';
import { PAYMENT_METHODS } from '@/constants/paymentMethods';
import { cn } from '@/utils/cn';

// ─── PaymentMethodLogo ──────────────────────────────────────────────────────
// Shared logo renderer: uses real SVG image file when available, else inline SVG paths.

export interface PaymentMethodLogoProps {
  methodKey: string;
  /** 'circle'  → fully round container (small variant)
   *  'squircle' → rounded-square container (large variant) */
  shape?: 'circle' | 'squircle';
  size?: number;
  isSelected?: boolean;
  testID?: string;
}

export function PaymentMethodLogo({
  methodKey,
  shape = 'circle',
  size = 28,
  isSelected = false,
  testID,
}: PaymentMethodLogoProps) {
  const method = PAYMENT_METHODS.find(
    (m) => m.key.toLowerCase() === (methodKey || '').toLowerCase()
  ) || PAYMENT_METHODS[0];

  const borderRadius = shape === 'circle' ? size / 2 : Math.round(size * 0.28);
  // For inline SVG fallbacks (no image file), show a colored background
  const fallbackBg = isSelected ? method.color : 'rgba(255,255,255,0.06)';

  return (
    <View
      testID={testID}
      style={{
        width: size,
        height: size,
        borderRadius,
        // PNG logos already have their own background — no extra fill needed
        backgroundColor: method.imageSource ? 'transparent' : fallbackBg,
        overflow: 'hidden',
      }}
    >
      {method.imageSource ? (
        // Fill the entire squircle/circle with the logo PNG (background is baked in)
        <Image
          source={method.imageSource}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : (
        <Svg
          width={size}
          height={size}
          viewBox={method.viewBox}
          style={{ alignSelf: 'center', marginTop: (size - size * 0.72) / 2 }}
        >
          {method.paths
            .filter((d) => typeof d === 'string' && /^[MmLlHhVvCcSsQqTtAaZz]/.test(d.trim()))
            .map((d, i) => (
              <Path
                key={i}
                d={d}
                fill={isSelected ? '#FFFFFF' : method.color}
              />
            ))}
        </Svg>
      )}
    </View>
  );
}

// ─── PaymentMethodSelector ──────────────────────────────────────────────────

export interface PaymentMethodSelectorProps {
  value: string;
  details?: string;
  onChangeMethod: (methodKey: string) => void;
  onChangeDetails?: (details: string) => void;
  /** 'large' = squircle logo + name label (default)
   *  'small' = circle logo only */
  size?: 'large' | 'small';
  className?: string;
  testID?: string;
}

export function PaymentMethodSelector({
  value,
  details = '',
  onChangeMethod,
  onChangeDetails,
  size = 'large',
  className,
  testID = 'payment-method-selector',
}: PaymentMethodSelectorProps) {
  const selectedMethod = PAYMENT_METHODS.find(
    (m) => m.key.toLowerCase() === (value || '').toLowerCase()
  ) || PAYMENT_METHODS[0];

  const isSmall = size === 'small';

  return (
    <View className={cn('my-3', className)} testID={testID}>
      <Text className="text-[11px] font-bold tracking-wider text-muted mb-2">
        PAYMENT METHOD
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          gap: isSmall ? 6 : 8,
          paddingVertical: 4,
        }}
        testID={`${testID}-scroll`}
      >
        {PAYMENT_METHODS.map((method) => {
          const isSelected =
            method.key.toLowerCase() === selectedMethod.key.toLowerCase();

          if (isSmall) {
            // ── Small variant: full-circle logo only, no label ──────────────
            return (
              <TouchableOpacity
                key={method.key}
                testID={`payment-method-chip-${method.key}`}
                onPress={() => onChangeMethod(method.key)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Payment method: ${method.name}`}
                style={{
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: isSelected ? method.color : 'transparent',
                  padding: isSelected ? 1 : 3,
                }}
              >
                <PaymentMethodLogo
                  methodKey={method.key}
                  shape="circle"
                  size={34}
                  isSelected={isSelected}
                  testID={`payment-logo-${method.key}`}
                />
              </TouchableOpacity>
            );
          }

          // ── Large variant: squircle logo + name label ────────────────────
          return (
            <TouchableOpacity
              key={method.key}
              testID={`payment-method-chip-${method.key}`}
              onPress={() => onChangeMethod(method.key)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Payment method: ${method.name}`}
              className={cn(
                'flex-row items-center py-2 pl-1.5 pr-3 rounded-2xl border',
                isSelected
                  ? 'bg-primary/20 border-primary'
                  : 'bg-[#161626] border-white/[0.08]'
              )}
              style={{ gap: 8 }}
            >
              <PaymentMethodLogo
                methodKey={method.key}
                shape="squircle"
                size={32}
                isSelected={isSelected}
                testID={`payment-logo-${method.key}`}
              />
              <Text
                className={cn(
                  'text-[13px] font-heading font-semibold',
                  isSelected ? 'text-white' : 'text-muted'
                )}
              >
                {method.shortName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {onChangeDetails ? (
        <View className="mt-2">
          <TextInput
            testID={`${testID}-details-input`}
            value={details}
            onChangeText={onChangeDetails}
            placeholder="Account / Card note (e.g. 0917 ••• 1234 or •••• 4242)"
            placeholderTextColor={COLORS.textSecondary}
            className="bg-[#161626] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] font-body text-white"
            maxLength={40}
          />
        </View>
      ) : null}
    </View>
  );
}

