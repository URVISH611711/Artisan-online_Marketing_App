/**
 * Centralized API service for Artisan AI.
 * All requests go through FastAPI → Supabase PostgreSQL.
 * Never falls back to mock/dummy data.
 */
import { useAuthStore } from '../store/useAuthStore';
import { API_URL, endpoints } from '../config/api';

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  auth?: boolean;
};

/**
 * Authenticated fetch wrapper. Attaches JWT token automatically.
 */
async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    'Bypass-Tunnel-Reminder': 'true',
  };

  if (auth) {
    const token = useAuthStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_URL}${endpoint}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err: any) {
    console.error(`[API Network Error] Could not reach ${url}:`, err);
    throw new Error('Backend unavailable. Please check your network connection or LocalTunnel status.');
  }

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Session expired. Please log in again.');
    }

    let detail = 'Something went wrong';
    try {
      const errorData = await res.json();
      detail = errorData.detail || detail;
    } catch { }
    throw new Error(detail);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

/**
 * Health check helper to verify backend + LocalTunnel connectivity.
 */
export async function checkBackendHealth(): Promise<{ ok: boolean; message: string }> {
  try {
    const healthUrl = `${API_URL.replace(/\/api\/v1\/?$/, '')}/health`;
    const res = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'bypass-tunnel-reminder': 'true',
        'Bypass-Tunnel-Reminder': 'true',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok') {
        return { ok: true, message: 'Backend connected' };
      }
    }
    return { ok: false, message: 'Backend returned unhealthy response' };
  } catch (e: any) {
    return { ok: false, message: 'Backend unavailable. Please check LocalTunnel or server.' };
  }
}

// ─── Profile ─────────────────────────────────────────────────────
export interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  is_verified: boolean;
  business_name?: string;
  craft_type?: string;
  location?: string;
  state?: string;
  bio?: string;
  years_experience?: number;
  products_count: number;
  orders_count: number;
  rating: number;
}

export async function fetchProfile(): Promise<ProfileData> {
  return apiFetch<ProfileData>('/profile/');
}

export async function updateProfile(data: Partial<ProfileData>): Promise<ProfileData> {
  return apiFetch<ProfileData>('/profile/', { method: 'PUT', body: data });
}

// ─── Dashboard ───────────────────────────────────────────────────
export interface DashboardData {
  products_count: number;
  orders_count: number;
  total_sales: number;
  new_orders_count: number;
  period?: string;
  avg_sales?: number;
}

export async function fetchDashboard(period: 'today' | 'week' | 'month' | 'year' = 'today'): Promise<DashboardData> {
  return apiFetch<DashboardData>(`/profile/dashboard?period=${period}`);
}

// ─── Products ────────────────────────────────────────────────────
export interface ProductData {
  id: string;
  artisan_id: string;
  name: string;
  description: string;
  short_description?: string;
  material: string;
  craft_type: string;
  color?: string;
  origin: string;
  production_time?: string;
  price: number;
  quantity: number;
  length?: number;
  width?: number;
  diameter?: number;
  dimension_unit?: string;
  status: string;
  views: number;
  orders: number;
  rating?: number;
  images: { id: string; url: string; is_enhanced: boolean; sort_order: number }[];
  inventory?: {
    available_quantity: number;
    reserved_quantity: number;
    sold_quantity: number;
    low_stock_threshold: number;
  };
  artisan?: {
    user_id: string;
    business_name: string;
    name?: string;
    user?: { full_name: string };
    craft_type: string;
    location: string;
    city?: string;
    state: string;
    profile_image?: string;
  };
  translations?: {
    language_code: string;
    name: string;
    description: string;
    short_description?: string;
    is_ai_generated?: boolean;
    reviewed_by_user?: boolean;
  }[];
  keywords?: string[];
  seo?: any;
  created_at: string;
  updated_at: string;
}

