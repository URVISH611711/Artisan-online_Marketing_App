import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

// ── API URL Resolution ────────────────────────────────────────────────────────
//
// Priority:
//  1. EXPO_PUBLIC_API_URL env var (Staging, Production)
//  2. Platform.OS === 'web' (Web Browser URL detection)
//  3. Auto-detect LAN IP from Expo Constants / Metro (Expo Go / physical devices)
//  4. Localhost fallback (iOS Simulators)

let resolvedUrl: string = "";

function getApiUrl(): string {
  if (resolvedUrl) return resolvedUrl;

  // 1. Explicit env var
  if (process.env.EXPO_PUBLIC_API_URL) {
    let raw = process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/+$/, '');
    resolvedUrl = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
    console.log(`[API Config] Using EXPO_PUBLIC_API_URL: ${resolvedUrl}`);
    return resolvedUrl;
  }

  // 2. Auto-detect on Web
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    resolvedUrl = `http://${window.location.hostname}:8000/api/v1`;
    console.log(`[API Config] Auto-detected Web LAN IP: ${resolvedUrl}`);
    return resolvedUrl;
  }

  // 3. Robust LAN IP auto-detect (dev only)
  if (__DEV__) {
    // We check multiple sources because different Expo versions/platforms store the IP differently
    const urlsToTest = [
      Constants.experienceUrl,
      // @ts-ignore - Some Expo SDKs have hostUri under expoConfig
      Constants.expoConfig?.hostUri,
      NativeModules.SourceCode?.scriptURL,
    ];

    for (const testUrl of urlsToTest) {
      if (testUrl && typeof testUrl === 'string') {
        // Extract any IPv4 address (e.g. 192.168.1.5 or 10.0.0.2)
        const ipMatch = testUrl.match(/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/);
        if (ipMatch && ipMatch[1] && ipMatch[1] !== '127.0.0.1' && ipMatch[1] !== '0.0.0.0') {
          resolvedUrl = `http://${ipMatch[1]}:8000/api/v1`;
          console.log(`[API Config] Auto-detected LAN IP: ${resolvedUrl} (from ${testUrl})`);
          return resolvedUrl;
        }
      }
    }
  }

  // 4. Absolute fallback (Use explicit LAN IP to prevent 127.0.0.1 failures on Android)
  resolvedUrl = 'http://10.43.88.54:8000/api/v1';
  console.log(`[API Config] Falling back to known LAN IP: ${resolvedUrl}`);
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
