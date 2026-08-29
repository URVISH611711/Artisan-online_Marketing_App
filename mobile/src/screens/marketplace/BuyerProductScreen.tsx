import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { fetchProduct, ProductData } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export const BuyerProductScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct(route.params.productId)
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [route.params.productId]);

  if (loading || !product) {
    return (
      <ScreenWrapper padded={false}>
        <Header onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {loading ? <ActivityIndicator size="large" color={colors.primary} /> : <Text style={{ color: colors.textSecondary }}>Product not found</Text>}
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper padded={false}>
      <Header onBack={() => navigation.goBack()} rightIcon="heart-outline" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image source={{ uri: product.images?.[0]?.url || 'https://via.placeholder.com/400' }} style={styles.image} resizeMode="cover" />
        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>₹{product.price.toLocaleString('en-IN')}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.location}>{product.origin}</Text>
            {product.rating && <>
              <Text style={styles.dot}>·</Text>
              <Ionicons name="star" size={12} color={colors.warning} />
              <Text style={styles.rating}>{product.rating}</Text>
            </>}
          </View>
          <Text style={styles.description}>{product.description}</Text>

          <Card variant="ai" padding="md" style={styles.bulkCard}>
            <Text style={styles.bulkTitle}>✅ Available for bulk orders</Text>
            <Text style={styles.bulkSub}>Minimum order: 10 units · Production: {product.production_time || '10 days'}</Text>
          </Card>

          <TouchableOpacity style={styles.artisanCard} onPress={() => navigation.navigate('ArtisanProfile', { artisanId: product.artisan_id })}>
            <View style={styles.artisanAvatar}>
              <Ionicons name="person" size={18} color={colors.textSecondary} />
            </View>
            <View>
              <Text style={styles.artisanName}>View Artisan</Text>
              <Text style={styles.artisanLocation}>{product.origin}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Contact Artisan" onPress={() => {}} icon="chatbubble-outline" />
        <Button title="Request Bulk Quote" onPress={() => {}} variant="outline" style={{ marginTop: 10 }} />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  image: { width: '100%', height: 300, backgroundColor: colors.borderLight },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: 16 },
  name: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  price: { fontSize: 24, fontWeight: '800', color: colors.primary, marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  location: { fontSize: 13, color: colors.textSecondary },
  dot: { color: colors.textTertiary },
  rating: { fontSize: 13, color: colors.textSecondary },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 16 },
  bulkCard: { marginBottom: 16 },
  bulkTitle: { fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  bulkSub: { fontSize: 13, color: colors.textSecondary },
  artisanCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  artisanAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  artisanName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  artisanLocation: { fontSize: 12, color: colors.textSecondary },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 28, paddingTop: 8, backgroundColor: colors.background },
});
