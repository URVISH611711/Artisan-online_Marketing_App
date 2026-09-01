// User types
export type UserRole = 'artisan' | 'buyer';
export type AppLanguage = 'en' | 'hi' | 'gu';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  address?: string;
  role: UserRole;
  profileImage?: string;
  language: AppLanguage;
  voiceLanguage: AppLanguage;
  createdAt: string;
  // Profile fields synchronized globally
  businessName?: string;
  craftType?: string;
  location?: string;
  state?: string;
  bio?: string;
  productsCount?: number;
  ordersCount?: number;
  rating?: number;
}

export interface ArtisanProfile {
  userId: string;
  businessName: string;
  craftType: string;
  location: string;
  state: string;
  bio?: string;
  craftStory?: string;
  yearsExperience?: number;
  productsCount: number;
  ordersCount: number;
  rating: number;
  verified: boolean;
  profileImage?: string;
}

export interface BuyerProfile {
  userId: string;
  companyName: string;
  location: string;
  ordersCompleted: number;
  verified: boolean;
}

export interface Notification {
  id: string;
  type: 'order' | 'pricing' | 'ai_recommendation' | 'inventory' | 'market_trend' | 'buyer_message';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface SalesData {
  totalSales: number;
  totalOrders: number;
  averageOrder: number;
  growthPercent: number;
  weeklyData: { week: string; amount: number }[];
  topProducts: { name: string; revenue: number; image?: string }[];
  buyerInterest: number;
}

export interface AIInsight {
  id: string;
  type: 'demand' | 'price' | 'image' | 'inventory' | 'seasonal';
  title: string;
  message: string;
  actionLabel: string;
  actionRoute?: string;
  color: string;
  icon: string;
}
