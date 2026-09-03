# SignalSub — Design Specification

**Date:** 2026-09-03
**Version:** 1.0
**Status:** Approved

---

## Overview

SignalSub is a personal subscription tracker and manager built with React Native (Expo). It solves three core pain points: awareness of active subscriptions, visibility into monthly/yearly spending, and timely alerts before auto-charges hit. The app is local-first, offline-capable, and targets both iOS and Android with eventual App Store / Google Play publication.

**App Name:** SignalSub
**Tagline:** "Never get surprised by an auto-charge."
**Target Users:** Solo personal finance — individual users tracking their own subscriptions
**Platforms:** iOS + Android (Expo Managed Workflow)

---

## 1. Architecture

### 1.1 Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Expo SDK 52+ (Managed Workflow) | OTA updates, no native build overhead |
| Navigation | Expo Router v4 (file-based) | Native stack + tab layout, deep links |
| Database | `expo-sqlite` + `drizzle-orm` | Relational queries, typed schema, migrations |
| State | Zustand | Lightweight global state, syncs from SQLite |
| Notifications | `expo-notifications` | Local scheduled push, no server needed |
| Charts | `victory-native` | Rich charts (pie, bar, line) optimized for RN |
| Styling | NativeWind v4 (Tailwind for RN) | Utility-first, fast iteration |
| Animations | `react-native-reanimated` | Smooth transitions and gestures |
| Icons | `@expo/vector-icons` (MaterialIcons + MaterialCommunityIcons) | UI + brand icons, zero extra install |

### 1.2 Folder Structure

```
signalsub/
├── app/
│   ├── (onboarding)/
│   │   ├── welcome.tsx
│   │   ├── step-1.tsx
│   │   ├── step-2.tsx
│   │   └── step-3.tsx
│   ├── (tabs)/
│   │   ├── index.tsx             # Dashboard
│   │   ├── subscriptions.tsx
│   │   ├── calendar.tsx
│   │   └── analytics.tsx
│   ├── subscription/
│   │   ├── [id].tsx
│   │   └── new.tsx
│   └── settings.tsx
├── src/
│   ├── db/
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
│   │   ├── SubscriptionCard.tsx
│   │   ├── SubscriptionRow.tsx
│   │   ├── SpendingCard.tsx
│   │   ├── CategoryChip.tsx
│   │   ├── AlertBanner.tsx
│   │   ├── ServicePresetGrid.tsx
│   │   ├── NoiseOverlay.tsx
│   │   └── InitialAvatar.tsx
│   └── constants/
│       ├── colors.ts
│       ├── categories.ts
│       └── servicePresets.ts
├── assets/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── icon.png              # 1024x1024
│   │   ├── splash.png
│   │   └── noise.png             # 200x200 tileable noise texture
│   └── fonts/
└── docs/superpowers/specs/
```

---

## 2. Data Model

### 2.1 `subscriptions` Table

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (UUID) | Primary key |
| `name` | TEXT | e.g. "Netflix" |
| `description` | TEXT? | Optional note |
| `amount` | REAL | Cost per billing cycle |
| `currency` | TEXT | ISO code e.g. "PHP", "USD" |
| `billing_cycle` | TEXT | "weekly" | "monthly" | "quarterly" | "yearly" |
| `next_renewal_date` | TEXT (ISO 8601) | Next charge date |
| `start_date` | TEXT (ISO 8601) | When subscription began |
| `color` | TEXT | Hex color e.g. "#E50914" |
| `icon_type` | TEXT | "preset" | "emoji" | "initial" |
| `icon_value` | TEXT | Icon name, emoji char, or first letter |
| `category` | TEXT | "streaming" | "productivity" | "fitness" | "gaming" | "cloud" | "developer" | "other" |
| `is_trial` | INTEGER | 1 if in free trial |
| `trial_end_date` | TEXT? | Trial expiry date |
| `is_active` | INTEGER | 1 if active, 0 if paused |
| `notify_before_days` | INTEGER | Default: 3 |
| `notification_id` | TEXT? | expo-notifications ID |
| `created_at` | TEXT (ISO 8601) | |
| `updated_at` | TEXT (ISO 8601) | |

### 2.2 `notification_log` Table

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (UUID) | Primary key |
| `subscription_id` | TEXT (FK) | References subscriptions.id |
| `type` | TEXT | "renewal_reminder" | "trial_expiry" | "weekly_digest" |
| `sent_at` | TEXT (ISO 8601) | |

### 2.3 `settings` Table

| Key | Value |
|---|---|
| `default_currency` | ISO currency code (set on first launch) |
| `has_onboarded` | "true" once onboarding complete |
| `notify_weekly_digest` | "true" | "false" |
| `weekly_digest_day` | "0"–"6" (Sunday = 0) |
| `weekly_digest_time` | "HH:MM" |
| `theme` | "dark" | "light" | "system" |

