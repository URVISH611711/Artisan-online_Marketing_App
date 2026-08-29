// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  category: string;
  material: string;
  color: string;
  craftType: string;
  origin: string;
  productionTime?: string;
  quantity: number;
  status: 'draft' | 'live' | 'out_of_stock' | 'archived';
  images: ProductImage[];
  translations: ProductTranslation[];
  keywords: string[];
  views: number;
  orders: number;
  rating?: number;
  artisanId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  isEnhanced: boolean;
  originalUrl?: string;
  order: number;
}

export interface ProductTranslation {
  language: 'en' | 'hi' | 'gu';
  name: string;
  description: string;
  shortDescription?: string;
}

export interface ProductDraft {
  id?: string;
  // Single image (legacy) — kept for backward compat
  image?: string;
  enhancedImage?: string;
  originalImage?: string;
  // Multi-image support
  images?: string[];          // original local URIs
  enhancedImages?: string[];  // server-returned enhanced image URLs
  originalUrls?: string[];    // server-stored original image URLs
  enhancementJobId?: string;  // session_id from backend
  enhancementModel?: string;  // e.g. 'gemini-2.0-flash-exp'
  enhancements?: {
    background_cleaned?: boolean;
    lighting_adjusted?: boolean;
    composition_optimized?: boolean;
    sharpness_improved?: boolean;
    lifestyle_created?: boolean;
  };
  transcript?: string;
  transcriptLanguage?: string;
  name?: string;
  category?: string;
  material?: string;
  color?: string;
  craftType?: string;
  origin?: string;
  productionTime?: string;
  size?: string;
  weight?: string;
  description?: string;
  shortDescription?: string;
  translations?: ProductTranslation[];
  keywords?: string[];
  materialCost?: number;
  labourCost?: number;
  packagingCost?: number;
  price?: number;
  recommendedPrice?: number;
  quantity?: number;
  step: ProductCreationStep;
}

export type ProductCreationStep =
  | 'camera'
  | 'ai_studio'
  | 'voice'
  | 'extraction'
  | 'processing'
  | 'catalog'
  | 'pricing'
  | 'review'
  | 'publishing'
  | 'success';

export interface PricePrediction {
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  estimatedCost: number;
  estimatedProfit: number;
  confidence: number;
  factors: string[];
}

export interface AIEnhancement {
  originalImage: string;
  enhancedImage: string;
  steps: {
    label: string;
    completed: boolean;
  }[];
  backgroundOptions: string[];
  qualityScore: number;
}

export interface CatalogGeneration {
  title: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  material: string;
  craft: string;
  origin: string;
  keywords: string[];
  translations: {
    en: { title: string; description: string };
    hi: { title: string; description: string };
  };
}
