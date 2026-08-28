import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AddProductStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useDraftStore } from '../../store/useDraftStore';
import { Ionicons } from '@expo/vector-icons';

type Props = { navigation: NativeStackNavigationProp<AddProductStackParamList, 'Pricing'> };

const MATERIAL_COST = 650;
const LABOUR_COST = 700;
const PACKAGING_COST = 80;
const TOTAL_COST = MATERIAL_COST + LABOUR_COST + PACKAGING_COST;
const MARKET_LOW = 2200;
const MARKET_HIGH = 2800;
const RECOMMENDED = 2499;

export const PricingScreen: React.FC<Props> = ({ navigation }) => {
  const [price, setPrice] = useState(RECOMMENDED);
  const { updateDraft } = useDraftStore();

  const profit = price - TOTAL_COST;
  const profitColor = profit > 0 ? colors.success : colors.error;

  const handleUsePrice = () => {
    updateDraft({ price, recommendedPrice: RECOMMENDED, materialCost: MATERIAL_COST, labourCost: LABOUR_COST, packagingCost: PACKAGING_COST, step: 'review' });
    navigation.navigate('Review');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Price</Text>
        <Ionicons name="sparkles-outline" size={24} color={colors.primary} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Recommended price hero */}
        <Card padding="lg" style={styles.heroCard}>
          <Text style={styles.heroLabel}>RECOMMENDED SELLING PRICE</Text>
          <Text style={styles.heroPrice}>₹{price.toLocaleString('en-IN')}</Text>
          <View style={styles.aiRecommendedBadge}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={styles.aiRecommendedText}>AI Recommended</Text>
          </View>
        </Card>

        {/* Slider card */}
        <Card padding="md" style={styles.sliderCard}>
          <View style={styles.sliderRangeRow}>
            <View>
              <Text style={styles.rangeLabel}>Market Low</Text>
              <Text style={styles.rangeValue}>₹{MARKET_LOW.toLocaleString('en-IN')}</Text>
            </View>
            <Text style={styles.currentPrice}>₹{price.toLocaleString('en-IN')}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.rangeLabel}>Market High</Text>
              <Text style={styles.rangeValue}>₹{MARKET_HIGH.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={MARKET_LOW}
            maximumValue={MARKET_HIGH}
            value={price}
            onValueChange={(v) => setPrice(Math.round(v))}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <Text style={styles.sliderHint}>Priced right in the sweet spot for optimal sales velocity.</Text>
        </Card>

        {/* Cost breakdown */}
        <Card padding="md" style={styles.costCard}>
          <Text style={styles.costTitle}>Cost Breakdown</Text>
          <View style={styles.costRow}>
            <View style={[styles.costDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.costLabel}>Material</Text>
            <Text style={styles.costValue}>₹{MATERIAL_COST.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.costRow}>
            <View style={[styles.costDot, { backgroundColor: colors.secondary }]} />
            <Text style={styles.costLabel}>Labour</Text>
            <Text style={styles.costValue}>₹{LABOUR_COST.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.costRow}>
            <View style={[styles.costDot, { backgroundColor: '#A78BFA' }]} />
            <Text style={styles.costLabel}>Packaging</Text>
            <Text style={styles.costValue}>₹{PACKAGING_COST.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.costRow}>
            <Text style={styles.totalLabel}>Total Cost</Text>
            <Text style={styles.totalValue}>₹{TOTAL_COST.toLocaleString('en-IN')}</Text>
          </View>
        </Card>

        {/* Profit */}
        <Card variant={profit > 0 ? 'success' : undefined} padding="md" style={styles.profitCard}>
          <Text style={styles.profitLabel}>Estimated Profit</Text>
          <Text style={[styles.profitValue, { color: profitColor }]}>₹{profit.toLocaleString('en-IN')}</Text>
          <Text style={styles.profitSub}>per unit</Text>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button title={`Use ₹${price.toLocaleString('en-IN')}`} onPress={handleUsePrice} />
        <Button title="Edit Price manually" onPress={() => {}} variant="outline" style={{ marginTop: 10 }} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.primary },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 20 },
  heroCard: { alignItems: 'center', marginBottom: 16, backgroundColor: '#F0F6FF' },
  heroLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  heroPrice: { fontSize: 48, fontWeight: '800', color: colors.primary, marginBottom: 10 },
  aiRecommendedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DBEAFE', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  aiRecommendedText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  sliderCard: { marginBottom: 16 },
  sliderRangeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rangeLabel: { fontSize: 12, color: colors.textSecondary },
  rangeValue: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  currentPrice: { fontSize: 16, fontWeight: '800', color: colors.primary },
  slider: { width: '100%', height: 40 },
  sliderHint: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  costCard: { marginBottom: 16 },
  costTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 14 },
  costRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  costDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  costLabel: { flex: 1, fontSize: 14, color: colors.textSecondary },
  costValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  totalLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  totalValue: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  profitCard: { marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profitLabel: { fontSize: 16, fontWeight: '600', color: colors.success },
  profitValue: { fontSize: 28, fontWeight: '800' },
  profitSub: { fontSize: 12, color: colors.textSecondary },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 28 },
});
