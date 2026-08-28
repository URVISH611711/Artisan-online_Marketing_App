# Artisan-AI — React Native to FastAPI Mapping

This document maps the React Native UI requirements directly to the FastAPI database models and endpoints.

## 1. Auth Flow (`AuthNavigator.tsx`)
- **LoginScreen / OTPScreen**
  - **Endpoint:** `POST /api/v1/auth/verify-otp`
  - **Tables:** `users`
  - **Response:** `UserResponse` with JWT token.
- **RegistrationScreen**
  - **Endpoint:** `POST /api/v1/auth/register`
  - **Tables:** `users`, `artisan_profiles`
  - **Response:** `UserResponse` + `ArtisanProfileResponse`

## 2. Add Product Flow (`AddProductNavigator.tsx`)
- **CameraScreen & AIStudioScreen**
  - **Endpoint:** `POST /api/v1/products/{id}/images` and `POST /api/v1/products/{id}/enhance-image`
  - **Tables:** `product_images`, `ai_processing_jobs`
- **VoiceScreen & ExtractionScreen**
  - **Endpoint:** `POST /api/v1/products/drafts/voice`
  - **Tables:** `voice_recordings`, `speech_transcripts`, `product_drafts`
  - **Process:** Speech-to-text API is called, extracting attributes into the draft.
- **CatalogScreen**
  - **Endpoint:** `PUT /api/v1/products/drafts/{id}`
  - **Tables:** `product_drafts` (JSONB update)
- **PricingScreen**
  - **Endpoint:** `POST /api/v1/products/drafts/{id}/predict-price`
  - **Tables:** `price_predictions`
- **ReviewScreen & SuccessScreen**
  - **Endpoint:** `POST /api/v1/products/drafts/{id}/publish`
  - **Tables:** Migrates data from `product_drafts` -> `products`, `product_attributes`, `inventory`, `product_translations`.

## 3. Main App (`MainTabNavigator.tsx`)
- **ProductsScreen**
  - **Endpoint:** `GET /api/v1/products/me`
  - **Tables:** `products` JOIN `product_images`
- **OrdersScreen & OrderDetailScreen**
  - **Endpoint:** `GET /api/v1/orders/me` and `GET /api/v1/orders/{id}`
  - **Tables:** `orders` JOIN `order_items` JOIN `users` (Buyer details)
- **SalesScreen**
  - **Endpoint:** `GET /api/v1/sales/summary`
  - **Tables:** Aggregate queries over `orders` and `order_items` where status = COMPLETED.
- **InsightsScreen**
  - **Endpoint:** `GET /api/v1/insights`
  - **Tables:** `business_insights`
- **NotificationsScreen**
  - **Endpoint:** `GET /api/v1/notifications`
  - **Tables:** `notifications`

## 4. Marketplace
- **BuyerHomeScreen & SearchResultsScreen**
  - **Endpoint:** `GET /api/v1/marketplace/products?q={query}&category={cat}`
  - **Tables:** `products` JOIN `product_keywords` (Full-Text Search on `keywords.keyword` and `products.name`)
- **BuyerProductScreen**
  - **Endpoint:** `GET /api/v1/marketplace/products/{id}`
  - **Tables:** `products` JOIN `artisan_profiles` JOIN `product_images`

## 5. B2B / Bulk Orders
- **BulkOrderScreen**
  - **Endpoint:** `POST /api/v1/bulk-orders`
  - **Tables:** `bulk_order_requests`
- **CounterOfferScreen**
  - **Endpoint:** `POST /api/v1/bulk-orders/{id}/counter-offer`
  - **Tables:** `counter_offers`
