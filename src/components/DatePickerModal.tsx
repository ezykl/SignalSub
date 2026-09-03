import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
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
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.closeBtn}
              testID={`${testID}-close`}
            >
              <MaterialCommunityIcons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Month Traversal Controls */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              testID={`${testID}-prev-month`}
              onPress={handlePrevMonth}
              style={styles.navArrow}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.monthYearText}>
              {MONTH_NAMES[displayMonth]} {displayYear}
            </Text>

            <TouchableOpacity
              testID={`${testID}-next-month`}
              onPress={handleNextMonth}
              style={styles.navArrow}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekdayText}>
                {w}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.grid}>
            {calendarGrid.map((cell, idx) => {
              if (!cell.day) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }

              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === todayStr;

              return (
                <TouchableOpacity
                  key={cell.dateStr}
                  testID={`date-cell-${cell.dateStr}`}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    !isSelected && isToday && styles.dayCellToday,
                  ]}
                  onPress={() => handleSelectDay(cell.dateStr)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      !isSelected && isToday && styles.dayTextToday,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Date Summary */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Selected:</Text>
            <Text style={styles.summaryValue}>
              {formatDateString(selectedDateStr)}
            </Text>
          </View>

          {/* Footer CTA Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              testID={`${testID}-cancel-btn`}
              style={styles.cancelBtn}
              onPress={onCancel}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID={`${testID}-confirm-btn`}
              style={styles.confirmBtn}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmBtnText}>Confirm Date</Text>
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
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        testID={testID}
        {...({ value, onChangeText: onChange } as any)}
        style={styles.fieldButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDateString(value)}`}
      >
        <View style={styles.fieldLeft}>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={20}
            color={COLORS.accentPurple}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.fieldValueText, !value && styles.fieldValuePlaceholder]}>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#161626',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(123, 94, 167, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  navArrow: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekdayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: COLORS.accentPurple,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: COLORS.accentPurple,
  },
  dayText: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextToday: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Field trigger styles
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  fieldButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161626',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldValueText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  fieldValuePlaceholder: {
    color: COLORS.textSecondary,
  },
});
