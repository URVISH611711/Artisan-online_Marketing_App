import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProductsStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { fetchProduct, ProductData } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<ProductsStackParamList, 'ProductDetail'>;
  route: RouteProp<ProductsStackParamList, 'ProductDetail'>;
};

export const ProductDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct(route.params.productId)
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [route.params.productId]);

  if (loading) {
    return (
      <ScreenWrapper padded={false}>
        <Header title="Product" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!product) {
    return (
      <ScreenWrapper padded={false}>
        <Header title="Product" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Product not found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const statusKey = product.status === 'PUBLISHED' ? 'live' : product.status === 'DRAFT' ? 'draft' : product.status === 'OUT_OF_STOCK' ? 'out_of_stock' : 'draft';
  const statusVariant = {
    live: 'success' as const,
    draft: 'warning' as const,
    out_of_stock: 'error' as const,
    archived: 'default' as const,
  }[statusKey];

  return (
    <ScreenWrapper padded={false}>
      <Header title={product.name} onBack={() => navigation.goBack()} rightIcon="pencil-outline" onRightPress={() => navigation.navigate('EditProduct', { productId: product.id })} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Image */}
        <Image source={{ uri: product.images?.[0]?.url || 'https://via.placeholder.com/400' }} style={styles.image} resizeMode="cover" />

        <View style={styles.content}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.price}>₹{product.price.toLocaleString('en-IN')}</Text>
            </View>
            <Badge label={statusKey === 'live' ? 'Live' : statusKey === 'draft' ? 'Draft' : 'Out of Stock'} variant={statusVariant} />
          </View>

          {/* Stats */}
          <Card style={styles.statsCard} padding="md">
            <View style={styles.statsRow}>
              {[
                { label: 'Views', value: product.views || 0 },
                { label: 'Orders', value: product.orders || 0 },
                { label: 'Stock', value: 0 },
              ].map(({ label, value }) => (
                <View key={label} style={styles.stat}>
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Details */}
          <Text style={styles.sectionTitle}>Product Details</Text>
          {[
            { label: 'Material', value: product.material },
            { label: 'Craft Type', value: product.craft_type },
            { label: 'Origin', value: product.origin },
            { label: 'Production Time', value: product.production_time || '—' },
          ].map(({ label, value }) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Keywords */}
          <Text style={styles.sectionTitle}>Keywords</Text>
          <View style={styles.keywordsRow}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>—</Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.footer}>
        {statusKey === 'draft' && (
          <Button title="Publish Product" onPress={() => {}} icon="arrow-up-circle-outline" iconPosition="right" />
        )}
        {statusKey === 'live' && (
          <Button title="Boost Product" onPress={() => {}} icon="trending-up-outline" iconPosition="right" />
        )}
        <Button title="Edit Product" onPress={() => navigation.navigate('EditProduct', { productId: product.id })} variant="outline" style={{ marginTop: 10 }} />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  image: { width: '100%', height: 280, backgroundColor: colors.borderLight },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  titleLeft: { flex: 1, marginRight: 12 },
  productName: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  price: { fontSize: 22, fontWeight: '800', color: colors.primary },
  statsCard: { marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  statLabel: { fontSize: 13, color: colors.textSecondary },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 10, marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  detailLabel: { fontSize: 14, color: colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 16 },
  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  keyword: { backgroundColor: '#EBF5FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  keywordText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 28, paddingTop: 8, backgroundColor: colors.background },
});
