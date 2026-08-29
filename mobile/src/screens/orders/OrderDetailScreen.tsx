import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
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
import { fetchOrder, OrderData } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<OrdersStackParamList, 'OrderDetail'>;
  route: RouteProp<OrdersStackParamList, 'OrderDetail'>;
};

export const OrderDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder(route.params.orderId)
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [route.params.orderId]);

  if (loading || !order) {
    return (
      <ScreenWrapper padded={false}>
        <Header title="Order Details" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {loading ? <ActivityIndicator size="large" color={colors.primary} /> : <Text style={{ color: colors.textSecondary }}>Order not found</Text>}
        </View>
      </ScreenWrapper>
    );
  }

  const orderStatus = order.status.toLowerCase();

  const statusVariant = {
    pending: 'warning' as const, accepted: 'success' as const,
    processing: 'info' as const, shipped: 'info' as const,
    completed: 'success' as const, delivered: 'success' as const,
    cancelled: 'error' as const, rejected: 'error' as const,
  }[orderStatus] || ('default' as const);

  const isNew = orderStatus === 'pending';

  return (
    <ScreenWrapper padded={false}>
      <Header title="Order Details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Order ID + status */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>{order.order_number}</Text>
          <Badge label={orderStatus.toUpperCase()} variant={statusVariant} />
        </View>

        {/* Product */}
        <Card padding="md" style={styles.card}>
          <Text style={styles.cardTitle}>Product</Text>
          <Text style={styles.productName}>{order.items?.[0]?.product_name_snapshot || 'Order'}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Quantity</Text>
            <Text style={styles.value}>{order.items?.reduce((s, i) => s + i.quantity, 0) || 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Price per unit</Text>
            <Text style={styles.value}>₹{(order.items?.[0]?.unit_price || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{order.total_amount.toLocaleString('en-IN')}</Text>
          </View>
        </Card>

        {/* Buyer info */}
        <Card padding="md" style={styles.card}>
          <Text style={styles.cardTitle}>Buyer</Text>
          <Text style={styles.buyerName}>Buyer</Text>
          {order.shipping_address && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.location}>{order.shipping_address}</Text>
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
                step.status_state === 'completed' && styles.dotCompleted,
                step.status_state === 'current' && styles.dotCurrent,
                step.status_state === 'pending' && styles.dotPending,
              ]} />
              <Text style={[
                styles.timelineLabel,
                step.status_state === 'completed' && styles.timelineCompleted,
                step.status_state === 'current' && styles.timelineCurrent,
              ]}>
                {step.status_label}
              </Text>
            </View>
          ))}
        </Card>


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
