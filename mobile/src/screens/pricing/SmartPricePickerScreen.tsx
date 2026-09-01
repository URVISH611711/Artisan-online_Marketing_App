/**
 * SmartPricePickerScreen — Select a product to analyze with AI pricing.
 * Shown when the seller taps "Smart Pricing" on the Home screen.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { rs, rf, rp } from '../../theme/responsive';
import { fetchProducts, ProductData } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'SmartPricePicker'>;
};

export const SmartPricePickerScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchProducts();
          if (!cancelled) setProducts(data);
        } catch (err: any) {
          if (!cancelled) setError(err.message || 'Failed to load products');
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      load();
      return () => { cancelled = true; };
    }, [])
  );

  const handleSelect = (product: ProductData) => {
    navigation.navigate('SmartPriceAnalysis', { productId: product.id });
  };

  const renderProduct = ({ item }: { item: ProductData }) => {
    const imageUrl = item.images?.[0]?.url;
    return (
      <TouchableOpacity
        style={[styles.productCard, shadows.card]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.85}
        accessibilityLabel={`Analyze pricing for ${item.name}`}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={rs(28)} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productMaterial} numberOfLines={1}>
            {item.material} · {item.craft_type}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>₹{item.price?.toLocaleString('en-IN')}</Text>
            <Text style={styles.currentPriceLabel}>current</Text>
          </View>
        </View>
        <View style={styles.analyzeButton}>
          <Ionicons name="sparkles" size={rs(16)} color={colors.textOnPrimary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={rs(22)} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="analytics-outline" size={rs(20)} color={colors.secondary} />
          <Text style={styles.headerTitle}>Smart Pricing</Text>
        </View>
        <View style={{ width: rs(36) }} />
      </View>

      <Text style={styles.subtitle}>
        Select a product to get AI-powered pricing analysis
      </Text>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your products...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={rs(40)} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setLoading(true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cube-outline" size={rs(48)} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No products yet</Text>
          <Text style={styles.emptyText}>
            Add your first product to use Smart Pricing
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + rs(20) },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: rs(10) }} />}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rp(),
    paddingBottom: rs(10),
  },
  backButton: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
  },
  headerTitle: {
    fontSize: rf(17),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: rf(13),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: rs(4),
    marginBottom: rs(16),
    paddingHorizontal: rp(),
  },
  listContent: {
    paddingHorizontal: rp(),
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: rs(14),
    padding: rs(10),
    gap: rs(12),
  },
  productImage: {
    width: rs(64),
    height: rs(64),
    borderRadius: rs(10),
    backgroundColor: colors.borderLight,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    gap: rs(2),
  },
  productName: {
    fontSize: rf(14),
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: rf(18),
  },
  productMaterial: {
    fontSize: rf(11),
    color: colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: rs(4),
    marginTop: rs(2),
  },
  currentPrice: {
    fontSize: rf(15),
    fontWeight: '700',
    color: colors.primary,
  },
  currentPriceLabel: {
    fontSize: rf(10),
    color: colors.textTertiary,
  },
  analyzeButton: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rp(),
    gap: rs(10),
  },
  loadingText: {
    fontSize: rf(13),
    color: colors.textSecondary,
    marginTop: rs(8),
  },
  errorText: {
    fontSize: rf(13),
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: rs(20),
    paddingVertical: rs(8),
    borderRadius: rs(8),
    backgroundColor: colors.primary,
    marginTop: rs(8),
  },
  retryText: {
    fontSize: rf(13),
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
  emptyTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: rs(8),
  },
  emptyText: {
    fontSize: rf(13),
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
