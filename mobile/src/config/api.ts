import { NativeModules } from 'react-native';

// API Configuration
let LOCAL_IP = '10.53.75.140'; // Fallback if auto-detect fails

// Auto-detect the IP address of the machine running the Expo Metro bundler
if (__DEV__) {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    // Extract IP from "http://192.168.x.x:8081/..."
    const match = scriptURL.match(/http:\/\/([^:]+)/);
    if (match && match[1]) {
      LOCAL_IP = match[1];
    }
  }
}

export const API_URL = `http://${LOCAL_IP}:8000/api/v1`;

export const endpoints = {
  auth: {
    login: `${API_URL}/auth/login`,
    verifyOtp: `${API_URL}/auth/verify-otp`,
  }
};
