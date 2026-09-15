/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Semantic design tokens
        background: '#0F0F1A',
        card: '#1A1A2E',
        surface: '#16213E',
        primary: {
          DEFAULT: '#7B5EA7',
          light: '#A78BFA',
        },
        muted: '#94A3B8',
        coral: '#FF6584',
        cyan: '#38EF7D',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        glass: {
          bg: 'rgba(26, 26, 46, 0.75)',
          border: 'rgba(255, 255, 255, 0.08)',
          glow: 'rgba(123, 94, 167, 0.35)',
        },
        // Backward-compatible aliases
        'bg-primary': '#0F0F1A',
        'bg-card': '#1A1A2E',
        'bg-surface': '#16213E',
        'accent-purple': '#7B5EA7',
        'accent-purple-light': '#A78BFA',
        'text-primary': '#FFFFFF',
        'text-secondary': '#94A3B8',
        // Stitch Design Tokens
        'app-bg': '#0F0F1A',
        'app-card': '#1A1A2E',
        'app-purple': '#7B5EA7',
        'app-coral': '#FF6584',
        'app-cyan': '#38EF7D',
        'app-warning': '#FFB703',
      },
      fontFamily: {
        // Default sans
        sans: ['Roboto_400Regular', 'Roboto', 'sans-serif'],
        // Primary (Montserrat)
        montserrat: ['Montserrat_400Regular', 'Montserrat', 'sans-serif'],
        'montserrat-medium': ['Montserrat_500Medium', 'Montserrat-Medium', 'sans-serif'],
        'montserrat-semibold': ['Montserrat_600SemiBold', 'Montserrat-SemiBold', 'sans-serif'],
        'montserrat-bold': ['Montserrat_700Bold', 'Montserrat-Bold', 'sans-serif'],
        'montserrat-extrabold': ['Montserrat_800ExtraBold', 'Montserrat-ExtraBold', 'sans-serif'],
        // Secondary (Roboto)
        roboto: ['Roboto_400Regular', 'Roboto', 'sans-serif'],
        'roboto-light': ['Roboto_300Light', 'Roboto-Light', 'sans-serif'],
        'roboto-medium': ['Roboto_500Medium', 'Roboto-Medium', 'sans-serif'],
        'roboto-bold': ['Roboto_700Bold', 'Roboto-Bold', 'sans-serif'],
        // Semantic tokens
        heading: ['Montserrat_700Bold', 'Montserrat-Bold', 'sans-serif'],
        subheading: ['Montserrat_600SemiBold', 'Montserrat-SemiBold', 'sans-serif'],
        body: ['Roboto_400Regular', 'Roboto', 'sans-serif'],
        caption: ['Roboto_400Regular', 'Roboto', 'sans-serif'],
        primary: ['Montserrat_400Regular', 'Montserrat', 'sans-serif'],
        secondary: ['Roboto_400Regular', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
