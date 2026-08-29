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
  };

  if (auth) {
    const token = useAuthStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_URL}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Session expired. Please log in again.');
    }
    
    let detail = 'Something went wrong';
    try {
      const errorData = await res.json();
      detail = errorData.detail || detail;
    } catch {}
    throw new Error(detail);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
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
}

export async function fetchDashboard(): Promise<DashboardData> {
  return apiFetch<DashboardData>('/profile/dashboard');
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
  status: string;
  views: number;
  orders: number;
  rating?: number;
  images: { id: string; url: string; is_enhanced: boolean; sort_order: number }[];
  created_at: string;
  updated_at: string;
}

export async function fetchProducts(statusFilter?: string): Promise<ProductData[]> {
  const qs = statusFilter ? `?status=${statusFilter}` : '';
  return apiFetch<ProductData[]>(`/products/${qs}`);
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

export async function fetchMarketplaceProducts(search?: string): Promise<ProductData[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiFetch<ProductData[]>(`/products/marketplace${qs}`, { auth: false });
}

// ─── Orders ──────────────────────────────────────────────────────
export interface OrderItemData {
  id: string;
  product_name_snapshot: string;
  product_image_snapshot?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
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
  created_at: string;
  updated_at: string;
}

export async function fetchOrders(): Promise<OrderData[]> {
  return apiFetch<OrderData[]>('/orders/');
}

export async function fetchOrder(id: string): Promise<OrderData> {
  return apiFetch<OrderData>(`/orders/${id}`);
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

export async function publishStudioProduct(jobId: string, productDetails: any) {
  return apiFetch('/ai/studio/publish', {
    method: 'POST',
    body: { job_id: jobId, product_details: productDetails },
  });
}

export async function transcribeVoice(audioUri: string): Promise<{ success: boolean; text: string; language?: string }> {
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

