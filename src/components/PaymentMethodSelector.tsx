import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '@/constants/colors';
import { PAYMENT_METHODS } from '@/constants/paymentMethods';
import { cn } from '@/utils/cn';

export interface PaymentMethodSelectorProps {
  value: string;
  details?: string;
  onChangeMethod: (methodKey: string) => void;
  onChangeDetails?: (details: string) => void;
  className?: string;
  testID?: string;
}

export function PaymentMethodSelector({
  value,
  details = '',
  onChangeMethod,
  onChangeDetails,
  className,
  testID = 'payment-method-selector',
}: PaymentMethodSelectorProps) {
  const selectedMethod = PAYMENT_METHODS.find(
    (m) => m.key.toLowerCase() === (value || '').toLowerCase()
  ) || PAYMENT_METHODS[0];

  return (
    <View className={cn('my-3', className)} testID={testID}>
      <Text className="text-[11px] font-bold tracking-wider text-muted mb-2">
        PAYMENT METHOD
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}
        testID={`${testID}-scroll`}
      >
        {PAYMENT_METHODS.map((method) => {
          const isSelected =
            method.key.toLowerCase() === selectedMethod.key.toLowerCase();

          return (
            <TouchableOpacity
              key={method.key}
              testID={`payment-method-chip-${method.key}`}
              className={cn(
                'flex-row items-center py-2 px-3 rounded-full border',
                isSelected
                  ? 'bg-primary/25 border-primary'
                  : 'bg-[#161626] border-white/[0.08]'
              )}
              onPress={() => onChangeMethod(method.key)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Payment method: ${method.name}`}
            >
              <View
                className="w-[22px] h-[22px] rounded-full items-center justify-center mr-1.5"
                style={{ backgroundColor: isSelected ? method.color : 'rgba(255,255,255,0.06)' }}
              >
                <Svg width={14} height={14} viewBox={method.viewBox}>
                  {method.paths
                    .filter((d) => typeof d === 'string' && /^[MmLlHhVvCcSsQqTtAaZz]/.test(d.trim()))
                    .map((d, index) => (
                      <Path
                        key={index}
                        d={d}
                        fill={isSelected ? '#FFFFFF' : method.color}
                      />
                    ))}
                </Svg>
              </View>
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
