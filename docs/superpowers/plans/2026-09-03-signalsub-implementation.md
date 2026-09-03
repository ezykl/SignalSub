# SignalSub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build SignalSub — a personal subscription tracker React Native Expo app for iOS and Android, local-first with SQLite, push notifications, and a dark colorful UI.

**Architecture:** Expo Router v4 for file-based navigation; Drizzle ORM over expo-sqlite for typed local storage; Zustand stores hydrated from SQLite for UI state; expo-notifications for locally scheduled alerts with no backend.

**Tech Stack:** Expo SDK 52, Expo Router v4, expo-sqlite, drizzle-orm, zustand, expo-notifications, victory-native, nativewind v4, react-native-reanimated, @expo/vector-icons (MaterialIcons + MaterialCommunityIcons)

**Spec:** `docs/superpowers/specs/2026-09-03-signalsub-design.md`

## Global Constraints

- App name: SignalSub
- Tagline copy: "Never get surprised by an auto-charge."
- Platforms: iOS + Android (Expo Managed Workflow)
- Default sort: renewal date ascending (soonest first)
- Default notify_before_days: 3
- Currency: user picks on first launch, stored in settings table
- All colors from design tokens in `src/constants/colors.ts`
- All notifications are local-only (expo-notifications), no remote server
- TypeScript strict mode throughout
- NativeWind v4 for styling
- Commits after every task

---

## File Map

```
signalsub/
├── app.json
├── tailwind.config.js
├── babel.config.js
├── tsconfig.json
├── app/
│   ├── _layout.tsx
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── step-1.tsx
│   │   ├── step-2.tsx
│   │   ├── step-3.tsx
│   │   └── currency.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── subscriptions.tsx
│   │   ├── calendar.tsx
│   │   └── analytics.tsx
│   ├── subscription/
│   │   ├── new.tsx
│   │   └── [id].tsx
│   └── settings.tsx
├── src/
│   ├── db/
│   │   ├── client.ts
│   │   ├── schema.ts
│   │   └── migrations/
│   ├── stores/
│   │   ├── subscriptionStore.ts
│   │   └── settingsStore.ts
│   ├── services/
│   │   ├── notificationService.ts
│   │   ├── analyticsService.ts
│   │   └── renewalService.ts
│   ├── components/
│   │   ├── NoiseOverlay.tsx
│   │   ├── SpendingCard.tsx
│   │   ├── SubscriptionCard.tsx
│   │   ├── SubscriptionRow.tsx
│   │   ├── AlertBanner.tsx
│   │   ├── CategoryChip.tsx
│   │   ├── BillingCyclePill.tsx
│   │   ├── ServicePresetGrid.tsx
│   │   ├── InitialAvatar.tsx
│   │   ├── StatCard.tsx
│   │   └── FAB.tsx
│   └── constants/
│       ├── colors.ts
│       ├── categories.ts
│       └── servicePresets.ts
└── assets/
    └── images/
        ├── noise.png
        ├── logo.svg
        ├── icon.png
        └── splash.png
```

---

## Task 1: Project Scaffold & Configuration

**Files:** app.json, tailwind.config.js, babel.config.js, tsconfig.json

- [ ] **Step 1: Scaffold Expo project**
- [ ] **Step 2: Install dependencies** (expo-router, expo-sqlite, expo-notifications, drizzle-orm, zustand, victory-native, nativewind, etc.)
- [ ] **Step 3: Configure app.json, babel.config.js, tailwind.config.js, tsconfig.json**
- [ ] **Step 4: Verify boot on Expo**
- [ ] **Step 5: Commit**

---

## Task 2: Design Tokens & Constants

**Files:** src/constants/colors.ts, src/constants/categories.ts, src/constants/servicePresets.ts

- [ ] **Step 1: Define color tokens in colors.ts**
- [ ] **Step 2: Define categories with icons & colors in categories.ts**
- [ ] **Step 3: Define 30+ service presets in servicePresets.ts**
- [ ] **Step 4: Commit**

---

## Task 3: Database Schema & Client

