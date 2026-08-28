/**
 * Navigation type definitions
 */
import { NavigatorScreenParams } from '@react-navigation/native';

// Auth stack
export type AuthStackParamList = {
  Splash: undefined;
  Language: undefined;
  Onboarding: undefined;
  Login: undefined;
  OTP: { email: string };
  Registration: undefined;
};

// Add Product stack
export type AddProductStackParamList = {
  Camera: undefined;
  AIStudio: { imageUri: string };
  Voice: undefined;
  Extraction: undefined;
  Processing: undefined;
  Catalog: undefined;
  Pricing: undefined;
  Review: undefined;
  Success: { productId: string };
};

// Home stack
export type HomeStackParamList = {
  HomeMain: undefined;
  Notifications: undefined;
  AddProduct: NavigatorScreenParams<AddProductStackParamList>;
};

// Products stack
export type ProductsStackParamList = {
  ProductsList: undefined;
  ProductDetail: { productId: string };
  EditProduct: { productId: string };
};

// Orders stack
export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: { orderId: string };
  BulkOrder: { bulkOrderId: string };
  CounterOffer: { bulkOrderId: string };
};

// Sales stack
export type SalesStackParamList = {
  SalesMain: undefined;
  Insights: undefined;
};

// Profile stack
export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
};

// Marketplace stack
export type MarketplaceStackParamList = {
  BuyerHome: undefined;
  SearchResults: { query?: string };
  BuyerProduct: { productId: string };
  ArtisanProfile: { artisanId: string };
};

// Main tab
export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Products: NavigatorScreenParams<ProductsStackParamList>;
  Orders: NavigatorScreenParams<OrdersStackParamList>;
  Sales: NavigatorScreenParams<SalesStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Root
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Marketplace: NavigatorScreenParams<MarketplaceStackParamList>;
  AIAssistant: undefined;
};
