/**
 * Navigation type definitions
 */
import { NavigatorScreenParams } from '@react-navigation/native';

// Auth stack
export type AuthStackParamList = {
  Splash: undefined;
  Language: undefined;
  Onboarding: undefined;
  Welcome: undefined;
  Login: undefined;
  OTP: { email: string; isSignUp?: boolean };
  SignUp: undefined;
  Registration: undefined;
};

// Add Product stack — 5-step flow
// Camera → ProductDetails → BackgroundMode → AIStudio → Review → Success
export type AddProductStackParamList = {
  Camera: undefined;
  Voice: undefined;                                    // optional voice input step
  ProductDetails: { imageUris: string[] };             // user enters product info
  BackgroundMode: {                                    // pick background style
    imageUris: string[];
    productDetails: Record<string, string>;
  };
  AIStudio: {                                          // live processing + result
    imageUris: string[];
    productDetails: Record<string, string>;
    backgroundMode: string;
    customPrompt?: string;
  };
  Review: {                                           // review before publish
    jobId: string;
    enhancedUrls: string[];
    productDetails: Record<string, string>;
  };
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
