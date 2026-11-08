/**
 * Covered design tokens.
 *
 * Direction: warm, editorial, quiet. Cream paper, near-black ink, one deep
 * oxblood accent. Serif headings (Fraunces) over a clean sans body (Inter).
 * Photos do the talking — chrome stays out of the way.
 */

export const colors = {
  paper: '#F6F1EA', // app background
  card: '#FFFDF9', // raised surfaces
  ink: '#1C1A17', // primary text
  inkSoft: '#4A453F', // secondary text
  muted: '#8A8178', // captions, placeholders
  line: '#E4DCD1', // hairlines and borders
  accent: '#6B2D3C', // oxblood — primary actions
  accentSoft: '#F1E4E6', // accent tint backgrounds
  success: '#3F6B4F',
  warning: '#9A6B1F',
  danger: '#9B2C2C',
  white: '#FFFFFF',
} as const;

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
  hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, color: colors.ink },
  h1: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.ink },
  h2: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: colors.ink },
  quote: { fontFamily: fonts.displayItalic, fontSize: 20, lineHeight: 28, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.inkSoft },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16, letterSpacing: 1.2, color: colors.muted },
  button: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 20 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted },
} as const;

export type TypeVariant = keyof typeof type;
