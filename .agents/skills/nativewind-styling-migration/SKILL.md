---
name: nativewind-styling-migration
description: Use when analyzing a React Native Expo application to progressively migrate its styling system (StyleSheet.create, inline styles, hardcoded values) to NativeWind and Tailwind CSS while preserving visual design and building a centralized theme token system.
---

# React Native Expo → NativeWind Styling Migration

You are a senior React Native / Expo engineer specializing in NativeWind, Tailwind CSS architecture, scalable design systems, and safe UI refactoring.

Your task is to analyze an existing React Native Expo application and progressively migrate its styling system to NativeWind while preserving the application's existing visual design and behavior.

Do not immediately rewrite files. First inspect and understand the project.

## Primary Objectives

1. Identify the current styling architecture and conventions used throughout the application.
2. Determine whether NativeWind is installed and correctly configured.
3. Identify the exact NativeWind version, Tailwind version, Expo version, React Native version, and any related dependencies.
4. Determine which NativeWind configuration approach is appropriate for the installed version.
5. Audit all existing styling approaches, including:
   - `StyleSheet.create()`
   - inline `style={{ ... }}`
   - reusable style objects
   - component-specific style files
   - theme/context-based styling
   - hardcoded colors
   - hardcoded spacing
   - hardcoded typography
   - dynamic styles
   - conditional styles
   - platform-specific styles
   - third-party component styling
   - existing `className` / NativeWind usage
6. Build or improve a centralized design/theme system.
7. Convert appropriate existing styles to NativeWind utilities.
8. Replace repeated design values with reusable theme variables/tokens.
9. Preserve the current UI appearance unless explicitly instructed otherwise.
10. Keep styles that are unsuitable for NativeWind in React Native style objects when necessary.

---

# Phase 1 — Project Inspection

Before changing code, inspect the project structure.

Check at minimum:
- `package.json`
- Expo configuration (`app.json`, `app.config.js`, `app.config.ts`)
- `babel.config.js`
- `metro.config.js`
- `tailwind.config.js` / `tailwind.config.ts`
- `global.css`
- Root layout files (`App.tsx`, Expo Router layouts `app/_layout.tsx`)
- TypeScript configuration (`tsconfig.json`, `nativewind-env.d.ts`)
- Existing theme files & constants folders
- Shared UI component folders
- Reusable style files

Search the codebase for:
- `StyleSheet.create(`
- `style={{`
- `style={[`
- `className=`

Also search for repeated hardcoded values such as:
- Hex colors (`#...`)
- `rgb()` / `rgba()`
- Font sizes & font weights
- Padding & margin values
- Border radii
- Shadows / elevation
- Widths & heights

Determine the project's current styling structure before proposing a migration.

---

# Phase 2 — Verify NativeWind Installation

Determine whether NativeWind is installed.

Inspect `package.json` and the package manager lockfile.

Check for packages such as:
- `nativewind`
- `tailwindcss`
- `react-native-reanimated`
- `react-native-css-interop`

Also identify the package manager being used:
- `npm`
- `yarn`
- `pnpm`
- `bun`

Report:
```text
NativeWind installed: Yes / No
NativeWind version:
Tailwind CSS version:
Expo version:
React Native version:
React version:
Package manager:
```

If NativeWind is not installed, do not assume which installation instructions should be used.
Determine the current recommended installation procedure for the Expo and NativeWind versions involved.

When version-specific documentation is needed, use Context7 MCP if available. Prefer official NativeWind, Expo, Tailwind CSS, React Native, or related package documentation. Do not rely on outdated NativeWind v2/v4 setup instructions if the project is using another version.

---

# Phase 3 — Validate NativeWind Configuration

Verify that NativeWind is actually configured correctly, not merely installed.

Inspect configuration including:
- Babel plugins
- Metro configuration (`withNativeWind`)
- Tailwind content paths (`content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"]`)
- CSS entry file (`global.css`)
- Global stylesheet import in root layout
- TypeScript support (`nativewind-env.d.ts` triple-slash directive)
- NativeWind presets
- CSS variables
- React Native CSS interoperability

Identify missing or outdated configuration. Report problems before making large changes.

Example:
```text
NativeWind Audit

Installation:
✓ nativewind installed

Version:
NativeWind: x.x.x

Configuration:
✓ Metro configured
✓ Tailwind configured
✗ global.css not imported
✗ app directory missing from Tailwind source configuration

Recommended fixes:
...
```

---

# Phase 4 — Styling Architecture Audit

Analyze how styling is currently implemented. Categorize styles into groups:

### A. NativeWind already implemented
Example:
```tsx
<View className="flex-1 bg-white p-4" />
```
Keep valid NativeWind usage unless there is a clear architectural reason to improve it.

### B. Static StyleSheet styles
Example:
```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
});
```
Candidate migration:
```tsx
<View className="flex-1 bg-background p-4" />
```

### C. Inline static styles
Example:
```tsx
<View
  style={{
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
  }}
/>
```
Candidate migration:
```tsx
<View className="rounded-xl bg-surface px-4" />
```

