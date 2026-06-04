// Kover design token system — mirrors colors_and_type.css
export const Colors = {
  // Forest — primary surface family
  forest1000: '#02100C',
  forest950: '#051A14',
  forest900: '#083028',
  forest800: '#0B3D32',
  forest700: '#114E40',
  forest600: '#1A6451',
  forest500: '#2A8369',

  // Emerald — primary accent
  emerald700: '#0C6650',
  emerald600: '#108068',
  emerald500: '#14A484',
  emerald400: '#2BC79E',
  emerald300: '#6EE0BD',
  emerald100: '#D3F4E7',

  // Cream — text and light surfaces
  cream50: '#FFFFF0',
  cream100: '#FAF5E4',
  cream200: '#F1EBD4',
  cream300: '#E2DAB9',
  sand400: '#C7BD96',
  sand500: '#948C6E',

  // Warm accents
  amber500: '#E0A663',
  amber300: '#F2D29C',
  coral500: '#E07A5F',
  coral300: '#F2B5A1',
  dusk500: '#6E6E9B',
  dusk300: '#BFC0DC',

  // SOS red
  sosRed: '#D14338',
  sosRedHov: '#E25B50',
  sosRedDeep: '#A8332A',

  // Semantic
  bgApp: '#051A14',
  bgSurface: '#083028',
  bgSurface2: '#0B3D32',
  bgSurface3: '#114E40',
  bgInset: 'rgba(2, 16, 12, 0.45)',

  fg1: '#FFFFF0',
  fg2: 'rgba(255, 255, 240, 0.78)',
  fg3: 'rgba(255, 255, 240, 0.55)',
  fg4: 'rgba(255, 255, 240, 0.32)',

  accent: '#14A484',
  accentHover: '#2BC79E',
  accentPress: '#108068',

  hairline: 'rgba(255, 255, 240, 0.08)',
  hairlineStrong: 'rgba(255, 255, 240, 0.14)',
  hairlineEmerald: 'rgba(20, 164, 132, 0.35)',

  // Aliases for component compatibility
  bg1: '#051A14',
  bg2: '#083028',
  bg3: '#0B3D32',
  bg4: '#114E40',

  amber400: '#E8B479',
} as const;

export const Fonts = {
  display: 'BricolageGrotesque_700Bold',
  displayMedium: 'BricolageGrotesque_500Medium',
  serif: 'Newsreader_400Regular',
  serifItalic: 'Newsreader_400Regular_Italic',
  serifMedium: 'Newsreader_500Medium',
  sans: 'Manrope_400Regular',
  sansMedium: 'Manrope_500Medium',
  sansSemiBold: 'Manrope_600SemiBold',
  sansBold: 'Manrope_700Bold',
  sansExtraBold: 'Manrope_800ExtraBold',
  mono: 'JetBrains Mono',
  // Fallbacks (used until fonts load)
  displayFallback: 'System',
  serifFallback: 'Georgia',
  sansFallback: 'System',
} as const;

// Radial gradient background — use with LinearGradient as an approximation
export const BgGradient = {
  colors: ['#0E3A2E', '#051A14', '#02100C'] as const,
  locations: [0, 0.55, 1] as const,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const Spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s7: 32,
  s8: 40,
  s9: 56,
  s10: 72,
  // Aliases
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 56,
} as const;
