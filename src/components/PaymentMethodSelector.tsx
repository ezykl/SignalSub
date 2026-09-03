import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '@/constants/colors';
import { PAYMENT_METHODS, PaymentMethodDef } from '@/constants/paymentMethods';

export interface PaymentMethodSelectorProps {
  value: string;
  details?: string;
  onChangeMethod: (methodKey: string) => void;
  onChangeDetails?: (details: string) => void;
  testID?: string;
}

export function PaymentMethodSelector({
  value,
  details = '',
  onChangeMethod,
  onChangeDetails,
  testID = 'payment-method-selector',
}: PaymentMethodSelectorProps) {
  const selectedMethod = PAYMENT_METHODS.find(
    (m) => m.key.toLowerCase() === (value || '').toLowerCase()
  ) || PAYMENT_METHODS[0];

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>PAYMENT METHOD</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        testID={`${testID}-scroll`}
      >
        {PAYMENT_METHODS.map((method) => {
          const isSelected =
            method.key.toLowerCase() === selectedMethod.key.toLowerCase();

          return (
            <TouchableOpacity
              key={method.key}
              testID={`payment-method-chip-${method.key}`}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
              ]}
              onPress={() => onChangeMethod(method.key)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Payment method: ${method.name}`}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isSelected ? method.color : 'rgba(255,255,255,0.06)' },
                ]}
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
                style={[
                  styles.chipText,
                  isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                ]}
              >
                {method.shortName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {onChangeDetails ? (
        <View style={styles.detailsContainer}>
          <TextInput
            testID={`${testID}-details-input`}
            value={details}
            onChangeText={onChangeDetails}
            placeholder={`Account / Card note (e.g. 0917 ••• 1234 or •••• 4242)`}
            placeholderTextColor={COLORS.textSecondary}
            style={styles.detailsInput}
            maxLength={40}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: 'rgba(123, 94, 167, 0.25)',
    borderColor: COLORS.accentPurple,
  },
  chipUnselected: {
    backgroundColor: '#161626',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipTextUnselected: {
    color: COLORS.textSecondary,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailsInput: {
    backgroundColor: '#161626',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
