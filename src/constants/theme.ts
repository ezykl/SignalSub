import { useSettingsStore } from '@/stores/settingsStore';
import { COLORS } from './colors';

export type AppThemeMode = 'dark' | 'oled';

export interface ThemePalette {
  mode: AppThemeMode;
  isOled: boolean;
  bgPrimary: string;
  bgCard: string;
  bgSurface: string;
  tabBarBg: string;
  border: string;
}

export const THEME_PALETTES: Record<AppThemeMode, ThemePalette> = {
  dark: {
    mode: 'dark',
    isOled: false,
    bgPrimary: COLORS.bgPrimary, // #0F0F1A
    bgCard: COLORS.bgCard,       // #161626
    bgSurface: COLORS.bgSurface, // #232033
    tabBarBg: '#12111A',
    border: 'rgba(255, 255, 255, 0.08)',
  },
  oled: {
    mode: 'oled',
    isOled: true,
    bgPrimary: '#000000',
    bgCard: '#09090C',
    bgSurface: '#121217',
    tabBarBg: '#000000',
    border: 'rgba(255, 255, 255, 0.12)',
  },
};

export function getThemePalette(themeName?: string): ThemePalette {
  if (themeName === 'oled') {
    return THEME_PALETTES.oled;
  }
  return THEME_PALETTES.dark;
}

export function useAppTheme(): ThemePalette {
  const appTheme = useSettingsStore((state) => state.cache.app_theme || 'dark');
  return getThemePalette(appTheme);
}
