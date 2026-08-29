/**
 * Centralized API service for Artisan AI.
 * All requests go through FastAPI → Supabase PostgreSQL.
 * Never falls back to mock/dummy data.
 */
import { useAuthStore } from '../store/useAuthStore';
import { API_URL } from '../config/api';

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
  material?: string;
  color?: string;
  craft?: string;
  style?: string;
  background_style?: string;
}

export interface JobStatusResult {
  success: boolean;
  job_id: string;
  status: 'UPLOADING' | 'ANALYZING' | 'REMOVING_BACKGROUND' | 'CREATING_BACKGROUND' | 'COMPOSITING' | 'COMPLETED' | 'FAILED';
  progress: number;
  message: string;
  result?: {
    original_urls: string[];
    enhanced_urls: string[];
    prompt_used?: string;
  };
  error?: string;
}

export interface EnhanceResult {
  success: boolean;
  status: 'COMPLETED' | 'FAILED';
  job_id?: string;
  original_urls: string[];
  enhanced_urls: string[];
  model?: string;
  processing_time_seconds?: number;
  error_message?: string;
  enhancements?: {
    background_cleaned: boolean;
    lighting_adjusted: boolean;
    composition_optimized: boolean;
    sharpness_improved: boolean;
    lifestyle_created: boolean;
  };
}

/**
 * Send product images to the backend for Gemini AI enhancement.
 * Uses XMLHttpRequest with multipart/form-data — XHR has native FormData
 * file-upload support in React Native (fetch does not in RN 0.86+).
 * The Gemini API key never leaves the server.
 */
export async function enhanceProductImages(
  imageUris: string[],
  options: EnhanceOptions = {}
): Promise<EnhanceResult> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Not authenticated');

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
  formData.append('product_name', options.product_name || '');
  formData.append('material', options.material || '');
  formData.append('color', options.color || '');
  formData.append('craft', options.craft || '');
  formData.append('style', options.style || '');
  formData.append('background_style', options.background_style || 'Professional Studio');

  const url = `${API_URL}/ai/process`;

  // Use XHR — React Native natively supports FormData file uploads via XHR.
  // fetch() with FormData file objects throws "unsupported FormDataPart" in RN 0.86+.
  return new Promise<EnhanceResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    // Do NOT set Content-Type — XHR sets it automatically with the multipart boundary

    xhr.onload = () => {
      let data: EnhanceResult;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error('Invalid JSON response from server.'));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        reject(new Error((data as any)?.detail || `Enhancement failed (HTTP ${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error — check your connection and that the server is reachable.'));
    xhr.ontimeout = () => reject(new Error('Request timed out. Enhancement may take up to 60 seconds — please try again.'));

    xhr.timeout = 120000;
    xhr.send(formData);
  });
}

export async function pollJobStatus(jobId: string): Promise<JobStatusResult> {
  return apiFetch<JobStatusResult>(`/ai/status/${jobId}`);
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

