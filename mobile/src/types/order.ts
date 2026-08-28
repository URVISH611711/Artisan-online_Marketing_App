// Order types
export interface Order {
  id: string;
  orderId: string; // e.g. #KAI-2024-0847
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  status: OrderStatus;
  buyerName: string;
  buyerCompany?: string;
  buyerLocation?: string;
  buyerPhone?: string;
  buyerVerified: boolean;
  shippingAddress?: string;
  expectedDelivery?: string;
  timeline: OrderTimelineItem[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'new' | 'accepted' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export interface OrderTimelineItem {
  label: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
}

export interface BulkOrderRequest {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  deliveryDays: number;
  buyerName: string;
  buyerCompany: string;
  buyerLocation: string;
  buyerVerified: boolean;
  buyerOrdersCompleted: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  counterOffer?: CounterOffer;
  createdAt: string;
}

export interface CounterOffer {
  id: string;
  bulkOrderId: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  deliveryDays: number;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
