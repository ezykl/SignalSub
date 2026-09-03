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
        'bg-primary': '#0F0F1A',
        'bg-card': '#1A1A2E',
        'bg-surface': '#16213E',
        'accent-purple': '#7B5EA7',
        'accent-purple-light': '#A78BFA',
        'text-primary': '#FFFFFF',
        'text-secondary': '#94A3B8',
        'success': '#22C55E',
        'warning': '#F59E0B',
        'danger': '#EF4444',
      },
    },
  },
  plugins: [],
};
