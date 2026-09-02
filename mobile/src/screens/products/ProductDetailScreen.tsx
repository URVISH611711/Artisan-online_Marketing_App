import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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
import { fetchProduct, updateProduct, ProductData } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { getImageSource } from '../../utils/image';

type Props = {
  navigation: NativeStackNavigationProp<ProductsStackParamList, 'ProductDetail'>;
  route: RouteProp<ProductsStackParamList, 'ProductDetail'>;
};

export const ProductDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedForPublish, setSelectedForPublish] = useState<string[]>([]);

  useEffect(() => {
    fetchProduct(route.params.productId)
      .then((data) => {
        setProduct(data);
        if (data && data.images) {
          setSelectedForPublish(data.images.map((img: any) => img.id));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [route.params.productId]);

  const toggleImageSelection = (imgId: string) => {
    setSelectedForPublish((prev) => {
      if (prev.includes(imgId)) {
        if (prev.length <= 1) {
          Alert.alert("Notice", "At least one image must be selected for publishing.");
          return prev;
        }
        return prev.filter((id) => id !== imgId);
      } else {
        return [...prev, imgId];
      }
    });
  };

  const handlePublish = async () => {
    if (!product) return;
    try {
      setPublishing(true);
      const updated = await updateProduct(product.id, { 
        status: 'PUBLISHED',
        selected_image_ids: selectedForPublish,
      });
      setProduct(updated);
      Alert.alert("Success", "Your product is now live on the marketplace!");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to publish product");
    } finally {
      setPublishing(false);
    }
  };

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

  const enTranslation = product.translations?.find((t) => t.language_code === 'en');
  const displayDescription = enTranslation?.description || product.description || 'No description provided.';

  const primaryImageUrl = product.images?.find((img: any) => img.is_enhanced || img.isEnhanced)?.url || product.images?.[0]?.url || 'https://via.placeholder.com/400';
  const activeImage = selectedImage || primaryImageUrl;

  const statusKey = product.status?.toUpperCase() === 'PUBLISHED' ? 'live' : 
                    product.status?.toUpperCase() === 'DRAFT' ? 'draft' : 
                    product.status?.toUpperCase() === 'OUT_OF_STOCK' ? 'out_of_stock' : 'draft';
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
        <Image source={getImageSource(activeImage)} style={styles.image} resizeMode="cover" />
        
        {product.images && product.images.length > 1 && (
          <View style={styles.thumbContainer}>
            {product.images.map((img: any, idx: number) => {
              const isSelected = selectedForPublish.includes(img.id);
              return (
                <TouchableOpacity 
                  key={idx} 
                  onPress={() => {
                    setSelectedImage(img.url);
                    if (statusKey === 'draft') toggleImageSelection(img.id);
                  }} 
                  style={[
                    styles.thumbBtn, 
                    activeImage === img.url && styles.thumbBtnActive,
                    statusKey === 'draft' && !isSelected && styles.thumbBtnDim
                  ]}
                >
                  <Image source={getImageSource(img.url)} style={styles.thumbImage} />
                  {statusKey === 'draft' && (
                    <View style={styles.checkBadge}>
                      <Ionicons 
                        name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                        size={18} 
                        color={isSelected ? colors.success : colors.textTertiary} 
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {statusKey === 'draft' && product.images && product.images.length > 1 && (
          <Text style={styles.selectHint}>Tap image thumbnails above to select which photos to keep when publishing.</Text>
        )}

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
                { label: 'Stock', value: product.inventory?.available_quantity ?? 0 },
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
            { label: 'Color', value: product.color },
            { label: 'Origin', value: product.origin },
            { label: 'Dimensions', value: [
                product.length ? `L: ${product.length}${product.dimension_unit || 'cm'}` : null,
                product.width ? `W: ${product.width}${product.dimension_unit || 'cm'}` : null,
                product.diameter ? `Ø: ${product.diameter}${product.dimension_unit || 'cm'}` : null,
              ].filter(Boolean).join(' × ') || null 
            },
            { label: 'Production Time', value: product.production_time || '—' },
          ].map(({ label, value }) => {
            if (!value) return null; // hide if blank
            return (
              <View key={label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            );
          })}

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{displayDescription}</Text>

          {/* Keywords */}
          <Text style={styles.sectionTitle}>Keywords</Text>
          <View style={styles.keywordsRow}>
            {product.keywords && product.keywords.length > 0 ? (
              product.keywords.map((kw, idx) => (
                <View key={idx} style={styles.keyword}>
                  <Text style={styles.keywordText}>{kw}</Text>
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>—</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.footer}>
        {statusKey === 'draft' && (
          <Button 
            title="Publish Product" 
            onPress={handlePublish} 
            icon="arrow-up-circle-outline" 
            iconPosition="right" 
            loading={publishing}
          />
        )}

        {/* Smart Price — AI-powered pricing from product detail */}
        <TouchableOpacity
          style={styles.smartPriceBtn}
          onPress={() => navigation.navigate('SmartPriceAnalysis', { productId: product.id })}
          activeOpacity={0.85}
          accessibilityLabel="Smart Price — get AI pricing suggestions"
        >
          <Ionicons name="sparkles" size={16} color={colors.secondary} />
          <Text style={styles.smartPriceBtnText}>✨ Smart Price</Text>
        </TouchableOpacity>
        <Button title="Edit Product" onPress={() => navigation.navigate('EditProduct', { productId: product.id })} variant="outline" style={{ marginTop: 10 }} />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  image: { width: '100%', height: 280, backgroundColor: colors.borderLight },
  thumbContainer: { flexDirection: 'row', gap: 10, paddingHorizontal: layout.screenPadding, paddingTop: 12 },
  thumbBtn: { width: 56, height: 56, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: colors.border, position: 'relative' },
  thumbBtnActive: { borderColor: colors.primary },
  thumbBtnDim: { opacity: 0.4 },
  thumbImage: { width: '100%', height: '100%' },
  checkBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#fff', borderRadius: 9 },
  selectHint: { fontSize: 12, color: colors.textSecondary, paddingHorizontal: layout.screenPadding, paddingTop: 6, fontStyle: 'italic' },
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
  smartPriceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 10,
    backgroundColor: colors.secondary + '10',
  },
  smartPriceBtnText: { fontSize: 14, fontWeight: '700', color: colors.secondary },
});
