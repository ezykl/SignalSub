export const COLORS = {
  bgPrimary: '#0F0F1A',
  bgCard: '#1A1A2E',
  bgSurface: '#16213E',
  accentPurple: '#7B5EA7',
  accentPurpleLight: '#A78BFA',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  gradientStart: '#4C1D95',
  gradientEnd: '#2E1065',
} as const;

export type ColorKey = keyof typeof COLORS;
export type ColorValue = (typeof COLORS)[ColorKey];
