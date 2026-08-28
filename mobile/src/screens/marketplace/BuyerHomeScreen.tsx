import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { MarketplaceCard } from '../../components/product/ProductCard';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { mockProducts, mockCategories } from '../../services/mock/mockData';
import { Product } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export const BuyerHomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const liveProducts = mockProducts.filter((p) => p.status === 'live');

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
          placeholder="Search crafts, artisans..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          onFocus={() => navigation.navigate('SearchResults', { query: search })}
        />
        <TouchableOpacity style={styles.micBtn}>
          <Ionicons name="mic-outline" size={18} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
        </View>
        <View style={styles.categoriesGrid}>
          {mockCategories.map((cat) => (
            <TouchableOpacity key={cat.id} style={[styles.categoryCard, { backgroundColor: cat.color }]}>
              <Ionicons name={cat.icon as any} size={28} color={colors.primary} />
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Featured artisans */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Artisans</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.artisansRow}>
          {[
            { name: 'Ramesh Handicrafts', location: 'Gujarat', rating: 4.8, products: 12 },
            { name: 'Priya Crafts', location: 'Rajasthan', rating: 4.9, products: 8 },
          ].map((artisan) => (
            <TouchableOpacity key={artisan.name} style={styles.artisanCard} onPress={() => navigation.navigate('ArtisanProfile', { artisanId: 'artisan_001' })}>
              <View style={styles.artisanAvatar}>
                <Ionicons name="person" size={20} color={colors.textSecondary} />
              </View>
              <View>
                <Text style={styles.artisanName}>{artisan.name}</Text>
                <View style={styles.artisanMeta}>
                  <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                  <Text style={styles.artisanLocation}>{artisan.location}</Text>
                </View>
                <Text style={styles.artisanRating}>⭐ {artisan.rating} · {artisan.products} products</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Trending products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Products</Text>
        </View>
        <View style={styles.productsGrid}>
          {liveProducts.map((product) => (
            <MarketplaceCard
              key={product.id}
              product={product}
              artisanLocation={product.origin}
              onPress={(p) => navigation.navigate('BuyerProduct', { productId: p.id })}
            />
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.screenPadding, paddingVertical: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 18, fontWeight: '800', color: colors.primary },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14,
    marginHorizontal: layout.screenPadding, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  micBtn: { padding: 4 },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 80 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  viewAll: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  categoryCard: { width: '30%', aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 6 },
  categoryName: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  artisansRow: { paddingBottom: 20, gap: 12 },
  artisanCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 12, padding: 12, minWidth: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  artisanAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  artisanName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  artisanMeta: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  artisanLocation: { fontSize: 12, color: colors.textSecondary },
  artisanRating: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
});
