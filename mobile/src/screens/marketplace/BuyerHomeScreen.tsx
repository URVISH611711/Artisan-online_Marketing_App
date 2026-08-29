import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { MarketplaceCard } from '../../components/product/ProductCard';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { fetchMarketplaceProducts, ProductData } from '../../services/api';
import { Product } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export const BuyerHomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMarketplaceProducts()
        .then(setProducts)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [])
  );

  const filteredProducts = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Ionicons name="leaf" size={18} color={colors.primary} />
          <Text style={styles.logoText}>Artisan-AI</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="person-circle-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search handcrafted products..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Products Yet</Text>
          <Text style={styles.emptyMessage}>
            {search ? 'No products match your search.' : 'The marketplace is empty. Check back soon!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts.map(mapToProduct)}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <MarketplaceCard
                product={item}
                onPress={(p) => navigation.navigate('BuyerProduct', { productId: p.id })}
              />
            </View>
          )}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: layout.screenPadding, paddingVertical: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: layout.screenPadding, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptyMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  grid: { paddingHorizontal: layout.screenPadding - 4, paddingBottom: 100 },
  cardWrapper: { flex: 1 },
});
