import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProductCreationStep =
  | 'camera'
  | 'voice'
  | 'product_details'
  | 'background_mode'
  | 'ai_studio'
  | 'review'
  | 'success';

export interface ProductDraft {
  id?: string;
  step: ProductCreationStep;

  // Captured images
  imageUris?: string[];

  // User-entered product details
  name?: string;
  description?: string;
  material?: string;
  craftType?: string;
  color?: string;
  price?: number;
  quantity?: number;
  keyFeatures?: string;
  intendedUse?: string;
  targetCustomer?: string;
  style?: string;

  // Background selection
  backgroundMode?: string;
  customPrompt?: string;

  // AI Studio results
  jobId?: string;
  enhancedImageUrls?: string[];

  // Published product
  productId?: string;

  // Legacy field kept for backward compat with any existing persisted drafts
  image?: string;
}

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
