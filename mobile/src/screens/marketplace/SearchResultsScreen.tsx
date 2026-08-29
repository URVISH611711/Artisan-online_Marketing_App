import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { MarketplaceCard } from '../../components/product/ProductCard';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { fetchMarketplaceProducts, ProductData } from '../../services/api';
import { Product } from '../../types';

export const SearchResultsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [query, setQuery] = useState(route.params?.query || '');
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketplaceProducts(query || undefined)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  const mapToProduct = (p: ProductData): Product => ({
    id: p.id,
    name: p.name,
    description: p.description,
    shortDescription: p.short_description,
    price: p.price,
    category: p.craft_type,
    material: p.material,
    color: p.color || '',
    craftType: p.craft_type,
    origin: p.origin,
    productionTime: p.production_time,
    quantity: 0,
    status: 'live',
    images: p.images.map(img => ({ id: img.id, url: img.url, isEnhanced: img.is_enhanced, order: img.sort_order })),
    translations: [],
    keywords: [],
    views: p.views,
    orders: p.orders,
    rating: p.rating,
    artisanId: p.artisan_id,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  });

  return (
    <ScreenWrapper padded={false}>
      <Header onBack={() => navigation.goBack()} />
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search crafts, artisans..."
          placeholderTextColor={colors.textTertiary}
          autoFocus
        />
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <Text style={styles.count}>{products.length} products found</Text>
          <FlatList
            data={products.map(mapToProduct)}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <MarketplaceCard
                product={item}
                artisanLocation={item.origin}
                onPress={(p) => navigation.navigate('BuyerProduct', { productId: p.id })}
              />
            )}
          />
        </>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  searchRow: { paddingHorizontal: layout.screenPadding, paddingBottom: 12 },
  input: {
    height: 48, backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: 16, fontSize: 15, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border,
  },
  count: { paddingHorizontal: layout.screenPadding, fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  grid: { paddingHorizontal: layout.screenPadding - 4, paddingBottom: 40 },
});
