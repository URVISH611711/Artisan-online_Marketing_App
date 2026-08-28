import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { MarketplaceCard } from '../../components/product/ProductCard';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { mockProducts, mockArtisan } from '../../services/mock/mockData';
import { Ionicons } from '@expo/vector-icons';

export const ArtisanProfileScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const liveProducts = mockProducts.filter((p) => p.status === 'live');

  return (
    <ScreenWrapper padded={false}>
      <Header onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={48} color="#fff" />
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.shopName}>{mockArtisan.businessName}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.location}>{mockArtisan.location}</Text>
            {mockArtisan.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.craftType}>{mockArtisan.craftType} · {mockArtisan.yearsExperience} years experience</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { value: mockArtisan.productsCount, label: 'Products' },
              { value: mockArtisan.ordersCount, label: 'Orders' },
              { value: `${mockArtisan.rating}★`, label: 'Rating' },
            ].map(({ value, label }) => (
              <View key={label} style={styles.stat}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.story}>{mockArtisan.craftStory || mockArtisan.bio}</Text>
        </View>

        {/* Products */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Products</Text>
          <View style={styles.productsGrid}>
            {liveProducts.map((product) => (
              <MarketplaceCard
                key={product.id}
                product={product}
                onPress={(p) => navigation.navigate('BuyerProduct', { productId: p.id })}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 80 },
  banner: { height: 140, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 0 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', marginBottom: -40 },
  profileInfo: { paddingHorizontal: layout.screenPadding, paddingTop: 48, alignItems: 'center' },
  shopName: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  location: { fontSize: 13, color: colors.textSecondary },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.successLight, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  verifiedText: { fontSize: 11, color: colors.success, fontWeight: '600' },
  craftType: { fontSize: 13, color: colors.textSecondary, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 16 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  story: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
  productsSection: { paddingHorizontal: layout.screenPadding, paddingTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
});
