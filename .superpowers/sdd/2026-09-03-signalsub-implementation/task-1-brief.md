# Task 1 Brief: Project Scaffold & Configuration

**Project Context:**
This is the root setup for SignalSub, an offline-first subscription tracker built with React Native and Expo (SDK 52+), Expo Router v4, and NativeWind v4.

**Working Directory:**
`c:\Users\Janre\Documents\gemini-projects\subAlert`

**Requirements:**
1. Initialize/scaffold the Expo project inside the existing directory or root structure:
   - Ensure `package.json` contains dependencies: `expo`, `expo-router`, `expo-sqlite`, `expo-notifications`, `expo-status-bar`, `expo-splash-screen`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`, `expo-linear-gradient`, `drizzle-orm`, `zustand`, `victory-native`, `nativewind`, `tailwindcss`.
   - Dev dependencies: `drizzle-kit`, `typescript`, `@types/react`, etc.
2. Configure `app.json`:
   - Name: "SignalSub"
   - Slug: "signalsub"
   - Scheme: "signalsub"
   - UserInterfaceStyle: "dark"
   - Splash: image `./assets/images/splash.png`, resizeMode `contain`, backgroundColor `#0F0F1A`
   - iOS: bundleIdentifier `com.signalsub.app`, permission string `NSUserNotificationUsageDescription`
   - Android: package `com.signalsub.app`, adaptiveIcon backgroundColor `#0F0F1A`, permissions `["RECEIVE_BOOT_COMPLETED", "POST_NOTIFICATIONS"]`
   - Plugins: `expo-router`, `expo-sqlite`, `expo-notifications`
   - Experiments: `typedRoutes: true`
3. Configure `babel.config.js`:
   - Presets: `['babel-preset-expo', { jsxImportSource: 'nativewind' }]`
   - Plugins: `['react-native-reanimated/plugin']`
4. Configure `tailwind.config.js`:
   - Include content paths: `./app/**/*.{js,jsx,ts,tsx}`, `./src/**/*.{js,jsx,ts,tsx}`
   - Presets: `[require('nativewind/preset')]`
   - Extend colors: `bg-primary` (#0F0F1A), `bg-card` (#1A1A2E), `bg-surface` (#16213E), `accent-purple` (#7B5EA7), `accent-purple-light` (#A78BFA), `text-primary` (#FFFFFF), `text-secondary` (#94A3B8), `success` (#22C55E), `warning` (#F59E0B), `danger` (#EF4444)
5. Configure `tsconfig.json`:
   - Base on expo/tsconfig.base
   - Paths alias: `"@/*": ["./src/*"]`
6. Create an initial `app/index.tsx` placeholder that boots with a dark background so compilation and types can be verified.
7. Run `npx tsc --noEmit` or verify configuration syntax without errors.
8. Commit: `feat: scaffold SignalSub Expo project and configuration`

**Report Contract:**
Write report to: `c:\Users\Janre\Documents\gemini-projects\subAlert\.superpowers\sdd\2026-09-03-signalsub-implementation\task-1-report.md`
Report must state status (DONE, DONE_WITH_CONCERNS, or BLOCKED), files created/modified, verification command run, and commit hash.