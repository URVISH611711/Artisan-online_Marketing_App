/**
 * Artisan-AI — Typography Tokens
 * Noto Sans for multilingual support (English, Hindi, Gujarati)
 */
import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  // Font families (will use system fonts; Noto Sans loaded via Expo)
  fontFamily: {
    regular: fontFamily,
    medium: fontFamily,
    semibold: fontFamily,
    bold: fontFamily,
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },

  // Preset text styles
  styles: {
    displayLarge: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    displayMedium: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
    },
    heading: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
    },
    subheading: {
      fontSize: 20,
      fontWeight: '700' as const,
      lineHeight: 28,
    },
    title: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
    label: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
  },
} as const;