### D. Dynamic styles
Example:
```tsx
style={{
  width: progress * 100,
}}
```
Do not force every dynamic value into NativeWind. It is acceptable to use:
```tsx
<View
  className="h-2 rounded-full bg-primary"
  style={{ width: progress * 100 }}
/>
```
NativeWind should handle reusable/static design properties. React Native styles may remain for runtime-calculated values.

### E. Conditional styles
Prefer clean conditional class composition:
```tsx
className={
  isActive
    ? "bg-primary text-primary-foreground"
    : "bg-muted text-muted-foreground"
}
```
If the project already uses a class utility such as `cn`, `clsx`, `classnames`, `tailwind-merge`, or `cva`, identify and reuse it where appropriate. Do not introduce unnecessary dependencies.

---

# Phase 5 — Extract the Existing Design System

The goal is **NOT** to redesign the application. Infer the design system already present in the existing UI:

### Colors
Identify semantic roles: Primary, Secondary, Accent, Background, Surface, Card, Border, Muted, Success, Warning, Danger, Info, Text primary, Text secondary, Text muted.

### Typography
Identify font families, font sizes, font weights, line heights, letter spacing, heading hierarchy, body styles, caption styles.

### Spacing
Identify repeated numbers (`4`, `8`, `12`, `16`, `20`, `24`, `32`, etc.) and map them to an intentional spacing scale.

### Radius
Identify repeated radii (`4`, `6`, `8`, `12`, `16`, `20`, `9999`, etc.).

### Shadows / Elevation
Determine repeated card, modal, button, floating element, and navigation shadows.

### Layout
Identify recurring values: screen horizontal padding, card padding, section spacing, header heights, bottom navigation heights, button heights, input heights.

---

# Phase 6 — Create a Centralized Theme

Create a scalable theme that NativeWind can consume.

The exact implementation **MUST** match the installed NativeWind version. Do not assume a particular NativeWind theme architecture without checking its version.

Where supported, prefer semantic design tokens:
- `background` / `foreground`
- `card` / `card-foreground`
- `primary` / `primary-foreground`
- `secondary` / `secondary-foreground`
- `muted` / `muted-foreground`
- `accent` / `accent-foreground`
- `success` / `success-foreground`
- `warning` / `warning-foreground`
- `destructive` / `destructive-foreground`
- `border`, `input`, `ring`

Avoid naming theme colors based purely on raw color names (`blue500`, `gray200`) when the value represents a semantic role.
Prefer:
```tsx
bg-primary text-foreground border-border bg-card text-muted-foreground
```
instead of:
```tsx
bg-[#1267E5] text-[#111827] border-[#E5E7EB]
```
unless a one-off color genuinely has no reusable semantic meaning.

### Theme Variables
When supported by the project's NativeWind version, use CSS/theme variables for design tokens:
```css
:root {
  --background: ...;
  --foreground: ...;
  --primary: ...;
  --primary-foreground: ...;
  --secondary: ...;
  --secondary-foreground: ...;
  --card: ...;
  --card-foreground: ...;
  --muted: ...;
  --muted-foreground: ...;
  --border: ...;
  --input: ...;
  --ring: ...;
}
```
If the application supports dark mode, define corresponding dark-theme values instead of duplicating component styles. Adapt to the NativeWind version actually installed.

---

# Phase 7 — Build Reusable Styling Utilities

If helpful, create or reuse a utility such as `cn()` for safely combining classes:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
Use an existing project utility if one already exists.

For reusable variants such as buttons, badges, cards, or inputs, consider component variants instead of repeating long `className` strings everywhere:
```tsx
<Button variant="primary" size="md" />
<Button variant="outline" />
<Button variant="destructive" />
```
Reusable UI components should consume semantic theme classes.

---

# Phase 8 — Migration Strategy

Do not perform a massive blind replacement. Migrate in controlled stages:

1. Theme / configuration
2. Shared primitives
3. Reusable UI components
4. Layout components
5. Navigation components
6. Screens
7. Remaining one-off styles

### For each file:
1. Understand the current UI.
2. Identify static styles.
3. Map them to NativeWind utilities.
4. Replace hardcoded reusable values with theme tokens.
5. Keep truly dynamic styles in `style`.
6. Preserve component behavior.
7. Preserve TypeScript types.
8. Preserve responsive and platform-specific behavior.
9. Remove unused `StyleSheet` imports only after migration.
10. Remove dead style definitions.

---

# Conversion Rules

### Prefer NativeWind for:
- `flex`, `flex-direction`, `items-center`, `justify-center`, `gap-*`
- `p-*`, `px-*`, `py-*`, `m-*`, `mx-*`, `my-*`
- `w-*`, `h-*`, min/max dimensions when supported
- Background colors, text colors
- Font sizes, font weights
- Borders, border radius
- Opacity, position, z-index
- Common shadows, common transforms

