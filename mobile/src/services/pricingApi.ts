/**
 * Smart Pricing API service.
 * Calls POST /api/v1/ai/smart-price/{productId} to get Kimi-K3 pricing.
 *
 * Kimi acts as the seller's personal pricing assistant — it receives
 * only the product name, current price and image, then independently
 * approximates all other factors and returns three price choices.
 */
import { API_URL } from '../config/api';
import { useAuthStore } from '../store/useAuthStore';

// ─── Response Types ───────────────────────────────────────────────────────────

/** A single AI-recommended price tier. */
export interface SmartPriceItem {
  price: number;
  label: string;
  reason: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

/** The three pricing tiers returned by Kimi. */
export interface SmartPriceTiers {
  competitive: SmartPriceItem;
  recommended: SmartPriceItem;
  premium: SmartPriceItem;
}

/** Kimi's analysis of the product image and context. */
export interface SmartPriceAnalysis {
  product_type: string;
  apparent_material: string;
  craftsmanship: string;
  quality: string;
  complexity: string;
  estimated_market_position: string;
  estimated_demand: string;
  pricing_assessment: string;
}

/** Full Kimi JSON result (matches backend schema). */
export interface SmartPricingResult {
  current_price: number;
  prices: SmartPriceTiers;
  analysis: SmartPriceAnalysis;
  recommended_reason: string;
  warnings: string[];
}

/** Top-level response from POST /ai/smart-price/{productId} */
export interface SmartPriceResponse {
  success: boolean;
  // Present when success === true
  product_id?: string;
  product_name?: string;
  current_price?: number;
  image_url?: string;
  result?: SmartPricingResult;
  // Present when success === false
  error?: string;
}

// ─── API Call ─────────────────────────────────────────────────────────────────

/**
 * Request smart pricing for a product.
 * The backend fetches the product image, name and current price
 * from Supabase; only the product ID is sent from the frontend.
 *
 * On AI failure the backend returns { success: false, error: "..." }.
 * This function throws in that case so the caller sees an Error.
 */
export async function analyzeSmartPrice(productId: string): Promise<SmartPriceResponse> {
  const token = useAuthStore.getState().token;
  const url = `${API_URL}/ai/smart-price/${productId}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    'Bypass-Tunnel-Reminder': 'true',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers });
  } catch (err: any) {
    console.error('[SmartPrice] Network error:', err);
    throw new Error(
      'Could not reach the server. Please check your internet connection and try again.'
    );
  }

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Session expired. Please log in again.');
    }
    if (res.status === 404) {
      throw new Error('Product not found.');
    }
    if (res.status === 400) {
      let detail = 'Product image is required for AI pricing.';
      try {
        const d = await res.json();
        detail = d.detail || detail;
      } catch {}
      throw new Error(detail);
    }
    if (res.status === 429) {
      throw new Error('Smart Pricing is temporarily unavailable. Please try again in a moment.');
    }
    let detail = 'Smart pricing request failed.';
    try {
      const d = await res.json();
      detail = d.detail || detail;
    } catch {}
    throw new Error(detail);
  }

  const data: SmartPriceResponse = await res.json();

  // The backend returns 200 even on AI failure — surface it as an Error here
  if (!data.success) {
    throw new Error(data.error || 'Unable to generate smart pricing right now. Please try again.');
  }

  return data;
}
