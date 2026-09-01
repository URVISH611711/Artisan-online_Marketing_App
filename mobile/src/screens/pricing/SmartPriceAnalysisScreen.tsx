/**
 * SmartPriceAnalysisScreen — AI-powered pricing for a single product.
 *
 * Flow:
 *  Phase 1 — Preview:  Show product image, name, current price + "Get Smart Price" button.
 *  Phase 2 — Loading:  Animated state while Kimi analyzes the product.
 *  Phase 3 — Results:  Three price cards (Competitive, Recommended ⭐, Premium).
 *  Phase 4 — Confirm:  Alert asking the seller to confirm the selected price.
 *  Phase 5 — Saving:   Update Supabase, show success, navigate back.
 *
 * Data integrity: every request is tagged with the current productId.
 * When the response arrives we verify the tag still matches before
 * displaying results (prevents stale state from overlapping requests).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { rs, rf, rp } from '../../theme/responsive';
import { analyzeSmartPrice, SmartPriceResponse, SmartPriceItem } from '../../services/pricingApi';
import { fetchProduct, updateProduct, ProductData } from '../../services/api';

// Navigation type — compatible with both HomeStack and ProductsStack
type Props = {
  navigation: NativeStackNavigationProp<any, any>;
  route: RouteProp<{ SmartPriceAnalysis: { productId: string } }, 'SmartPriceAnalysis'>;
};

// ─── Loading messages ─────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  { icon: 'eye-outline' as const,           text: 'Analyzing your product...' },
  { icon: 'brush-outline' as const,         text: 'Evaluating craftsmanship...' },
  { icon: 'trending-up-outline' as const,   text: 'Estimating product value...' },
  { icon: 'pricetag-outline' as const,      text: 'Preparing smart prices...' },
];

// ─── Screen phases ────────────────────────────────────────────────────────────

type Phase = 'preview' | 'loading' | 'results' | 'saving';

// ─────────────────────────────────────────────────────────────────────────────

export const SmartPriceAnalysisScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const insets = useSafeAreaInsets();

  // Product data
  const [product, setProduct] = useState<ProductData | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // AI result
  const [aiResponse, setAiResponse] = useState<SmartPriceResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Screen phase
  const [phase, setPhase] = useState<Phase>('preview');
  const [loadingStep, setLoadingStep] = useState(0);

  // Animated pulse for loading icon
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  // Request tagging — prevents stale responses from a previous product
  const activeRequestRef = useRef<string | null>(null);

  // ── Load product from Supabase ──────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        setProductLoading(true);
        setProductError(null);
        try {
          const data = await fetchProduct(productId);
          if (!cancelled) setProduct(data);
        } catch (err: any) {
          if (!cancelled) setProductError(err.message || 'Failed to load product');
        } finally {
          if (!cancelled) setProductLoading(false);
        }
      };
      load();
      return () => { cancelled = true; };
    }, [productId])
  );

  // ── Pulse animation during loading ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'loading') return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [phase]);

  // ── Cycle loading messages ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'loading') return;
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [phase]);

  // ── Trigger AI analysis ─────────────────────────────────────────────────────
  const handleGetSmartPrice = async () => {
    if (!product) return;
    if (!product.images || product.images.length === 0) {
      Alert.alert(
        'Image Required',
        'Product image is required for AI pricing. Please add an image first.'
      );
      return;
    }

    // Tag this request with the current product ID
    const requestTag = productId;
    activeRequestRef.current = requestTag;

    setPhase('loading');
    setLoadingStep(0);
    setAiError(null);
    setAiResponse(null);

    try {
      const response = await analyzeSmartPrice(productId);

      // Verify the response still belongs to this product
      if (activeRequestRef.current !== requestTag) {
        console.log('[SmartPrice] Stale response discarded');
        return;
      }

      setAiResponse(response);
      setPhase('results');
    } catch (err: any) {
      if (activeRequestRef.current !== requestTag) return;
      setAiError(err.message || 'Unable to analyze the product right now. Please try again.');
      setPhase('preview'); // Return to preview so user can retry
    }
  };

  // ── Select a price ──────────────────────────────────────────────────────────
  const handleSelectPrice = (tier: SmartPriceItem) => {
    const formatted = `₹${tier.price.toLocaleString('en-IN')}`;
    Alert.alert(
      'Confirm Price',
      `Use ${formatted} as your selling price?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm Price', onPress: () => applyPrice(tier.price) },
      ]
    );
  };

  // ── Apply & save price ──────────────────────────────────────────────────────
  const applyPrice = async (price: number) => {
    setPhase('saving');
    try {
      await updateProduct(productId, { price });

      Alert.alert(
        'Price Updated ✓',
        `Your selling price has been updated to ₹${price.toLocaleString('en-IN')}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to product detail (works from both HomeStack and ProductsStack)
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update price. Please try again.');
      setPhase('results');
    }
  };

  const formatINR = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  // ── Header (shared) ─────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={rs(22)} color={colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Ionicons name="sparkles" size={rs(18)} color={colors.secondary} />
        <Text style={styles.headerTitle}>Smart Price</Text>
      </View>
      <View style={{ width: rs(36) }} />
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase: Product loading
  // ─────────────────────────────────────────────────────────────────────────────
  if (productLoading) {
    return (
      <View style={styles.screen}>
        {renderHeader()}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingHint}>Loading product...</Text>
        </View>
      </View>
    );
  }

  if (productError || !product) {
    return (
      <View style={styles.screen}>
        {renderHeader()}
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={rs(48)} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to Load Product</Text>
          <Text style={styles.errorMsg}>{productError || 'Product not found.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase: Loading (AI request in progress)
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    const step = LOADING_MESSAGES[loadingStep];
    return (
      <View style={styles.screen}>
        {renderHeader()}
        <View style={styles.centered}>
          <Animated.View style={[styles.loadingCircle, { opacity: pulseAnim }]}>
            <Ionicons name={step.icon as any} size={rs(40)} color={colors.primary} />
          </Animated.View>
          <Text style={styles.loadingTitle}>✨ AI is analyzing your product</Text>
          <Text style={styles.loadingStep}>{step.text}</Text>
          <ActivityIndicator size="small" color={colors.secondary} style={{ marginTop: rs(16) }} />
          <Text style={styles.loadingHint}>
            AI is evaluating product quality,{'\n'}craftsmanship and market positioning...
          </Text>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase: Saving
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === 'saving') {
    return (
      <View style={styles.screen}>
        {renderHeader()}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingStep}>Updating your price...</Text>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Product card (used in both preview and results phases)
  // ─────────────────────────────────────────────────────────────────────────────
  const primaryImage =
    product.images?.find(img => img.is_enhanced)?.url || product.images?.[0]?.url;

  const renderProductCard = () => (
    <View style={[styles.productCard, shadows.card]}>
      {primaryImage ? (
        <Image source={{ uri: primaryImage }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder]}>
          <Ionicons name="image-outline" size={rs(32)} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.currentPriceRow}>
          <Text style={styles.currentPriceLabel}>Current Price</Text>
          <Text style={styles.currentPrice}>{formatINR(product.price)}</Text>
        </View>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase: Preview — show product + "Get Smart Price" button
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === 'preview') {
    return (
      <View style={styles.screen}>
        {renderHeader()}
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + rs(40) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Product preview */}
          {renderProductCard()}

          {/* Error from previous attempt */}
          {aiError && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={rs(16)} color={colors.error} />
              <Text style={styles.errorBannerText}>{aiError}</Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerBadge}>
              <Ionicons name="sparkles" size={rs(14)} color={colors.secondary} />
              <Text style={styles.dividerText}>AI Smart Pricing</Text>
            </View>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.previewSubtitle}>
            Kimi-K3 will analyze your product image and independently estimate the best price range.
            No extra information needed.
          </Text>

          <TouchableOpacity
            style={styles.getSmartPriceBtn}
            onPress={handleGetSmartPrice}
            activeOpacity={0.85}
            accessibilityLabel="Get Smart Price"
          >
            <Ionicons name="sparkles" size={rs(20)} color="#fff" />
            <Text style={styles.getSmartPriceBtnText}>Get Smart Price</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase: Results — show three price cards
  // ─────────────────────────────────────────────────────────────────────────────
  const result = aiResponse?.result;
  if (!result) {
    // Shouldn't happen, but guard against it
    setPhase('preview');
    setAiError('Received empty response. Please try again.');
    return null;
  }

  const { prices, analysis, recommended_reason, warnings } = result;

  return (
    <View style={styles.screen}>
      {renderHeader()}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + rs(40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Product card */}
        {renderProductCard()}

        {/* AI suggested prices header */}
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles" size={rs(16)} color={colors.secondary} />
          <Text style={styles.sectionTitle}>AI Suggested Prices</Text>
        </View>

        {/* Competitive */}
        <PriceCard
          tier={prices.competitive}
          type="competitive"
          onSelect={() => handleSelectPrice(prices.competitive)}
          formatINR={formatINR}
        />

        {/* Recommended ⭐ */}
        <PriceCard
          tier={prices.recommended}
          type="recommended"
          onSelect={() => handleSelectPrice(prices.recommended)}
          formatINR={formatINR}
        />

        {/* Premium */}
        <PriceCard
          tier={prices.premium}
          type="premium"
          onSelect={() => handleSelectPrice(prices.premium)}
          formatINR={formatINR}
        />

        {/* Why Recommended */}
        {!!recommended_reason && (
          <View style={[styles.infoCard, shadows.card]}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="bulb-outline" size={rs(16)} color={colors.warning} />
              <Text style={styles.infoCardTitle}>Why Recommended?</Text>
            </View>
            <Text style={styles.infoCardBody}>{recommended_reason}</Text>
          </View>
        )}

        {/* AI Analysis summary */}
        {analysis && (
          <View style={[styles.infoCard, shadows.card]}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="analytics-outline" size={rs(16)} color={colors.primary} />
              <Text style={styles.infoCardTitle}>AI Analysis</Text>
            </View>
            <AnalysisRow label="Product Type"       value={analysis.product_type} />
            <AnalysisRow label="Material"           value={analysis.apparent_material} />
            <AnalysisRow label="Craftsmanship"      value={analysis.craftsmanship} />
            <AnalysisRow label="Quality"            value={analysis.quality} />
            <AnalysisRow label="Market Position"    value={analysis.estimated_market_position} />
            <AnalysisRow label="Est. Demand"        value={analysis.estimated_demand} />
            {!!analysis.pricing_assessment && (
              <View style={styles.assessmentRow}>
                <Text style={styles.assessmentText}>{analysis.pricing_assessment}</Text>
              </View>
            )}
          </View>
        )}

        {/* Warnings / caveats */}
        {warnings && warnings.length > 0 && (
          <View style={[styles.warningCard, shadows.card]}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="warning-outline" size={rs(16)} color={colors.warning} />
              <Text style={[styles.infoCardTitle, { color: colors.warning }]}>Notes</Text>
            </View>
            {warnings.map((w, i) => (
              <Text key={i} style={styles.warningText}>⚠ {w}</Text>
            ))}
          </View>
        )}

        {/* Retry button */}
        <TouchableOpacity
          style={styles.retryAnalysisBtn}
          onPress={() => { setPhase('preview'); setAiResponse(null); }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={rs(14)} color={colors.textSecondary} />
          <Text style={styles.retryAnalysisBtnText}>Run analysis again</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PriceCardProps {
  tier: SmartPriceItem;
  type: 'competitive' | 'recommended' | 'premium';
  onSelect: () => void;
  formatINR: (v: number) => string;
}

const PriceCard: React.FC<PriceCardProps> = ({ tier, type, onSelect, formatINR }) => {
  const isRec = type === 'recommended';
  const label =
    type === 'competitive' ? 'Budget / Competitive' :
    type === 'recommended' ? '⭐ Recommended' :
    'Premium';

  return (
    <View style={[styles.priceCard, isRec && styles.priceCardRecommended, shadows.card]}>
      {isRec && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedBadgeText}>BEST CHOICE</Text>
        </View>
      )}
      <View style={styles.priceCardTop}>
        <Text style={[styles.priceCardLabel, isRec && styles.priceCardLabelRec]}>{label}</Text>
        <Text style={[styles.priceCardPrice, isRec && styles.priceCardPriceRec]}>
          {formatINR(tier.price)}
        </Text>
      </View>
      {!!tier.reason && (
        <Text style={[styles.priceCardReason, isRec && styles.priceCardReasonRec]} numberOfLines={3}>
          {tier.reason}
        </Text>
      )}
      <TouchableOpacity
        style={[styles.selectBtn, isRec && styles.selectBtnRec]}
        onPress={onSelect}
        activeOpacity={0.8}
        accessibilityLabel={`Select ${label} price ${formatINR(tier.price)}`}
      >
        <Text style={[styles.selectBtnText, isRec && styles.selectBtnTextRec]}>Select Price</Text>
      </TouchableOpacity>
    </View>
  );
};

