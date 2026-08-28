/**
 * Artisan-AI — Color Tokens
 * Extracted from Stitch design system
 */
export const colors = {
  // Primary
  primary: '#1E3A5F',
  primaryLight: '#2563EB',
  primaryDark: '#152C4A',

  // Secondary
  secondary: '#C4704B',
  secondaryLight: '#D4896A',

  // Backgrounds
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#1C1C1E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',

  // Status
  success: '#2E7D32',
  successLight: '#E8F5E9',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',

  // Borders
  border: '#E5E7EB',
  borderFocused: '#1E3A5F',
  borderLight: '#F3F4F6',

  // Misc
  overlay: 'rgba(0,0,0,0.5)',
  overlayDark: 'rgba(0,0,0,0.9)',
  shadow: 'rgba(0,0,0,0.06)',
  
  // AI Gradient
  aiGradientStart: '#1E3A5F',
  aiGradientEnd: '#2563EB',

  // Tab bar
  tabInactive: '#9CA3AF',
  tabActive: '#1E3A5F',

  // Badge
  badgeRed: '#EF4444',
  badgeGreen: '#22C55E',
  badgeAmber: '#F59E0B',
} as const;

export type ColorKey = keyof typeof colors;