export async function fetchProducts(statusFilter?: string): Promise<ProductData[]> {
  const qs = statusFilter ? `?status=${statusFilter}` : '';
  return apiFetch<ProductData[]>(`/products/${qs}`);
}

export async function fetchMarketplaceProducts(params?: { search?: string, category?: string, skip?: number, limit?: number }): Promise<ProductData[]> {
  const qsParams = new URLSearchParams();
  if (params?.search) qsParams.append('search', params.search);
  if (params?.category) qsParams.append('category', params.category);
  if (params?.skip !== undefined) qsParams.append('skip', params.skip.toString());
  if (params?.limit !== undefined) qsParams.append('limit', params.limit.toString());
  const qs = qsParams.toString() ? `?${qsParams.toString()}` : '';
  // Authenticated so the backend can exclude the viewer's OWN products from
  // the marketplace feed (you never buy from yourself).
  return apiFetch<ProductData[]>(`/products/marketplace${qs}`, { auth: true });
}

export async function fetchMarketplaceCategories(): Promise<string[]> {
  return apiFetch<string[]>('/products/categories', { auth: false });
}

export async function checkoutCart(data: { items: { product_id: string, quantity: number }[]; shipping_address: string }): Promise<any> {
  return apiFetch<any>('/orders/checkout', { method: 'POST', body: data });
}

export async function fetchProduct(id: string): Promise<ProductData> {
  return apiFetch<ProductData>(`/products/${id}`);
}

export async function createProduct(data: any): Promise<ProductData> {
  return apiFetch<ProductData>('/products/', { method: 'POST', body: data });
}

export async function updateProduct(id: string, data: any): Promise<ProductData> {
  return apiFetch<ProductData>(`/products/${id}`, { method: 'PUT', body: data });
}

export async function deleteProduct(id: string): Promise<void> {
  return apiFetch<void>(`/products/${id}`, { method: 'DELETE' });
}

// ─── Multilingual Auto-Cataloger ─────────────────────────────────
export interface CatalogTranslation {
  name?: string | null;
  description?: string | null;
  short_description?: string | null;
}

export interface CatalogResult {
  extracted: {
    name?: string | null;
    material?: string | null;
    color?: string | null;
    craft_type?: string | null;
    price?: string | number | null;
    dimensions?: string | null;
    length?: string | number | null;
    width?: string | number | null;
    diameter?: string | number | null;
    origin?: string | null;
    confidence?: Record<string, number>;
    [key: string]: any;
  };
  translations: {
    en?: CatalogTranslation;
    hi?: CatalogTranslation;
    [key: string]: CatalogTranslation | undefined;
  };
  seo: {
    title?: string | null;
    meta_description?: string | null;
    keywords?: string[];
    tags?: string[];
  };
  image_check: {
    mismatch: boolean;
    message?: string | null;
  };
}

export interface GenerateCatalogBody {
  transcript: string;
  language?: string;
  product_id?: string;
  existing_description?: string;
  confidence_score?: number;
}

export interface ApplyCatalogBody {
  product_id: string;
  translations: Record<string, CatalogTranslation>;
  keywords: string[];
  seo?: any;
  base_updates?: Record<string, any>;
}

/** Generate an editable bilingual catalog draft from a voice transcript. No DB write to the product. */
export async function generateCatalog(body: GenerateCatalogBody): Promise<{ success: boolean; catalog: CatalogResult }> {
  return apiFetch<{ success: boolean; catalog: CatalogResult }>('/ai/catalog/generate', { method: 'POST', body });
}

/** Persist the artisan-reviewed catalog (EN/HI translations, keywords, SEO) onto an existing owned product. */
export async function applyCatalog(body: ApplyCatalogBody): Promise<ProductData> {
  return apiFetch<ProductData>('/ai/catalog/apply', { method: 'POST', body });
}

// ─── Orders ──────────────────────────────────────────────────────
export interface OrderItemData {
  id: string;
  product_id?: string;
  buyer_id?: string;
  seller_id?: string;
  product_name_snapshot: string;
  product_image_snapshot?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  seller_name?: string;
  buyer_name?: string;
}

