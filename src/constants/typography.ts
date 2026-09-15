// Typography Design Tokens for SignalSub
// Primary: Montserrat (Headings, titles, prominent display metrics, action buttons)
// Secondary: Roboto (Body text, subtitles, captions, metadata, form fields)

export const FONT_FAMILY = {
  // Primary Font: Montserrat
  primary: {
    regular: 'Montserrat_400Regular',
    medium: 'Montserrat_500Medium',
    semiBold: 'Montserrat_600SemiBold',
    bold: 'Montserrat_700Bold',
    extraBold: 'Montserrat_800ExtraBold',
  },
  // Secondary Font: Roboto
  secondary: {
    light: 'Roboto_300Light',
    regular: 'Roboto_400Regular',
    medium: 'Roboto_500Medium',
    bold: 'Roboto_700Bold',
  },

  // Semantic Shortcuts
  heading: 'Montserrat_700Bold',
  subheading: 'Montserrat_600SemiBold',
  body: 'Roboto_400Regular',
  caption: 'Roboto_400Regular',
  button: 'Montserrat_600SemiBold',
  metric: 'Montserrat_700Bold',
} as const;

export type PrimaryFontWeight = keyof typeof FONT_FAMILY.primary;
export type SecondaryFontWeight = keyof typeof FONT_FAMILY.secondary;

export const TYPOGRAPHY = {
  // Display & Headers (Montserrat)
  h1: {
    fontFamily: FONT_FAMILY.primary.bold,
    fontSize: 28,
    lineHeight: 34,
  },
  h2: {
    fontFamily: FONT_FAMILY.primary.bold,
    fontSize: 22,
    lineHeight: 28,
  },
  h3: {
    fontFamily: FONT_FAMILY.primary.semiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  h4: {
    fontFamily: FONT_FAMILY.primary.semiBold,
    fontSize: 16,
    lineHeight: 22,
  },

  // Body & Descriptions (Roboto)
  body: {
    fontFamily: FONT_FAMILY.secondary.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: FONT_FAMILY.secondary.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyBold: {
    fontFamily: FONT_FAMILY.secondary.bold,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: FONT_FAMILY.secondary.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  bodySmallMedium: {
    fontFamily: FONT_FAMILY.secondary.medium,
    fontSize: 13,
    lineHeight: 18,
  },

  // Captions & Metadata (Roboto)
  caption: {
    fontFamily: FONT_FAMILY.secondary.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  captionMedium: {
    fontFamily: FONT_FAMILY.secondary.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  captionUppercase: {
    fontFamily: FONT_FAMILY.secondary.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
  },

  // Buttons & CTAs (Montserrat)
  button: {
    fontFamily: FONT_FAMILY.primary.semiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  buttonSmall: {
    fontFamily: FONT_FAMILY.primary.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },

  // Prominent Metrics & Currency (Montserrat)
  metric: {
    fontFamily: FONT_FAMILY.primary.bold,
    fontSize: 32,
    lineHeight: 38,
  },
  metricLarge: {
    fontFamily: FONT_FAMILY.primary.extraBold,
    fontSize: 36,
    lineHeight: 44,
  },
} as const;
