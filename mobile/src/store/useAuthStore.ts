import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AppLanguage } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;

  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setOnboarded: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
      setToken: (token) => set({ token }),
      setOnboarded: (value) => set({ isOnboarded: value }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'artisan-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isOnboarded: state.isOnboarded,
      }),
    },
  ),
);

// Language store
interface LanguageState {
  language: AppLanguage;
  voiceLanguage: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  setVoiceLanguage: (lang: AppLanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      voiceLanguage: 'hi',
      setLanguage: (language) => set({ language }),
      setVoiceLanguage: (voiceLanguage) => set({ voiceLanguage }),
    }),
    {
      name: 'artisan-language',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
