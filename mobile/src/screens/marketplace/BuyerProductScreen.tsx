import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { fetchProduct, ProductData } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { getImageSource } from '../../utils/image';
import { useCart } from '../../context/CartContext';
import { useFocusEffect } from '@react-navigation/native';

export const BuyerProductScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { addToCart, cartCount } = useCart();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setLoading(true);
      fetchProduct(route.params.productId)
        .then(data => { if (isActive) setProduct(data); })
        .catch(console.error)
        .finally(() => { if (isActive) setLoading(false); });
      return () => { isActive = false; };
    }, [route.params.productId])
  );

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, 1);
    Alert.alert("Success", "Added to cart!", [
      { text: "Continue Shopping", style: "cancel" },
      { text: "View Cart", onPress: () => navigation.navigate("Cart") }
    ]);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, 1);
    navigation.navigate("Checkout");
  };

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

  const primaryImageUrl = product.images?.find((img: any) => img.is_enhanced || img.isEnhanced)?.url || product.images?.[0]?.url || 'https://via.placeholder.com/400';
  const activeImage = selectedImage || primaryImageUrl;

  const stock = product.inventory?.available_quantity || 0;
  const isOutOfStock = stock <= 0;
  const artisanName = product.artisan?.business_name || 'Artisan';
  const artisanLocation = product.artisan?.city && product.artisan?.state 
    ? `${product.artisan.city}, ${product.artisan.state}` 
    : product.artisan?.location || product.origin;
  const artisanImage = product.artisan?.profile_image;

  return (
    <ScreenWrapper padded={false}>
      <Header 
        onBack={() => navigation.goBack()} 
        rightIcon="heart-outline" 
        onCartPress={() => navigation.navigate('Cart')}
        cartCount={cartCount}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image source={getImageSource(activeImage)} style={styles.image} resizeMode="cover" />

        {product.images && product.images.length > 1 && (
          <View style={styles.thumbContainer}>
            {product.images.map((img: any, idx: number) => (
              <TouchableOpacity key={idx} onPress={() => setSelectedImage(img.url)} style={[styles.thumbBtn, activeImage === img.url && styles.thumbBtnActive]}>
                <Image source={getImageSource(img.url)} style={styles.thumbImage} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>₹{product.price.toLocaleString('en-IN')}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.location}>{product.origin}</Text>
            {product.rating ? <>
              <Text style={styles.dot}>•</Text>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.rating}>{product.rating.toFixed(1)}</Text>
            </> : null}
            <Text style={styles.dot}>•</Text>
            <Text style={[styles.stock, isOutOfStock && styles.outOfStock]}>
              {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
            </Text>
          </View>
          <Text style={styles.description}>{product.description}</Text>

          {/* We remove bulk order for now to focus on Direct Buy */}

          <TouchableOpacity style={styles.artisanCard} onPress={() => {}}>
            <View style={styles.artisanAvatar}>
              {artisanImage ? (
                <Image source={{ uri: artisanImage }} style={styles.artisanAvatarImage} />
              ) : (
                <Ionicons name="person" size={18} color={colors.textSecondary} />
              )}
            </View>
            <View>
              <Text style={styles.artisanName}>{artisanName}</Text>
              <Text style={styles.artisanLocation}>{artisanLocation}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button 
            title="Add to Cart" 
            onPress={handleAddToCart} 
            disabled={isOutOfStock}
            variant="outline"
            style={{ flex: 1 }}
          />
          <Button 
            title={isOutOfStock ? "Out of Stock" : "Buy Now"} 
            onPress={handleBuyNow} 
            disabled={isOutOfStock}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  image: { width: '100%', height: 300, backgroundColor: colors.borderLight },
  thumbContainer: { flexDirection: 'row', gap: 10, paddingHorizontal: layout.screenPadding, paddingTop: 12 },
  thumbBtn: { width: 56, height: 56, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: colors.border },
  thumbBtnActive: { borderColor: colors.primary },
  thumbImage: { width: '100%', height: '100%' },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: 16 },
  name: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  price: { fontSize: 24, fontWeight: '800', color: colors.primary, marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  location: { fontSize: 13, color: colors.textSecondary },
  dot: { color: colors.textTertiary },
  rating: { fontSize: 13, color: colors.textSecondary },
  stock: { fontSize: 13, color: colors.success, fontWeight: '600' },
  outOfStock: { color: colors.error },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 16 },
  artisanCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  artisanAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  artisanAvatarImage: { width: '100%', height: '100%' },
  artisanName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  artisanLocation: { fontSize: 12, color: colors.textSecondary },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 28, paddingTop: 8, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
});
