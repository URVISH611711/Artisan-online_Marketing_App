import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { layout, shadows } from '../../theme/spacing';
import { Badge } from '../ui/Badge';
import { Product } from '../../types';
import { getImageSource } from '../../utils/image';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  variant?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  variant = 'grid',
}) => {
  const statusVariant = {
    live: 'success' as const,
    draft: 'warning' as const,
    out_of_stock: 'error' as const,
    archived: 'default' as const,
  }[product.status];

  const statusLabel = {
    live: 'Live',
    draft: 'Draft',
    out_of_stock: 'Out of Stock',
    archived: 'Archived',
  }[product.status];

  const primaryImageUrl = product.images?.find(img => img.isEnhanced)?.url || product.images?.[0]?.url;

  if (variant === 'list') {
    return (
      <TouchableOpacity
        style={[listStyles.container, shadows.card]}
        onPress={() => onPress(product)}
        activeOpacity={0.7}
      >
        <Image
          source={getImageSource(primaryImageUrl)}
          style={listStyles.image}
          resizeMode="cover"
        />
        <View style={listStyles.info}>
          <Text style={listStyles.name} numberOfLines={1}>{product.name}</Text>
          <Text style={listStyles.price}>₹{product.price.toLocaleString('en-IN')}</Text>
          <Badge label={statusLabel} variant={statusVariant} size="sm" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[gridStyles.container, shadows.card]}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      {primaryImageUrl ? (
        <Image
          source={getImageSource(primaryImageUrl)}
          style={gridStyles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[gridStyles.image, gridStyles.placeholder]}>
          <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
        </View>
      )}
      <View style={gridStyles.info}>
        <Text style={gridStyles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={gridStyles.price}>₹{product.price.toLocaleString('en-IN')}</Text>
        <View style={gridStyles.bottomRow}>
          <Badge label={statusLabel} variant={statusVariant} size="sm" />
        </View>
        <Text style={gridStyles.meta}>
          Stock: {product.quantity}{product.views > 0 ? ` • ${product.views} views` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Marketplace product card (buyer view)
interface MarketplaceCardProps {
  product: Product;
  artisanLocation?: string;
  sellerName?: string;
  outOfStock?: boolean;
  onPress: (product: Product) => void;
  onFavorite?: (product: Product) => void;
}

export const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  product,
  artisanLocation,
  sellerName,
  outOfStock,
  onPress,
  onFavorite,
}) => {
  const primaryImageUrl = product.images?.find(img => img.isEnhanced)?.url || product.images?.[0]?.url;

  return (
    <TouchableOpacity
      style={[marketStyles.container, shadows.card]}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <View style={marketStyles.imageContainer}>
        {primaryImageUrl ? (
          <Image
            source={getImageSource(primaryImageUrl)}
            style={marketStyles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[marketStyles.image, gridStyles.placeholder]}>
            <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
          </View>
        )}
        {outOfStock && (
          <View style={marketStyles.oosOverlay}>
            <Text style={marketStyles.oosText}>Out of Stock</Text>
          </View>
        )}
        {onFavorite && (
          <TouchableOpacity
            style={marketStyles.heartButton}
            onPress={() => onFavorite(product)}
          >
            <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={marketStyles.info}>
        <Text style={marketStyles.name} numberOfLines={1}>{product.name}</Text>
        {sellerName && (
          <View style={marketStyles.sellerRow}>
            <Ionicons name="storefront-outline" size={12} color={colors.textSecondary} />
            <Text style={marketStyles.seller} numberOfLines={1}>{sellerName}</Text>
          </View>
        )}
        {artisanLocation && (
          <View style={marketStyles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={marketStyles.location}>{artisanLocation}</Text>
          </View>
        )}
        <Text style={[marketStyles.price, outOfStock && marketStyles.priceMuted]}>₹{product.price.toLocaleString('en-IN')}</Text>
      </View>
    </TouchableOpacity>
  );
};

const gridStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.md,
    overflow: 'hidden',
    flex: 1,
    margin: 4,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.borderLight,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
});

const listStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.md,
    padding: 12,
    marginBottom: 8,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
});

const marketStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.md,
    overflow: 'hidden',
    flex: 1,
    margin: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.borderLight,
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  priceMuted: {
    color: colors.textSecondary,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  seller: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 2,
    flex: 1,
  },
  oosOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oosText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.error,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
