import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductDraft, ProductCreationStep } from '../types';

interface DraftState {
  draft: ProductDraft | null;
  createDraft: () => void;
  updateDraft: (updates: Partial<ProductDraft>) => void;
  setStep: (step: ProductCreationStep) => void;
  clearDraft: () => void;
  hasDraft: () => boolean;
}

const INITIAL_DRAFT: ProductDraft = {
  step: 'camera',
};

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      draft: null,

      createDraft: () => set({ draft: { ...INITIAL_DRAFT, id: `draft_${Date.now()}` } }),

      updateDraft: (updates) =>
        set((state) => ({
          draft: state.draft ? { ...state.draft, ...updates } : null,
        })),

      setStep: (step) =>
        set((state) => ({
          draft: state.draft ? { ...state.draft, step } : null,
        })),

      clearDraft: () => set({ draft: null }),

      hasDraft: () => get().draft !== null,
    }),
    {
      name: 'artisan-draft',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
