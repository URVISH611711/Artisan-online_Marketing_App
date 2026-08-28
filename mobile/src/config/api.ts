// API Configuration
// Using your machine's exact local IP address so Expo Go can connect!
const LOCAL_IP = '10.53.75.100';

export const API_URL = `http://${LOCAL_IP}:8000/api/v1`;

export const endpoints = {
  auth: {
    login: `${API_URL}/auth/login`,
    verifyOtp: `${API_URL}/auth/verify-otp`,
  }
};
