import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { cn } from '@/utils/cn';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  onConfirm,
  onCancel,
  testID = 'confirm-modal',
}: ConfirmModalProps) {
  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  const badgeBg = isDanger
    ? 'bg-rose-500/15 border-rose-500/30'
    : isWarning
    ? 'bg-amber-500/15 border-amber-500/30'
    : 'bg-primary/15 border-primary/30';

  const badgeIconColor = isDanger ? '#F87171' : isWarning ? '#FBBF24' : '#A78BFA';
  const iconName = isDanger ? 'trash' : isWarning ? 'tune' : 'bell';

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
      testID={testID}
    >
      <Pressable
        className="flex-1 bg-black/75 justify-center items-center px-5"
        onPress={onCancel}
      >
        <Pressable
          className="w-full max-w-[340px] bg-[#161626] rounded-3xl p-6 border border-white/10 shadow-2xl shadow-purple-950/80 items-center"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Badge Icon */}
          <View
            className={cn(
              'w-14 h-14 rounded-2xl border items-center justify-center mb-4',
              badgeBg
            )}
          >
            <AppIcon name={iconName} size={26} color={badgeIconColor} strokeWidth={2.4} />
          </View>

          {/* Title */}
          <Text className="text-lg font-bold font-heading text-white text-center mb-2">
            {title}
          </Text>

          {/* Message */}
          <Text className="text-xs font-body text-slate-300 text-center leading-5 mb-6 px-1">
            {message}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row items-center gap-3 w-full">
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl bg-white/[0.08] border border-white/[0.06] items-center justify-center"
              onPress={onCancel}
              activeOpacity={0.7}
              testID={`${testID}-cancel-btn`}
            >
              <Text className="text-[13px] font-semibold font-heading text-slate-300">
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={cn(
                'flex-1 py-3 rounded-xl items-center justify-center',
                isDanger
                  ? 'bg-rose-500/25 border border-rose-500/40'
                  : isWarning
                  ? 'bg-amber-500/25 border border-amber-500/40'
                  : 'bg-primary'
              )}
              onPress={onConfirm}
              activeOpacity={0.8}
              testID={`${testID}-confirm-btn`}
            >
              <Text
                className={cn(
                  'text-[13px] font-bold font-heading',
                  isDanger ? 'text-rose-300' : isWarning ? 'text-amber-300' : 'text-white'
                )}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
