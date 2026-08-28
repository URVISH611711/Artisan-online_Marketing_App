import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { MarketplaceCard } from '../../components/product/ProductCard';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { mockProducts } from '../../services/mock/mockData';

export const SearchResultsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [query, setQuery] = useState(route.params?.query || '');
  const results = mockProducts.filter((p) => p.status === 'live' && (
    !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase())
  ));

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
      <Text style={styles.count}>{results.length} products found</Text>
      <FlatList
        data={results}
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