**Files:** src/db/schema.ts, src/db/client.ts, drizzle.config.ts

- [ ] **Step 1: Define Drizzle SQLite schema for subscriptions, notification_log, settings**
- [ ] **Step 2: Implement SQLite client and migration helper in client.ts**
- [ ] **Step 3: Commit**

---

## Task 4: Services — renewalService & analyticsService

**Files:** src/services/renewalService.ts, src/services/analyticsService.ts

- [ ] **Step 1: Implement renewal calculation, daysUntil, formatting**
- [ ] **Step 2: Implement monthly/yearly spend calculation and category breakdown**
- [ ] **Step 3: Commit**

---

## Task 5: Notification Service

**Files:** src/services/notificationService.ts

- [ ] **Step 1: Implement permission request, schedule renewal reminder, trial alert, weekly digest**
- [ ] **Step 2: Commit**

---

## Task 6: Zustand Stores

**Files:** src/stores/settingsStore.ts, src/stores/subscriptionStore.ts

- [ ] **Step 1: Implement settings store with SQLite persistence**
- [ ] **Step 2: Implement subscription store with CRUD & notification scheduling lifecycle**
- [ ] **Step 3: Commit**

---

## Task 7: Root Layout & DB Initialization

**Files:** app/_layout.tsx

- [ ] **Step 1: Implement DB initialization and onboarding redirection**
- [ ] **Step 2: Commit**

---

## Task 8: Shared UI Components

**Files:** src/components/NoiseOverlay.tsx, InitialAvatar.tsx, CategoryChip.tsx, BillingCyclePill.tsx, FAB.tsx, AlertBanner.tsx, StatCard.tsx

- [ ] **Step 1: Implement UI primitives**
- [ ] **Step 2: Commit**

---

## Task 9: Subscription Display Components

**Files:** src/components/SpendingCard.tsx, SubscriptionCard.tsx, SubscriptionRow.tsx

- [ ] **Step 1: Implement SpendingCard, SubscriptionCard, swipeable SubscriptionRow**
- [ ] **Step 2: Commit**

---

## Task 10: Onboarding Screens

**Files:** app/(onboarding)/_layout.tsx, welcome.tsx, step-1.tsx, step-2.tsx, step-3.tsx, currency.tsx

- [ ] **Step 1: Implement 3-step skippable walkthrough and currency picker**
- [ ] **Step 2: Commit**

---

## Task 11: Bottom Tabs & Dashboard

**Files:** app/(tabs)/_layout.tsx, app/(tabs)/index.tsx

- [ ] **Step 1: Setup 4-tab bar layout**
- [ ] **Step 2: Implement Dashboard with greeting, banners, spending card, upcoming renewals horizontal scroll, and active list**
- [ ] **Step 3: Commit**

---

## Task 12: Subscriptions, Calendar, Analytics Tabs

**Files:** app/(tabs)/subscriptions.tsx, calendar.tsx, analytics.tsx

- [ ] **Step 1: Implement Subscriptions list with search, filter chips, delete/pause**
- [ ] **Step 2: Implement Calendar timeline view grouped by date**
- [ ] **Step 3: Implement Analytics with VictoryPie donut chart and metrics**
- [ ] **Step 4: Commit**

---

## Task 13: Add & Edit Subscription Modals

**Files:** app/subscription/new.tsx, app/subscription/[id].tsx

- [ ] **Step 1: Implement preset picker, form inputs, free trial toggle, notification day stepper**
- [ ] **Step 2: Implement edit & delete capabilities**
- [ ] **Step 3: Commit**

---

## Task 14: Settings Screen

**Files:** app/settings.tsx

- [ ] **Step 1: Implement currency selector, weekly digest toggle, clear data, and about info**
- [ ] **Step 2: Commit**

---

## Task 15: Assets & Final Polish

**Files:** assets/images/noise.png, icon.png, splash.png, logo.svg

- [ ] **Step 1: Organize logo and icon assets**
- [ ] **Step 2: Add 200x200 noise texture**
- [ ] **Step 3: Run end-to-end verification on iOS & Android**
- [ ] **Step 4: Final commit**