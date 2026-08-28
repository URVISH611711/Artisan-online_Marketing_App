import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OrdersStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { mockBulkOrders } from '../../services/mock/mockData';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<OrdersStackParamList, 'BulkOrder'>;
  route: RouteProp<OrdersStackParamList, 'BulkOrder'>;
};

export const BulkOrderScreen: React.FC<Props> = ({ navigation, route }) => {
  const bulkOrder = mockBulkOrders.find((b) => b.id === route.params.bulkOrderId) || mockBulkOrders[0];

  return (
    <ScreenWrapper padded={false}>
      <Header title="Bulk Order Request" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Buyer info */}
        <Card padding="md" style={styles.card}>
          <View style={styles.buyerHeader}>
            <View style={styles.buyerAvatar}>
              <Ionicons name="business" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.buyerName}>{bulkOrder.buyerCompany}</Text>
              <Text style={styles.buyerSub}>{bulkOrder.buyerLocation}</Text>
            </View>
            {bulkOrder.buyerVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <View style={styles.buyerStats}>
            <Text style={styles.statText}>{bulkOrder.buyerOrdersCompleted} orders completed</Text>
          </View>
        </Card>

        {/* Order details */}
        <Card padding="md" style={styles.card}>
          <Text style={styles.cardTitle}>Order Details</Text>
          <Text style={styles.productName}>{bulkOrder.productName}</Text>
          {[
            { label: 'Quantity', value: `${bulkOrder.quantity} units` },
            { label: 'Price per unit', value: `₹${bulkOrder.pricePerUnit.toLocaleString('en-IN')}` },
            { label: 'Delivery required', value: `${bulkOrder.deliveryDays} days` },
          ].map(({ label, value }) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Value</Text>
            <Text style={styles.totalValue}>₹{bulkOrder.totalAmount.toLocaleString('en-IN')}</Text>
          </View>
        </Card>

        {/* Message */}
        {bulkOrder.message && (
          <Card padding="md" style={styles.card}>
            <Text style={styles.cardTitle}>Buyer Message</Text>
            <Text style={styles.message}>{bulkOrder.message}</Text>
          </Card>
        )}

        {/* Profit calculator */}
        <Card variant="ai" padding="md" style={styles.card}>
          <View style={styles.aiRow}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={styles.aiTitle}>AI Analysis</Text>
          </View>
          <Text style={styles.aiText}>At ₹{bulkOrder.pricePerUnit}/unit, your estimated profit is ₹{Math.round(bulkOrder.pricePerUnit * 0.3 * bulkOrder.quantity).toLocaleString('en-IN')} for this order.</Text>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Accept Order" onPress={() => {}} icon="checkmark-circle-outline" iconPosition="right" />
        <Button title="Send Counter Offer" onPress={() => navigation.navigate('CounterOffer', { bulkOrderId: bulkOrder.id })} variant="outline" style={{ marginTop: 10 }} />
        <Button title="Decline" onPress={() => {}} variant="ghost" style={{ marginTop: 4 }} />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 140, paddingTop: 8 },
  card: { marginBottom: 12 },
  buyerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  buyerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center' },
  buyerName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  buyerSub: { fontSize: 13, color: colors.textSecondary },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  verifiedText: { fontSize: 12, color: colors.success, fontWeight: '600' },
  buyerStats: { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderLight },
  statText: { fontSize: 13, color: colors.textSecondary },
  cardTitle: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  productName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  detailLabel: { fontSize: 14, color: colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  totalRow: { borderBottomWidth: 0, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  message: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiTitle: { fontSize: 14, fontWeight: '700', color: colors.primary },
  aiText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 32, paddingTop: 8, backgroundColor: colors.background },
});