const AnalysisRow = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <View style={styles.analysisRow}>
      <Text style={styles.analysisLabel}>{label}</Text>
      <Text style={styles.analysisValue}>{value}</Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rp(),
    paddingBottom: rs(10),
    backgroundColor: colors.background,
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

  // Scroll
  scrollContent: {
    paddingHorizontal: rp(),
    paddingTop: rs(8),
    gap: rs(12),
  },

  // Product card
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: rs(16),
    padding: rs(14),
    gap: rs(14),
  },
  productImage: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(12),
    backgroundColor: colors.borderLight,
  },
  productImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    gap: rs(6),
  },
  productName: {
    fontSize: rf(15),
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: rf(20),
  },
  currentPriceRow: {
    gap: rs(2),
  },
  currentPriceLabel: {
    fontSize: rf(11),
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentPrice: {
    fontSize: rf(20),
    fontWeight: '800',
    color: colors.primary,
  },

  // Preview
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginVertical: rs(4),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    backgroundColor: colors.secondary + '15',
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    borderRadius: rs(20),
  },
  dividerText: {
    fontSize: rf(12),
    fontWeight: '600',
    color: colors.secondary,
  },
  previewSubtitle: {
    fontSize: rf(13),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: rf(19),
    paddingHorizontal: rs(8),
  },
  getSmartPriceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: rs(16),
    paddingVertical: rs(16),
    gap: rs(10),
    marginTop: rs(4),
  },
  getSmartPriceBtnText: {
    fontSize: rf(17),
    fontWeight: '700',
    color: '#fff',
  },

  // Error banner (inline)
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.error + '15',
    borderRadius: rs(12),
    padding: rs(12),
    gap: rs(8),
  },
  errorBannerText: {
    flex: 1,
    fontSize: rf(13),
    color: colors.error,
    lineHeight: rf(18),
  },

  // Loading / centered states
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rp(),
    gap: rs(10),
  },
  loadingCircle: {
    width: rs(90),
    height: rs(90),
    borderRadius: rs(45),
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(4),
  },
  loadingTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  loadingStep: {
    fontSize: rf(14),
    fontWeight: '500',
    color: colors.secondary,
    textAlign: 'center',
  },
  loadingHint: {
    fontSize: rf(12),
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: rf(18),
    marginTop: rs(6),
  },

  // Error states (full screen)
  errorTitle: {
    fontSize: rf(17),
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: rs(8),
  },
  errorMsg: {
    fontSize: rf(13),
    color: colors.error,
    textAlign: 'center',
    lineHeight: rf(18),
  },
  retryBtn: {
    paddingHorizontal: rs(28),
    paddingVertical: rs(12),
    borderRadius: rs(12),
    backgroundColor: colors.primary,
    marginTop: rs(8),
  },
  retryBtnText: {
    fontSize: rf(14),
    fontWeight: '600',
    color: '#fff',
  },

  // Results section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginTop: rs(4),
  },
  sectionTitle: {
    fontSize: rf(15),
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Price cards
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: rs(16),
    padding: rs(16),
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: rs(10),
  },
  priceCardRecommended: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: rs(6),
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
  },
  recommendedBadgeText: {
    fontSize: rf(9),
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.8,
  },
  priceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceCardLabel: {
    fontSize: rf(14),
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  priceCardLabelRec: {
    color: colors.primary,
    fontWeight: '700',
  },
  priceCardPrice: {
    fontSize: rf(22),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  priceCardPriceRec: {
    fontSize: rf(26),
    color: colors.primary,
  },
  priceCardReason: {
    fontSize: rf(12),
    color: colors.textSecondary,
    lineHeight: rf(18),
  },
  priceCardReasonRec: {
    color: colors.textPrimary + 'CC',
  },
  selectBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: rs(10),
    paddingVertical: rs(10),
    alignItems: 'center',
  },
  selectBtnRec: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectBtnText: {
    fontSize: rf(13),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  selectBtnTextRec: {
    color: '#fff',
  },

  // Info / analysis cards
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: rs(14),
    padding: rs(14),
    gap: rs(8),
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginBottom: rs(4),
  },
  infoCardTitle: {
    fontSize: rf(13),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoCardBody: {
    fontSize: rf(13),
    color: colors.textSecondary,
    lineHeight: rf(19),
  },

  // Analysis rows
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rs(5),
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  analysisLabel: {
    fontSize: rf(12),
    color: colors.textSecondary,
  },
  analysisValue: {
    fontSize: rf(12),
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: rs(8),
  },
  assessmentRow: {
    marginTop: rs(6),
    paddingTop: rs(6),
  },
  assessmentText: {
    fontSize: rf(12),
    color: colors.textSecondary,
    lineHeight: rf(18),
    fontStyle: 'italic',
  },

  // Warnings
  warningCard: {
    backgroundColor: colors.warning + '12',
    borderRadius: rs(14),
    padding: rs(14),
    borderWidth: 1,
    borderColor: colors.warning + '30',
    gap: rs(6),
  },
  warningText: {
    fontSize: rf(12),
    color: colors.textSecondary,
    lineHeight: rf(18),
  },

  // Retry analysis
  retryAnalysisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    paddingVertical: rs(8),
    marginTop: rs(4),
  },
  retryAnalysisBtnText: {
    fontSize: rf(13),
    color: colors.textSecondary,
  },
});