### 2.4 Derived / Computed Data

Calculated on-the-fly, no extra table:
- **Monthly total** — normalize all billing cycles to monthly equivalent
- **Yearly total** — sum of all yearly-equivalent costs
- **Category breakdown** — GROUP BY category
- **Upcoming renewals** — next_renewal_date BETWEEN today AND +30 days, ORDER BY date ASC
- **Active trials** — is_trial = 1 AND trial_end_date >= today

---

## 3. Screens & Navigation

### 3.1 Navigation Structure

```
Onboarding Stack (first launch only)
├── /welcome
├── /onboarding/step-1     Add Your Subscriptions
├── /onboarding/step-2     Never Miss a Renewal
├── /onboarding/step-3     See Where Your Money Goes
└── /onboarding/currency   Currency picker

Bottom Tab Bar (main app)
├── Home (Dashboard)
├── Subscriptions (list)
├── Calendar (renewal timeline)
└── Analytics (spending)

Modal Stack
├── /subscription/new
├── /subscription/[id]
└── /settings
```

### 3.2 Onboarding Flow

Shown once. `has_onboarded` flag in SQLite prevents repeat.

**Welcome Screen**
- App logo (centered, soft purple glow)
- "SignalSub" bold white + tagline in lavender
- Gradient noise background + ambient orbs
- "Get Started →" purple pill CTA
- "No account needed · Works offline"

**Step 1 — Add Your Subscriptions**
- Progress: ●○○ | Skip top-right
- Illustration: Add flow with colorful service cards
- "Search from 50+ popular services or add your own."
- CTA: "Next →"

**Step 2 — Never Miss a Renewal**
- Progress: ○●○ | Skip top-right
- Illustration: Push notification + calendar timeline
- "Get push notifications before each charge."
- CTA: "Next →"

**Step 3 — See Where Your Money Goes**
- Progress: ○○● | Skip top-right
- Illustration: Donut chart + bar chart + spending amount
- "Get a clear breakdown of your spending by category."
- CTA: "Get Started 🎉"

**Post-Step-3:** Currency picker → Notification permission prompt → Dashboard

**Skip behavior:** Any Skip → Currency picker → Dashboard
**Gesture:** Swipe left/right between steps

### 3.3 Dashboard (Home)

- Time-based greeting + bell icon
- Alert banners (red: renews in ≤3 days, yellow: trial expiring in ≤7 days)
- SpendingCard (monthly total + yearly estimate, purple gradient + noise)
- Upcoming Renewals horizontal scroll (SubscriptionCard components)
- Active Subscriptions vertical list (SubscriptionRow components)
- FAB: purple "+" always visible

### 3.4 Subscriptions List

- Search bar (real-time filter)
- Filter chips: All | Active | Trials | Paused | by category
- Default sort: renewal date, soonest first
- Swipe left on row: Delete | Pause
- Empty state with "+" CTA

### 3.5 Calendar

- Month selector (prev/next arrows)
- This Month Total displayed
- Timeline grouped by date with color dots
- Renewals listed under each date

### 3.6 Analytics

- Period toggle: Monthly | Quarterly | Yearly
- Donut chart (spending by category)
- Category breakdown list
- Bar chart (6-month spend trend)
- Stat cards: most expensive, cheapest, average

### 3.7 Add / Edit Subscription Modal

Full-screen bottom sheet, slides up.

Header: X | Title | Save

Add flow:
1. Service picker (search + preset grid + Add Custom)
2. Form: Name, Amount, Billing Cycle, Start Date, Next Renewal, Category, Color, Icon
3. Free Trial toggle → Trial End Date
4. Notify me X days before (1–14 stepper, default 3)

### 3.8 Settings

- Currency (searchable, change anytime)
- Notifications (global toggle, weekly digest toggle + day/time)
- Theme (Light | Dark | System)
- Data (Export CSV, Clear all data)
- About (version, links)

---

## 4. Notification System

All local-only via `expo-notifications`.

### 4.1 Renewal Reminders
Fires `notify_before_days` days before `next_renewal_date`.
Example: "Netflix renews in 3 days · $15.99"
Lifecycle: save → cancel old → schedule new → store notification_id → after renewal → update date → reschedule

### 4.2 Trial Expiry Alerts
Fires 2 days before `trial_end_date` when `is_trial = 1`.
Example: "Your Canva Pro trial ends in 2 days"
Also shown as yellow in-app banner within 7 days of expiry.

### 4.3 Weekly Digest
User-configurable day + time (default: Sunday 9:00 AM).
Example: "You're spending $87.45/month across 8 subscriptions. 3 renewals this week."
Re-scheduled on settings change. Toggleable.

### 4.4 Permissions
- Friendly in-app explanation before system prompt (post-onboarding Step 3)
- Graceful degradation if denied (in-app banners still work)
- iOS (AVFoundation) + Android 13+ (POST_NOTIFICATIONS) both handled