export interface OrderTimelineData {
  id: string;
  status_label: string;
  status_state: string;
  created_at: string;
}

export interface OrderData {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address?: string;
  expected_delivery?: string;
  items: OrderItemData[];
  timeline: OrderTimelineData[];
  buyer_name?: string;
  role?: 'buyer' | 'seller';
  created_at: string;
  updated_at: string;
}

/** role='seller' → orders received for my products; role='buyer' → my purchases. */
export async function fetchOrders(role: 'buyer' | 'seller' = 'seller'): Promise<OrderData[]> {
  return apiFetch<OrderData[]>(`/orders/?role=${role}`);
}

export async function fetchOrder(id: string, role?: 'buyer' | 'seller'): Promise<OrderData> {
  const qs = role ? `?role=${role}` : '';
  return apiFetch<OrderData>(`/orders/${id}${qs}`);
}

export async function updateOrderStatus(id: string, status: string): Promise<OrderData> {
  return apiFetch<OrderData>(`/orders/${id}/status`, { method: 'PUT', body: { status } });
}

// ─── Notifications ───────────────────────────────────────────────
export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export async function fetchNotifications(): Promise<NotificationData[]> {
  return apiFetch<NotificationData[]>('/notifications/');
}

export async function markNotificationAsRead(id: string): Promise<void> {
  return apiFetch<void>(`/notifications/${id}/read`, { method: 'PUT' });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  return apiFetch<void>('/notifications/read-all', { method: 'PUT' });
}

export async function registerPushToken(token: string, deviceName?: string): Promise<void> {
  return apiFetch<void>('/notifications/push-token', {
    method: 'POST',
    body: { token, device_name: deviceName },
  });
}

// ─── AI Image Enhancement ─────────────────────────────────────────

export interface EnhanceOptions {
  product_name?: string;
  name?: string;
  description?: string;
  material?: string;
  color?: string;
  craft?: string;
  craftType?: string;
  style?: string;
  background_mode?: string;
  custom_prompt?: string;
}

export type JobStatusType =
  | 'UPLOADING'
  | 'ANALYZING_PRODUCT'
  | 'ANALYZING'
  | 'REMOVING_BACKGROUND'
  | 'PRODUCT_ISOLATED'
  | 'GENERATING_BACKGROUND'
  | 'COMPOSITING_PRODUCT'
  | 'UPSCALING'
  | 'SAVING'
  | 'COMPLETED'
  | 'FAILED';

export interface JobStatusResult {
  success: boolean;
  job_id: string;
  status: JobStatusType;
  progress: number;
  message: string;
  result?: {
    original_urls: string[];
    enhanced_urls: string[];
    final_paths?: string[];
    prompt_used?: string;
    background_mode?: string;
  };
  error?: string;
}

export interface EnhanceResult {
  success: boolean;
  status: JobStatusType;
  job_id?: string;
  original_urls: string[];
  enhanced_urls: string[];
  model?: string;
  processing_time_seconds?: number;
  error_message?: string;
}

/**
 * Send product images to the backend for local AI enhancement via Studio pipeline.
 */
