import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProductsStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Chip } from '../../components/ui/Chip';
import { ProductCard } from '../../components/product/ProductCard';
import { EmptyState } from '../../components/states/StateScreens';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { mockProducts } from '../../services/mock/mockData';
import { Product } from '../../types';
import { Ionicons } from '@expo/vector-icons';

type Props = { navigation: NativeStackNavigationProp<ProductsStackParamList, 'ProductsList'> };

type Filter = 'All' | 'Live' | 'Draft' | 'Out of Stock';
const FILTERS: Filter[] = ['All', 'Live', 'Draft', 'Out of Stock'];

export const ProductsScreen: React.FC<Props> = ({ navigation }) => {
  const [filter, setFilter] = useState<Filter>('All');

  const filtered = mockProducts.filter((p) => {
    if (filter === 'All') return true;
    if (filter === 'Live') return p.status === 'live';
    if (filter === 'Draft') return p.status === 'draft';
    if (filter === 'Out of Stock') return p.status === 'out_of_stock';
    return true;
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

      {filtered.length === 0 ? (
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
          data={filtered}
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
  grid: { paddingHorizontal: layout.screenPadding - 4, paddingBottom: 100 },
  cardWrapper: { flex: 1 },
});
