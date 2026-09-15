import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

export interface DatePickerModalProps {
  visible: boolean;
  value: string; // "YYYY-MM-DD"
  title?: string;
  onConfirm: (dateString: string) => void;
  onCancel: () => void;
  testID?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatDateString(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || 'Select Date';
  const [y, m, d] = dateStr.split('-').map(Number);
  const monthName = MONTH_NAMES[m - 1]?.slice(0, 3) || '';
  return `${monthName} ${d}, ${y}`;
}

export function DatePickerModal({
  visible,
  value,
  title = 'Select Date',
  onConfirm,
  onCancel,
  testID = 'date-picker-modal',
}: DatePickerModalProps) {
  // Parse initial date
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [value]);

  const [displayYear, setDisplayYear] = useState(initialDate.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(initialDate.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState(value || '');

  // Reset display when opened
  React.useEffect(() => {
    if (visible) {
      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(Number);
        setDisplayYear(y);
        setDisplayMonth(m - 1);
        setSelectedDateStr(value);
      } else {
        const now = new Date();
        setDisplayYear(now.getFullYear());
        setDisplayMonth(now.getMonth());
        const pad = (n: number) => String(n).padStart(2, '0');
        setSelectedDateStr(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
      }
    }
  }, [visible, value]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  const handlePrevMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear((prev) => prev - 1);
    } else {
      setDisplayMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear((prev) => prev + 1);
    } else {
      setDisplayMonth((prev) => prev + 1);
    }
  };

  // Build grid days
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(displayYear, displayMonth, 1).getDay();
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; dateStr: string }> = [];

    // Leading blanks
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: null, dateStr: '' });
    }

    // Month days
    const pad = (n: number) => String(n).padStart(2, '0');
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${displayYear}-${pad(displayMonth + 1)}-${pad(d)}`;
      cells.push({ day: d, dateStr: dStr });
    }

    return cells;
  }, [displayYear, displayMonth]);

  const handleSelectDay = (dStr: string) => {
    setSelectedDateStr(dStr);
  };

  const handleConfirm = () => {
    onConfirm(selectedDateStr || todayStr);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID={testID}
    >
      <Pressable
        className="flex-1 bg-black/75 justify-center items-center p-5"
        onPress={onCancel}
      >
        <Pressable
          className="w-full max-w-[360px] bg-[#161626] rounded-[20px] p-5 border border-[#7B5EA7]/30"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-heading font-bold text-white">{title}</Text>
            <TouchableOpacity
              onPress={onCancel}
              className="p-1"
              testID={`${testID}-close`}
            >
              <MaterialCommunityIcons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Month Traversal Controls */}
          <View className="flex-row justify-between items-center py-2 mb-2">
            <TouchableOpacity
              testID={`${testID}-prev-month`}
              onPress={handlePrevMonth}
              className="p-1.5 rounded-lg bg-white/5"
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text className="text-[15px] font-heading font-bold text-white">
              {MONTH_NAMES[displayMonth]} {displayYear}
            </Text>

            <TouchableOpacity
              testID={`${testID}-next-month`}
              onPress={handleNextMonth}
              className="p-1.5 rounded-lg bg-white/5"
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View className="flex-row justify-around mb-1.5">
            {WEEKDAYS.map((w) => (
              <Text key={w} className="w-9 text-center text-xs font-body font-semibold text-slate-400">
                {w}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View className="flex-row flex-wrap justify-start">
            {calendarGrid.map((cell, idx) => {
              if (!cell.day) {
                return <View key={`empty-${idx}`} className="w-[14.28%] h-10 my-0.5 rounded-full" />;
              }

              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === todayStr;

              return (
                <TouchableOpacity
                  key={cell.dateStr}
                  testID={`date-cell-${cell.dateStr}`}
                  className={`w-[14.28%] h-10 justify-center items-center my-0.5 rounded-full ${
                    isSelected ? 'bg-primary' : isToday ? 'border border-primary' : ''
                  }`}
                  onPress={() => handleSelectDay(cell.dateStr)}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-sm ${
                      isSelected
                        ? 'text-white font-heading font-bold'
                        : isToday
                        ? 'text-white font-heading font-semibold'
                        : 'text-slate-200 font-body'
                    }`}
                  >
                    {cell.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Date Summary */}
          <View className="flex-row items-center justify-between bg-white/[0.04] rounded-[10px] px-3 py-2 mt-3 mb-4">
            <Text className="text-xs font-body text-slate-400">Selected:</Text>
            <Text className="text-[13px] font-heading font-bold text-white">
              {formatDateString(selectedDateStr)}
            </Text>
          </View>

          {/* Footer CTA Buttons */}
          <View className="flex-row gap-2.5">
            <TouchableOpacity
              testID={`${testID}-cancel-btn`}
              className="flex-1 py-3 rounded-xl border border-white/10 items-center justify-center"
              onPress={onCancel}
            >
              <Text className="text-sm font-heading font-semibold text-slate-400">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID={`${testID}-confirm-btn`}
              className="flex-[1.5] py-3 rounded-xl bg-primary items-center justify-center"
              onPress={handleConfirm}
            >
              <Text className="text-sm font-heading font-bold text-white">Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Field Trigger Component that opens the Modal
export interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (newDate: string) => void;
  title?: string;
  testID?: string;
}

export function DatePickerField({
  label,
  value,
  onChange,
  title,
  testID = 'date-picker-field',
}: DatePickerFieldProps) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-[11px] font-heading font-bold tracking-wider text-muted mb-2 uppercase">{label}</Text>
      <TouchableOpacity
        testID={testID}
        {...({ value, onChangeText: onChange } as any)}
        className="flex-row justify-between items-center bg-[#161626] border border-white/[0.08] rounded-xl px-3.5 py-3"
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDateString(value)}`}
      >
        <View className="flex-row items-center">
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={20}
            color={COLORS.accentPurple}
            style={{ marginRight: 10 }}
          />
          <Text className={`text-sm font-body font-medium ${value ? 'text-white' : 'text-muted'}`}>
            {value ? formatDateString(value) : 'Select date'}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={18} color="#94A3B8" />
      </TouchableOpacity>

      <DatePickerModal
        visible={modalVisible}
        value={value}
        title={title || label}
        onConfirm={(newDate) => {
          onChange(newDate);
          setModalVisible(false);
        }}
        onCancel={() => setModalVisible(false)}
        testID={`${testID}-modal`}
      />
    </View>
  );
}
