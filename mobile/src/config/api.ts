import { NativeModules } from 'react-native';

// ── API URL Resolution ────────────────────────────────────────────────────────
//
// Priority:
//  1. EXPO_PUBLIC_API_URL env var — set this in mobile/.env for LocalTunnel / Prod
//     Example: EXPO_PUBLIC_API_URL=https://my-artisan-app.loca.lt
//  2. Metro scriptURL auto-detect — reliable in Expo Go / dev builds
//  3. LAN IP fallback             — fallback for physical devices in same Wi-Fi

let resolvedUrl: string = "";

function getApiUrl(): string {
  if (resolvedUrl) return resolvedUrl;

  // 1. Explicit env var (LocalTunnel, Staging, Production)
  if (process.env.EXPO_PUBLIC_API_URL) {
    let raw = process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/+$/, '');
    resolvedUrl = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
    console.log(`[API Config] Using EXPO_PUBLIC_API_URL: ${resolvedUrl}`);
    return resolvedUrl;
  }

  // 2. Auto-detect from Metro bundler URL (dev only)
  if (__DEV__) {
    const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
    if (scriptURL) {
      const match = scriptURL.match(/http:\/\/([^:]+)/);
      if (match && match[1]) {
        resolvedUrl = `http://${match[1]}:8000/api/v1`;
        console.log(`[API Config] Auto-detected Metro LAN IP: ${resolvedUrl}`);
        return resolvedUrl;
      }
    }
  }

  // 3. Hardcoded LAN fallback
  resolvedUrl = 'http://10.53.75.28:8000/api/v1';
  return resolvedUrl;
}

export const API_URL = getApiUrl();
export const BASE_URL = API_URL.replace(/\/api\/v1\/?$/, '');

export const endpoints = {
  health: `${BASE_URL}/health`,
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