export async function enhanceProductImages(
  imageUris: string[],
  options: EnhanceOptions = {}
): Promise<EnhanceResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const token = useAuthStore.getState().token;
      const xhr = new XMLHttpRequest();

      console.log(`[API] Starting upload to ${endpoints.studio.process}...`);

      xhr.open('POST', endpoints.studio.process);

      const formData = new FormData();

      // Append each image as a binary file (RN-compatible object format)
      for (const uri of imageUris) {
        const filename = uri.split('/').pop() || 'image.jpg';
        const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType =
          ext === 'png' ? 'image/png' :
            ext === 'webp' ? 'image/webp' :
              'image/jpeg';

        formData.append('images', {
          uri,
          name: filename,
          type: mimeType,
        } as any);
      }

      // Product details as form fields
      const pName = options.product_name || options.name;
      if (pName) formData.append('product_name', pName);
      if (options.description) formData.append('description', options.description);
      if (options.material) formData.append('material', options.material);
      if (options.color) formData.append('color', options.color);
      const pCraft = options.craft || options.craftType;
      if (pCraft) formData.append('craft_type', pCraft);
      if (options.style) formData.append('style', options.style);
      if (options.background_mode) formData.append('background_mode', options.background_mode);
      if (options.custom_prompt) formData.append('custom_prompt', options.custom_prompt);

      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('bypass-tunnel-reminder', 'true');

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else if (xhr.status === 401) {
          useAuthStore.getState().logout();
          reject(new Error('Session expired. Please log in again.'));
        } else {
          console.error(`[API] HTTP Error ${xhr.status}:`, xhr.responseText);
          reject(new Error(`Enhancement request failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = (e) => {
        console.error(`[API] Network error during upload to ${endpoints.studio.process}:`, e);
        reject(new Error('Network error. Check your connection to the server.'));
      };
      xhr.send(formData);
    } catch (e) {
      reject(e);
    }
  });
}

export async function getEnhancementStatus(jobId: string): Promise<JobStatusResult> {
  return apiFetch<JobStatusResult>(`/ai/studio/status/${jobId}`);
}

export async function regenerateBackground(jobId: string, backgroundMode?: string, customPrompt?: string) {
  return apiFetch('/ai/studio/regenerate', {
    method: 'POST',
    body: { job_id: jobId, background_mode: backgroundMode, custom_prompt: customPrompt },
  });
}

export async function publishStudioProduct(jobId: string, productDetails: any, selectedImageUrls?: string[]) {
  return apiFetch('/ai/studio/publish', {
    method: 'POST',
    body: { job_id: jobId, product_details: productDetails, selected_image_urls: selectedImageUrls },
  });
}

export async function autoFillBackgroundDetails(imageUri: string, productDetails: any) {
  let imageBase64 = imageUri;
  if (imageUri.startsWith('file://') || imageUri.startsWith('ph://')) {
    const FileSystem = require('expo-file-system');
    imageBase64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
  }
  return apiFetch('/ai/studio/auto-fill-background', {
    method: 'POST',
    body: {
      image_base64: imageBase64,
      product_details: productDetails,
    },
  });
}

export async function transcribeVoice(audioUri: string): Promise<{ success: boolean; text: string; language?: string; language_probability?: number }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Not authenticated');

  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    name: 'voice.m4a',
    type: 'audio/m4a',
  } as any);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/ai/voice/transcribe`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('bypass-tunnel-reminder', 'true');
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data?.detail || 'Transcription failed'));
      } catch {
        reject(new Error('Invalid response'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}


export async function autoDescribeProduct(imageUri: string): Promise<any> {
  const token = useAuthStore.getState().token;
  const formData = new FormData();

  const filename = imageUri.split('/').pop() || 'image.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType =
    ext === 'png' ? 'image/png' :
      ext === 'webp' ? 'image/webp' :
        'image/jpeg';

  // Ensure file:// prefix for Android
  let validUri = imageUri;
  if (!validUri.startsWith('file://') && !validUri.startsWith('ph://') && !validUri.startsWith('http')) {
    validUri = 'file://' + validUri;
  }

  formData.append('image', {
    uri: validUri,
    name: filename,
    type: mimeType,
  } as any);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/products/auto-describe`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('bypass-tunnel-reminder', 'true');
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data.data || {});
        } else {
          reject(new Error(data?.detail || 'Auto-describe failed'));
        }
      } catch {
        reject(new Error('Invalid response'));
      }
    };
    xhr.onerror = (e) => {
      console.error('[autoDescribeProduct] XMLHttpRequest network error:', e);
      reject(new Error('Network error'));
    };
    xhr.send(formData);
  });
}

