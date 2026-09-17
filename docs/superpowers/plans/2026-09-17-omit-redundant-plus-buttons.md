# Omit Redundant Plus Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove duplicate Floating Action Buttons (FAB "+") from Home and Subscription screens now that a persistent central Add (+) button exists in the custom bottom navigation tab bar, and update onboarding mock UI and tests accordingly.

**Architecture:** The bottom tab bar (`CustomTabBar.tsx`) already renders a prominent elevated center Add button linking to `/subscription/new` that is visible across all primary tab views (`Home`, `Subscription`, `Calendar`, `Profile`). The legacy floating `<FAB />` buttons on `app/(tabs)/index.tsx` and `app/(tabs)/subscriptions.tsx` create visual redundancy and overlap. We remove these screen-level FABs, clean up a stray debug class in `CustomTabBar`, align the onboarding walkthrough in `app/(onboarding)/step-1.tsx` to highlight the center tab bar button, and update the test suite to ensure the screen-level FABs are omitted.

**Tech Stack:** React Native (Expo Router v4, NativeWind / Tailwind CSS, React Navigation Bottom Tabs, Node.js test runner with `tsx`).

**Spec:** Redundant UI cleanup following the introduction of the elevated center tab bar Add button in `src/components/CustomTabBar.tsx`.

## Global Constraints

- Never break bottom tab bar navigation or links to `/subscription/new`.
- Maintain clean TypeScript types without warnings or lint errors.
- Keep in-page empty-state call-to-action buttons (e.g. "Add Subscription" inside the zero-data card) intact, as they guide users when lists are empty.
- Tests must pass via `npx tsx --test`.

---

### Task 1: Remove Redundant FAB from Home Screen (`app/(tabs)/index.tsx`)

**Files:**
- Modify: `app/(tabs)/index.tsx:20-30,445-458`
- Test: `src/components/__tests__/dashboard.test.ts:385-395`

**Interfaces:**
- Consumes: `app/(tabs)/index.tsx` default export `DashboardScreen`
- Produces: Cleaned `DashboardScreen` without `dashboard-fab` element

- [x] **Step 1: Write the failing test**

In `src/components/__tests__/dashboard.test.ts`, update the FAB assertion to verify that `dashboard-fab` is no longer rendered on `DashboardScreen`:

```typescript
      // Verify FAB has been omitted from Dashboard screen (elevated tab bar button handles this)
      const fab = findByTestId(element, 'dashboard-fab');
      assert.equal(fab, null, 'dashboard-fab should not be rendered on the Dashboard screen');
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/components/__tests__/dashboard.test.ts`
Expected: FAIL with `AssertionError: dashboard-fab should not be rendered on the Dashboard screen`

- [x] **Step 3: Write minimal implementation**

In `app/(tabs)/index.tsx`:
1. Remove `FAB` from the import list on line 24:
```typescript
import {
  AlertBanner,
  AppIcon,
  BillingCyclePill,
  CategoryChip,
  GlassCard,
  SpendingCard,
  SubscriptionRow,
  UserAvatar,
} from '@/components';
```
2. Remove the `<FAB />` component render at lines 451-455:
```diff
-      {/* Floating Action Button */}
-      <FAB
-        onPress={() => router.push('/subscription/new')}
-        testID="dashboard-fab"
-      />
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/components/__tests__/dashboard.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add app/\(tabs\)/index.tsx src/components/__tests__/dashboard.test.ts
git commit -m "fix(ui): remove redundant FAB from Home dashboard screen"
```

---

### Task 2: Remove Redundant FAB from Subscription Screen (`app/(tabs)/subscriptions.tsx`)

**Files:**
- Modify: `app/(tabs)/subscriptions.tsx:15-22,250-260`
- Test: `src/components/__tests__/tabs.test.ts:310-316`

**Interfaces:**
- Consumes: `app/(tabs)/subscriptions.tsx` default export `SubscriptionsScreen`
- Produces: Cleaned `SubscriptionsScreen` without `subscriptions-fab` element

