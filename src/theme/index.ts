/**
 * TYB design tokens.
 *
 * Direction: soft satin blush. Pale pink paper, warm cocoa ink, dusty-mauve
 * primary buttons and a rose heart. Italic serif for the brand and names
 * (Fraunces) over a clean sans body (Inter). Photos do the talking.
 */

export const colors = {
  paper: '#F6EAE5', // app background (blush)
  paperDeep: '#EED9D2', // bottom of background gradients
  card: '#FCF6F3', // raised surfaces
  glass: 'rgba(252,246,243,0.72)', // round buttons, frosted chips
  ink: '#3D2B29', // primary text (cocoa)
  inkSoft: '#6E5652', // secondary text
  muted: '#A38C87', // captions, placeholders
  line: '#E8D3CC', // hairlines and borders
  accent: '#7B4B48', // dusty mauve — primary buttons, active tab
  accentSoft: '#F0DCD6', // accent tint backgrounds
  rose: '#D9958F', // the heart / "cover" action
  roseDeep: '#C97F79',
  success: '#5E7F63',
  warning: '#A77A3A',
  danger: '#A3423F',
  white: '#FFFFFF',
} as const;

/** Background wash used on full-screen pages. */
export const gradients = {
  paper: [colors.card, colors.paper, colors.paperDeep] as const,
  photoScrim: ['rgba(40,24,22,0)', 'rgba(40,24,22,0.55)'] as const,
  rose: [colors.rose, colors.roseDeep] as const,
};

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_400Regular_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export const type = {
  brand: { fontFamily: fonts.displayItalic, fontSize: 44, lineHeight: 52, color: colors.ink },
  tagline: { fontFamily: fonts.body, fontSize: 14, lineHeight: 24, letterSpacing: 4, color: colors.inkSoft },
  hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, color: colors.ink },
  name: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.white },
  h1: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.ink },
  h2: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: colors.ink },
  quote: { fontFamily: fonts.displayItalic, fontSize: 20, lineHeight: 28, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.inkSoft },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16, letterSpacing: 1.2, color: colors.muted },
  button: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 20 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted },
} as const;

export type TypeVariant = keyof typeof type;