---

## 5. UI/UX Design System

### 5.1 Color Tokens

| Token | Value | Usage |
|---|---|---|
| `bg-primary` | `#0F0F1A` | App background |
| `bg-card` | `#1A1A2E` | Card backgrounds |
| `bg-surface` | `#16213E` | Input fields, rows |
| `accent-purple` | `#7B5EA7` | Primary actions, active tab |
| `accent-purple-light` | `#A78BFA` | Labels, secondary accents |
| `text-primary` | `#FFFFFF` | Headings |
| `text-secondary` | `#94A3B8` | Subtitles, metadata |
| `success` | `#22C55E` | Active / healthy |
| `warning` | `#F59E0B` | Trial expiry |
| `danger` | `#EF4444` | Renewing soon |

Each subscription carries its own brand color for card bg, left-border accent, and badges.

### 5.2 Gradient Noise Texture

Single 200×200 tileable noise.png at ~10% opacity, blendMode="overlay" over gradient cards.
Gives premium matte feel. Zero performance cost.

### 5.3 Typography

| Role | Size | Weight |
|---|---|---|
| Hero spending total | 40sp | 800 ExtraBold |
| Onboarding headline | 28sp | 700 Bold |
| Section heading | 18sp | 700 Bold |
| Card title | 16sp | 600 SemiBold |
| Body / subtext | 14sp | 400 Regular |
| Badge / step label | 11sp | 500 Medium |

System fonts: SF Pro (iOS), Roboto (Android).

### 5.4 Component Inventory

| Component | Purpose |
|---|---|
| SubscriptionCard | Horizontal card, brand color bg + noise, logo, amount, days badge |
| SubscriptionRow | List row, colored left-border, icon, name, category, amount |
| SpendingCard | Large purple gradient + noise, monthly/yearly totals |
| CategoryChip | Colored pill for selection/filter |
| BillingCyclePill | Segmented control: Weekly / Monthly / Quarterly / Yearly |
| AlertBanner | In-app warning banner (red/yellow) |
| ServicePresetGrid | 3-column tappable preset service grid |
| InitialAvatar | Colored circle + first letter fallback |
| NoiseOverlay | Gradient + noise texture wrapper |
| FAB | Floating "+" action button |
| StatCard | Small metric card for Analytics |
| OnboardingStep | Reusable layout: illustration + content + CTA |

### 5.5 Icon Strategy

| Context | Library | Notes |
|---|---|---|
| UI / Navigation | MaterialIcons | Tab bar, actions, form fields |
| Brand service logos | MaterialCommunityIcons | Netflix, Spotify, YouTube, Adobe, GitHub, Apple, Google, Microsoft, Amazon, Discord, Twitch, Slack, Dropbox, LinkedIn, 30+ more |
| Unknown / custom | InitialAvatar | Colored circle + first letter |
| App logo | assets/images/logo.svg | S + bell + circular arc, purple gradient |

### 5.6 Animations

- Card tap → scale 0.97x press (Reanimated)
- Swipe-to-reveal → spring animation for Delete/Pause
- Add modal → bottom sheet slide-up with spring
- Spending total → animated number roll-up
- Category chip → color pop + bounce
- Trial badge → subtle pulse
- Onboarding step → horizontal slide with illustration parallax

### 5.7 Theme

Default: Dark. Light mode available in Settings. System-aware when set to "System".

---

## 6. Service Presets Library

File: `src/constants/servicePresets.ts`

Each preset: key, name, icon (MaterialCommunityIcons), color (hex), category, defaultAmount (optional).

Included: Netflix, Spotify, YouTube Premium, Apple TV+, Disney+, HBO Max, Hulu, Amazon Prime, Adobe Creative Cloud, Microsoft 365, Google One, iCloud, GitHub Pro, Figma, Notion, Slack, Discord Nitro, Dropbox, Canva Pro, Duolingo Plus, LinkedIn Premium, Twitch, and more (~50 total).

---

## 7. Verification Plan

### Automated
- Drizzle migrations run cleanly on fresh install
- Zustand store hydrates from SQLite on launch
- Unit tests: notificationService (schedule/cancel/reschedule logic)
- Unit tests: analyticsService (billing-cycle-to-monthly normalization)

### Manual
- Full onboarding flow (all 3 steps + currency picker)
- Skip onboarding at each step
- Add subscription via preset → verify notification scheduled
- Edit renewal date → verify notification rescheduled
- Trial expiry banner appears on Dashboard
- Weekly digest fires on configured day/time
- All 4 tabs render data correctly
- iOS simulator + Android emulator
- Empty state on all screens
- Notification permission denied flow

---

## 8. Future Enhancements (v2+)

- Cloud sync via Supabase
- Auto-import from Gmail / email receipts
- Home screen widget
- Shared / family subscriptions
- Budget limits and overspend alerts
- Receipt attachment per subscription