- [x] **Step 1: Write the failing test**

In `src/components/__tests__/tabs.test.ts`, update the FAB assertion around line 311 to verify that `subscriptions-fab` is no longer rendered on `SubscriptionsScreen`:

```typescript
        // Verify FAB has been omitted from Subscriptions screen (elevated tab bar button handles this)
        const fab = findByTestId(element, 'subscriptions-fab');
        assert.equal(fab, null, 'subscriptions-fab should not be rendered on the Subscriptions screen');
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/components/__tests__/tabs.test.ts`
Expected: FAIL with `AssertionError: subscriptions-fab should not be rendered on the Subscriptions screen`

- [x] **Step 3: Write minimal implementation**

In `app/(tabs)/subscriptions.tsx`:
1. Change import on line 18:
```typescript
import { SubscriptionRow } from '@/components';
```
2. Remove the `<FAB />` component render at lines 252-256:
```diff
-      {/* Floating Action Button */}
-      <FAB
-        onPress={() => router.push('/subscription/new')}
-        testID="subscriptions-fab"
-      />
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/components/__tests__/tabs.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add app/\(tabs\)/subscriptions.tsx src/components/__tests__/tabs.test.ts
git commit -m "fix(ui): remove redundant FAB from Subscriptions screen"
```

---

### Task 3: Clean Up CustomTabBar Debug Class and Align Onboarding Step 1

**Files:**
- Modify: `src/components/CustomTabBar.tsx:115-120`
- Modify: `app/(onboarding)/step-1.tsx:30-40,80-105`
- Test: `src/components/__tests__/customTabBar.test.ts:125-135`

**Interfaces:**
- Consumes: `CustomTabBar.tsx` layout and `step-1.tsx` spotlight calculations
- Produces: Cleaned `CustomTabBar` center container and aligned onboarding spotlight

- [x] **Step 1: Write the failing test**

In `src/components/__tests__/customTabBar.test.ts`, add an assertion in `renders tab bar container, 4 tabs, and center Add button` checking that the center slot container does not include temporary debug styles like `border-red`:

```typescript
    const centerSlot = addBtn.parent || element;
    assert.ok(!JSON.stringify(element).includes('border-red'), 'Center slot should not contain border-red debug style');
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/components/__tests__/customTabBar.test.ts`
Expected: FAIL with `AssertionError: Center slot should not contain border-red debug style`

- [x] **Step 3: Write minimal implementation**

1. In `src/components/CustomTabBar.tsx` line 117, remove `border-red`:
```tsx
        {/* Center Slot: Elevated Add Button */}
        <View className="flex-1 items-center justify-center relative h-full">
          <TouchableOpacity
            onPress={() => router.push("/subscription/new")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Add Subscription"
            testID="tab-bar-add-button"
            style={styles.addButton}
          >
```

2. In `app/(onboarding)/step-1.tsx`, update the mock UI and spotlight ring so it spotlights the center bottom tab bar add button rather than an obsolete bottom-right FAB:
```tsx
  // Elevated tab bar Add button position within the mock (centered bottom)
  const BTN_SIZE = 54;
  const spotTop = screenH - BTN_SIZE - 28;
  const spotLeft = (screenW - BTN_SIZE) / 2;
  const spotW = BTN_SIZE;
  const spotH = BTN_SIZE;
```
And update the rendered mock button at line 83:
```tsx
        {/* Mock Center Elevated Tab Bar Add Button */}
        <View
          className="absolute items-center justify-center rounded-full bg-primary"
          style={{
            top: spotTop,
            left: spotLeft,
            width: spotW,
            height: spotH,
            shadowColor: '#8B5CF6',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </View>
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/components/__tests__/customTabBar.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/components/CustomTabBar.tsx app/\(onboarding\)/step-1.tsx src/components/__tests__/customTabBar.test.ts
git commit -m "refactor(tab-bar): remove debug border and align onboarding spotlight with center Add button"
```
