import { NativeModules } from 'react-native';

// ── API URL Resolution ────────────────────────────────────────────────────────
//
// Priority:
//  1. EXPO_PUBLIC_API_URL env var — set this in mobile/.env for all environments
//  2. Metro scriptURL auto-detect — reliable in Expo Go / dev builds
//  3. Hardcoded LAN fallback      — last resort for dev, NEVER used in production

let resolvedUrl: string | null = null;

function getApiUrl(): string {
  if (resolvedUrl) return resolvedUrl;

  // 1. Explicit env var (production + staging builds)
  if (process.env.EXPO_PUBLIC_API_URL) {
    resolvedUrl = process.env.EXPO_PUBLIC_API_URL;
    return resolvedUrl;
  }

  // 2. Auto-detect from Metro bundler URL (dev only)
  if (__DEV__) {
    const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
    if (scriptURL) {
      const match = scriptURL.match(/http:\/\/([^:]+)/);
      if (match && match[1]) {
        resolvedUrl = `http://${match[1]}:8000/api/v1`;
        return resolvedUrl;
      }
    }
  }

  // 3. Hardcoded LAN fallback (update if your IP changes)
  resolvedUrl = 'http://10.53.75.14:8000/api/v1';
  return resolvedUrl;
}

export const API_URL = getApiUrl();

export const endpoints = {
  auth: {
    login: `${API_URL}/auth/login`,
    verifyOtp: `${API_URL}/auth/verify-otp`,
  },
  studio: {
    process: `${API_URL}/ai/studio/process`,
    status: (jobId: string) => `${API_URL}/ai/studio/status/${jobId}`,
    regenerate: `${API_URL}/ai/studio/regenerate`,
    publish: `${API_URL}/ai/studio/publish`,
  },
};
