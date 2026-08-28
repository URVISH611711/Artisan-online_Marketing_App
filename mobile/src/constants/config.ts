/**
 * App configuration
 * Toggle USE_MOCK_API to switch between mock and production backends
 */
export const config = {
  USE_MOCK_API: true,
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  APP_VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'en' as const,
  SUPPORTED_LANGUAGES: ['en', 'hi', 'gu'] as const,
  IMAGE_MAX_WIDTH: 1200,
  IMAGE_QUALITY: 0.8,
  OTP_LENGTH: 4,
  OTP_TIMEOUT_SECONDS: 30,
};
