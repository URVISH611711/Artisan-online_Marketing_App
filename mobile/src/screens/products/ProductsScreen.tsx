import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProductsStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Chip } from '../../components/ui/Chip';
import { ProductCard, MarketplaceCard } from '../../components/product/ProductCard';
import { EmptyState } from '../../components/states/StateScreens';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { fetchProducts, fetchMarketplaceProducts, fetchMarketplaceCategories, ProductData } from '../../services/api';
import { Product } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';

type Props = { navigation: NativeStackNavigationProp<ProductsStackParamList, 'ProductsList'> };

type Mode = 'my_products' | 'marketplace';
type Filter = 'All' | 'Live' | 'Draft' | 'Out of Stock';
const FILTERS: Filter[] = ['All', 'Live', 'Draft', 'Out of Stock'];

export const ProductsScreen: React.FC<Props> = ({ navigation }) => {
  const { cartCount } = useCart();
  const [mode, setMode] = useState<Mode>('my_products');
  const [categories, setCategories] = useState<string[]>(['All']);

  useFocusEffect(
    useCallback(() => {
      fetchMarketplaceCategories().then(cats => {
        setCategories(['All', ...cats]);
      }).catch(console.error);
    }, [])
  );
  
  // My Products State
  const [filter, setFilter] = useState<Filter>('All');
  const [myProducts, setMyProducts] = useState<ProductData[]>([]);
  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState(false);

  // Marketplace State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [marketProducts, setMarketProducts] = useState<ProductData[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMyProducts = useCallback(async () => {
    try {
      setMyError(false);
      setMyLoading(true);
      const data = await fetchProducts();
      setMyProducts(data);
    } catch (err) {
      console.error('Products load error:', err);
      setMyError(true);
    } finally {
      setMyLoading(false);
    }
  }, []);

  const loadMarketplace = useCallback(async (reset = false) => {
    if (!reset && (!hasMore || marketLoading)) return;
    
    const currentSkip = reset ? 0 : skip;
    try {
      if (reset) {
        setMarketError(false);
        setMarketProducts([]);
      }
      setMarketLoading(true);
      
      const data = await fetchMarketplaceProducts({ 
        search: search.trim() !== '' ? search.trim() : undefined, 
        category: category !== 'All' ? category : undefined,
        skip: currentSkip, 
        limit: 20 
      });
      
      if (reset) {
        setMarketProducts(data);
      } else {
        setMarketProducts(prev => [...prev, ...data]);
      }
      
      setSkip(currentSkip + 20);
      setHasMore(data.length === 20);
    } catch (err) {
      console.error('Marketplace load error:', err);
      if (reset) setMarketError(true);
    } finally {
      setMarketLoading(false);
    }
  }, [search, category, skip, hasMore, marketLoading]);

  useFocusEffect(
    useCallback(() => {
      if (mode === 'my_products') {
        loadMyProducts();
      } else {
        loadMarketplace(true);
      }
    }, [mode, loadMyProducts])
  );

  // Reload marketplace when category or search changes
  React.useEffect(() => {
    if (mode === 'marketplace') {
      const timer = setTimeout(() => {
        loadMarketplace(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [search, category]);

  const filteredMyProducts = myProducts.filter((p) => {
    const status = p.status?.toUpperCase();
    if (filter === 'All') return true;
    if (filter === 'Live') return status === 'PUBLISHED';
    if (filter === 'Draft') return status === 'DRAFT';
    if (filter === 'Out of Stock') return status === 'OUT_OF_STOCK';
    return true;
  });

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
    quantity: p.inventory?.available_quantity || 0,
    status: p.status?.toUpperCase() === 'PUBLISHED' ? 'live' : 
            p.status?.toUpperCase() === 'DRAFT' ? 'draft' : 
            p.status?.toUpperCase() === 'OUT_OF_STOCK' ? 'out_of_stock' : 'draft',
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

  // UI rendering pieces
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tabButton, mode === 'my_products' && styles.tabButtonActive]}
        onPress={() => setMode('my_products')}
      >
        <Text style={[styles.tabText, mode === 'my_products' && styles.tabTextActive]}>My Products</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabButton, mode === 'marketplace' && styles.tabButtonActive]}
        onPress={() => setMode('marketplace')}
      >
        <Text style={[styles.tabText, mode === 'marketplace' && styles.tabTextActive]}>Marketplace</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMyProducts = () => {
    return (
      <>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </View>

        {myLoading && filteredMyProducts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : myError ? (
          <EmptyState
            icon="warning-outline"
            title="Unable to load products"
            message="Please check your connection and try again."
            actionLabel="Retry"
            onAction={loadMyProducts}
          />
        ) : filteredMyProducts.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="You haven't added any products yet."
            message=""
            actionLabel="+ Add Product"
            onAction={() => navigation.getParent()?.navigate('Home', { screen: 'AddProduct', params: { screen: 'Camera' } })}
          />
        ) : (
          <FlatList
            data={filteredMyProducts.map(mapToProduct)}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <ProductCard product={item} onPress={(p) => navigation.navigate('ProductDetail', { productId: p.id })} />
              </View>
            )}
          />
        )}
      </>
    );
  };

  const renderMarketplace = () => {
    return (
      <>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        
        <View style={{ height: 50, marginBottom: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                selected={category === cat}
                onPress={() => setCategory(cat)}
              />
            ))}
          </ScrollView>
        </View>

        {marketLoading && marketProducts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : marketError ? (
          <EmptyState
            icon="warning-outline"
            title="Unable to load products"
            message="Please check your connection and try again."
            actionLabel="Retry"
            onAction={() => loadMarketplace(true)}
          />
        ) : marketProducts.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No products found."
            message="Try adjusting your search or category."
          />
        ) : (
          <FlatList
            data={marketProducts.map(mapToProduct)}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            onEndReached={() => loadMarketplace(false)}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              marketLoading ? (
                <View style={{ padding: 20 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              return (
                <View style={styles.cardWrapper}>
                  <MarketplaceCard 
                    product={item} 
                    sellerName={(item as any).artisan?.business_name || (item as any).artisan?.name}
                    outOfStock={item.status?.toUpperCase() === 'OUT_OF_STOCK' || item.quantity === 0}
                    onPress={(p) => {
                      navigation.navigate('BuyerProduct' as any, { productId: p.id });
                    }} 
                  />
                </View>
              );
            }}
          />
        )}
      </>
    );
  };

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <Header
        title={mode === 'my_products' ? "My Products" : "Marketplace"}
        rightText={mode === 'my_products' ? "+ Add" : undefined}
        onRightPress={mode === 'my_products' ? () => navigation.getParent()?.navigate('Home', { screen: 'AddProduct', params: { screen: 'Camera' } }) : undefined}
        onCartPress={mode === 'marketplace' ? () => navigation.navigate('Cart') : undefined}
        cartCount={mode === 'marketplace' ? cartCount : 0}
      />
      
      {renderTabs()}

      {mode === 'my_products' ? renderMyProducts() : renderMarketplace()}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: layout.screenPadding,
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: layout.screenPadding,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  categoryScroll: {
    paddingHorizontal: layout.screenPadding,
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: layout.screenPadding,
    paddingVertical: 12,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { paddingHorizontal: layout.screenPadding - 4, paddingBottom: 100 },
  cardWrapper: { flex: 1, padding: 4 },
});
