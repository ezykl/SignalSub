# Application Typography: Montserrat & Roboto Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the application's typography system to use **Montserrat** as the primary font and **Roboto** as the secondary/supporting font, configured through reusable theme tokens, NativeWind classes, and proper Expo font loading.

**Architecture:** Define centralized font tokens in `src/constants/typography.ts`, extend Tailwind `fontFamily` in `tailwind.config.js` and `global.css`, load font assets in `app/_layout.tsx` before hiding the splash screen, and update components and screens to use semantic typography tokens consistently.

**Tech Stack:** React Native, Expo 52, expo-font, @expo-google-fonts/montserrat, @expo-google-fonts/roboto, NativeWind v4, Tailwind CSS v3, TypeScript.

---

### Task 1: Setup Typography Constants & Theme Tokens

**Files:**
- Create: `src/constants/typography.ts`
- Modify: `src/constants/index.ts`
- Modify: `tailwind.config.js`
- Modify: `global.css`
- Test: `src/constants/__tests__/typography.test.ts`

- [ ] **Step 1: Write the failing typography test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Create `src/constants/typography.ts` and update `src/constants/index.ts`**
- [ ] **Step 4: Update `tailwind.config.js` and `global.css` with font families**
- [ ] **Step 5: Run tests and ensure typography tests pass**

---

### Task 2: Configure Font Loading & Mocking

**Files:**
- Modify: `app/_layout.tsx`
- Modify: `src/components/__tests__/setupComponentMocks.ts`

- [ ] **Step 1: Add mock for `expo-font` in `src/components/__tests__/setupComponentMocks.ts`**
- [ ] **Step 2: Update `app/_layout.tsx` to load Montserrat and Roboto fonts before hiding splash screen**
- [ ] **Step 3: Run test suite to verify no regressions**

---

### Task 3: Update Core Shared Components Typography

**Files:**
- Modify: `src/components/StatCard.tsx`
- Modify: `src/components/SpendingCard.tsx`
- Modify: `src/components/SubscriptionCard.tsx`
- Modify: `src/components/SubscriptionRow.tsx`
- Modify: `src/components/AlertBanner.tsx`
- Modify: `src/components/TrialAlertCard.tsx`
- Modify: `src/components/UpcomingRenewalCard.tsx`
- Modify: `src/components/CategoryChip.tsx`
- Modify: `src/components/BillingCyclePill.tsx`
- Modify: `src/components/FAB.tsx`
- Modify: `src/components/OnboardingStep.tsx`
- Modify: `src/components/PaymentMethodSelector.tsx`
- Modify: `src/components/DatePickerModal.tsx`

- [ ] **Step 1: Update typography in cards and row components**
- [ ] **Step 2: Update typography in banners, chips, and modal controls**
- [ ] **Step 3: Run component tests to ensure all pass**

---

### Task 4: Update Screens Typography

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/subscriptions.tsx`
- Modify: `app/(tabs)/calendar.tsx`
- Modify: `app/(tabs)/analytics.tsx`
- Modify: `app/settings.tsx`
- Modify: `app/subscription/new.tsx`
- Modify: `app/subscription/[id].tsx`
- Modify: `app/(onboarding)/*.tsx`

- [ ] **Step 1: Update main tabs screens (`index`, `subscriptions`, `calendar`, `analytics`)**
- [ ] **Step 2: Update subscription create/edit screens and settings**
- [ ] **Step 3: Update onboarding screens**
- [ ] **Step 4: Run full test suite and TypeScript compiler checks**