### Keep React Native styles when appropriate for:
- Runtime calculated values (`progress * 100`)
- Animated styles (`Animated.Value`)
- Reanimated styles (`useAnimatedStyle`)
- Interpolated values
- Measurements derived dynamically from screen dimensions
- Values coming directly from API/runtime data
- Complex platform-specific behavior
- Styles unsupported by the installed NativeWind version
- Third-party library APIs requiring style objects

Do not sacrifice maintainability merely to achieve "100% NativeWind."

---

# Example Migration

Before:
```tsx
import { StyleSheet, Text, View } from "react-native";

export function ProfileCard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Manage your account</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },
});
```

After:
```tsx
import { Text, View } from "react-native";

export function ProfileCard() {
  return (
    <View className="mx-4 rounded-2xl bg-card p-4">
      <Text className="text-xl font-bold text-card-foreground">
        Profile
      </Text>
      <Text className="mt-1 text-sm text-muted-foreground">
        Manage your account
      </Text>
    </View>
  );
}
```
The exact utility names must match the project's configured theme.

---

# Phase 9 — Identify Styling Duplication

Search the project for repeated classes/styles. If the same styling pattern appears frequently, recommend extracting a reusable component:
- Buttons, cards, badges
- Input fields, section headers
- Screen containers, modal containers
- List rows, avatars, empty states, loading states

Do not over-componentize small one-off layouts.

---

# Phase 10 — Theme Consistency Audit

After migration, identify remaining hardcoded styling values. Search for:
- Hex colors, RGBA colors
- Large `StyleSheet.create` blocks
- Repeated numeric spacing values
- Repeated border radii & typography settings

Classify each occurrence as:
- `Should migrate`
- `Should remain dynamic`
- `Third-party limitation`
- `Intentional exception`

---

# Phase 11 — Testing & Verification

After each meaningful migration batch:
- Run TypeScript checks (`npx tsc --noEmit`)
- Run linting (`npm run lint` if configured)
- Run the Expo application if available (`npx expo start`)
- Identify compile errors
- Identify NativeWind configuration errors
- Check Android compatibility
- Check iOS compatibility
- Check Web compatibility if the application supports Expo Web
- Ensure no broken imports or unused style constants remain
- Run relevant unit/component tests if present

---

# Phase 12 — Documentation Lookup Using Context7 MCP

Use Context7 MCP when you need to verify:
- NativeWind installation instructions
- NativeWind version-specific configuration
- Expo compatibility
- Metro configuration
- Tailwind integration
- CSS variable support
- `vars()`
- Dark mode implementation
- `cssInterop`
- Third-party component integration
- Migration guidance between NativeWind versions

### Steps for Context7:
1. Identify the relevant library (`nativewind`, `tailwindcss`, `expo`).
2. Request documentation for the specific installed version when possible.
3. Prefer official documentation.
4. Compare instructions against the project's existing configuration.
5. Do not modify configuration based on documentation for an incompatible version.

---

# Required Initial Output

Before making changes, provide an audit report in this format:

```text
# NativeWind Migration Audit

## Project
Expo:
React Native:
React:
TypeScript:

## NativeWind
Installed:
Version:
Tailwind version:
Configuration status:

## Existing Styling
NativeWind:
StyleSheet:
Inline styles:
Theme system:
Dark mode:
Reusable style utilities:

## Existing Design Tokens
Colors:
Typography:
Spacing:
Radius:
Shadows:

## Problems Found
1.
2.
3.

## Recommended Theme Architecture
...

## Migration Plan
1.
2.
3.

## Files That Should Be Changed First
1.
2.
3.
```

Only after the audit should implementation begin.

---

# Required Migration Behavior

During implementation:
- Work incrementally.
- Explain important architectural changes.
- Avoid changing business logic.
- Avoid redesigning screens.
- Do not change APIs.
- Do not change navigation behavior.
- Do not rename components unnecessarily.
- Avoid adding dependencies unless clearly justified.
- Preserve the existing design as closely as possible.
- Use semantic theme tokens instead of repeating raw values.
- Prefer NativeWind for static styling.
- Preserve React Native styles for legitimate dynamic cases.
- Clean up obsolete `StyleSheet` definitions after migration.

---

# Final Deliverables

At completion provide:

```text
# NativeWind Migration Summary

Files analyzed:
Files migrated:
Components migrated:

NativeWind version:
Theme architecture:

Design tokens created:
- colors
- typography
- spacing
- radius
- shadows

StyleSheet usage before:
StyleSheet usage remaining:

Remaining style objects and why:
1.
2.

Hardcoded design values remaining:
1.
2.

Configuration changes:
1.
2.

Potential follow-up improvements:
1.
2.
```

Also ensure the project still builds successfully with the following success criteria:
1. Existing UI is visually preserved.
2. Styling becomes easier to maintain.
3. Repeated values are centralized.
4. NativeWind is used consistently.
5. The implementation matches the installed NativeWind version.
6. Dynamic React Native styling remains where it is technically appropriate.
7. Future components can easily use the same theme tokens.
