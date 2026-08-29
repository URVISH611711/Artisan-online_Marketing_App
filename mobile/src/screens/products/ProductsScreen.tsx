import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProductsStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Chip } from '../../components/ui/Chip';
import { ProductCard } from '../../components/product/ProductCard';
import { EmptyState } from '../../components/states/StateScreens';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { fetchProducts, ProductData } from '../../services/api';
import { Product } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

type Props = { navigation: NativeStackNavigationProp<ProductsStackParamList, 'ProductsList'> };

type Filter = 'All' | 'Live' | 'Draft' | 'Out of Stock';
const FILTERS: Filter[] = ['All', 'Live', 'Draft', 'Out of Stock'];

export const ProductsScreen: React.FC<Props> = ({ navigation }) => {
  const [filter, setFilter] = useState<Filter>('All');
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setError(false);
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error('Products load error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const filtered = products.filter((p) => {
    if (filter === 'All') return true;
    if (filter === 'Live') return p.status === 'PUBLISHED' || p.status === 'published';
    if (filter === 'Draft') return p.status === 'DRAFT' || p.status === 'draft';
    if (filter === 'Out of Stock') return p.status === 'OUT_OF_STOCK' || p.status === 'out_of_stock';
    return true;
  });

  // Map API data to Product type for ProductCard
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
    status: p.status === 'PUBLISHED' ? 'live' : p.status === 'DRAFT' ? 'draft' : p.status === 'OUT_OF_STOCK' ? 'out_of_stock' : 'draft',
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

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <Header
        title="My Products"
        rightText="+ Add"
        onRightPress={() => navigation.getParent()?.getParent()?.navigate('Home', { screen: 'AddProduct', params: { screen: 'Camera' } })}
      />

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <EmptyState
          icon="warning-outline"
          title="Unable to load products"
          message="Please check your connection and try again."
          actionLabel="Retry"
          onAction={loadProducts}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title="No products yet"
          message="Let's add your first product. Take a photo and AI will do the rest."
          actionLabel="Take a Photo"
          onAction={() => {}}
          secondaryActionLabel="Describe by Voice"
          onSecondaryAction={() => {}}
        />
      ) : (
        <FlatList
          data={filtered.map(mapToProduct)}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard product={item} onPress={handleProductPress} />
            </View>
          )}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row', paddingHorizontal: layout.screenPadding,
    paddingVertical: 12,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { paddingHorizontal: layout.screenPadding - 4, paddingBottom: 100 },
  cardWrapper: { flex: 1 },
});
