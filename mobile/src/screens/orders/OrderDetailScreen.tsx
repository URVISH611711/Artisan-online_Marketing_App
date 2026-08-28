import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OrdersStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { mockOrders, mockBulkOrders } from '../../services/mock/mockData';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<OrdersStackParamList, 'OrderDetail'>;
  route: RouteProp<OrdersStackParamList, 'OrderDetail'>;
};

export const OrderDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const order = mockOrders.find((o) => o.id === route.params.orderId) || mockOrders[0];

  const statusVariant = {
    new: 'warning' as const, accepted: 'success' as const,
    processing: 'info' as const, shipped: 'info' as const,
    completed: 'success' as const, cancelled: 'error' as const,
  }[order.status];

  const isNew = order.status === 'new';

  return (
    <ScreenWrapper padded={false}>
      <Header title="Order Details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Order ID + status */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>{order.orderId}</Text>
          <Badge label={order.status.toUpperCase()} variant={statusVariant} />
        </View>

        {/* Product */}
        <Card padding="md" style={styles.card}>
          <Text style={styles.cardTitle}>Product</Text>
          <Text style={styles.productName}>{order.productName}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Quantity</Text>
            <Text style={styles.value}>{order.quantity}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Price per unit</Text>
            <Text style={styles.value}>₹{order.pricePerUnit.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
          </View>
        </Card>

        {/* Buyer info */}
        <Card padding="md" style={styles.card}>
          <Text style={styles.cardTitle}>Buyer</Text>
          <Text style={styles.buyerName}>{order.buyerName}</Text>
          {order.buyerCompany && <Text style={styles.buyerCompany}>{order.buyerCompany}</Text>}
          {order.buyerLocation && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.location}>{order.buyerLocation}</Text>
            </View>
          )}
          {order.buyerVerified && (
            <View style={styles.verifiedRow}>
              <Ionicons name="shield-checkmark" size={14} color={colors.success} />
              <Text style={styles.verifiedText}>Verified Buyer</Text>
            </View>
          )}
        </Card>

        {/* Timeline */}
        <Card padding="md" style={styles.card}>
          <Text style={styles.cardTitle}>Order Timeline</Text>
          {order.timeline.map((step, i) => (
            <View key={i} style={styles.timelineRow}>
              <View style={[
                styles.timelineDot,
                step.status === 'completed' && styles.dotCompleted,
                step.status === 'current' && styles.dotCurrent,
                step.status === 'pending' && styles.dotPending,
              ]} />
              <Text style={[
                styles.timelineLabel,
                step.status === 'completed' && styles.timelineCompleted,
                step.status === 'current' && styles.timelineCurrent,
              ]}>
                {step.label}
              </Text>
            </View>
          ))}
        </Card>

        {/* B2B bulk order link */}
        {mockBulkOrders.length > 0 && (
          <TouchableOpacity style={styles.bulkLink} onPress={() => navigation.navigate('BulkOrder', { bulkOrderId: mockBulkOrders[0].id })}>
            <Ionicons name="business-outline" size={18} color={colors.primary} />
            <Text style={styles.bulkLinkText}>View Bulk Order Request</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {isNew && (
        <View style={styles.footer}>
          <Button title="Accept Order" onPress={() => {}} />
          <Button title="Decline" onPress={() => {}} variant="outline" style={{ marginTop: 10 }} />
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 120, paddingTop: 8 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  orderId: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  card: { marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  productName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  label: { fontSize: 14, color: colors.textSecondary },
  value: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  totalRow: { borderBottomWidth: 0, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  buyerName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  buyerCompany: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  location: { fontSize: 14, color: colors.textSecondary },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedText: { fontSize: 13, color: colors.success, fontWeight: '500' },
  timelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  dotCompleted: { backgroundColor: colors.success },
  dotCurrent: { backgroundColor: colors.primary },
  dotPending: { backgroundColor: colors.border },
  timelineLabel: { fontSize: 14, color: colors.textTertiary },
  timelineCompleted: { color: colors.textSecondary },
  timelineCurrent: { color: colors.primary, fontWeight: '600' },
  bulkLink: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: colors.surface, borderRadius: 12, marginBottom: 16 },
  bulkLinkText: { flex: 1, fontSize: 14, color: colors.primary, fontWeight: '600' },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 28, paddingTop: 8, backgroundColor: colors.background },
});
