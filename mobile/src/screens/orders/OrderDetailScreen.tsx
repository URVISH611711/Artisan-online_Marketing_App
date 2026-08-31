import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { OrdersStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { fetchOrder, updateOrderStatus, OrderData } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<OrdersStackParamList, 'OrderDetail'>;
  route: RouteProp<OrdersStackParamList, 'OrderDetail'>;
};

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'info' | 'error' | 'default'> = {
  pending: 'warning', accepted: 'success', processing: 'info', shipped: 'info',
  completed: 'success', delivered: 'success', cancelled: 'error', rejected: 'error',
};

export const OrderDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId, role } = route.params;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchOrder(orderId, role);
      setOrder(data);
    } catch (err) {
      console.error('Order load error:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId, role]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const changeStatus = async (newStatus: string, label: string) => {
    try {
      setUpdating(true);
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrder(updated);
      Alert.alert('Order updated', `Marked as ${label}.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

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

  const viewRole = order.role || role || 'seller';
  const isSeller = viewRole === 'seller';
  const s = order.status.toLowerCase();
  const statusVariant = STATUS_VARIANT[s] || 'default';

  // Seller fulfillment actions, gated by current status. Buyers get none.
  const actions: { title: string; status: string; label: string; variant?: 'outline' }[] = [];
  if (isSeller) {
    if (s === 'pending') {
      actions.push({ title: 'Accept Order', status: 'ACCEPTED', label: 'accepted' });
      actions.push({ title: 'Decline', status: 'REJECTED', label: 'rejected', variant: 'outline' });
    } else if (s === 'accepted') {
      actions.push({ title: 'Start Processing', status: 'PROCESSING', label: 'processing' });
      actions.push({ title: 'Mark as Shipped', status: 'SHIPPED', label: 'shipped', variant: 'outline' });
    } else if (s === 'processing') {
      actions.push({ title: 'Mark as Shipped', status: 'SHIPPED', label: 'shipped' });
    } else if (s === 'shipped') {
      actions.push({ title: 'Mark as Delivered', status: 'DELIVERED', label: 'delivered' });
    }
  }

  const sellerNames = Array.from(new Set((order.items || []).map((i) => i.seller_name).filter(Boolean))) as string[];

  return (
    <ScreenWrapper padded={false}>
      <Header title="Order Details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Order ID + status */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>{order.order_number}</Text>
          <Badge label={s.toUpperCase()} variant={statusVariant} />
        </View>

        {/* Items */}
        <Card padding="md" style={styles.card}>
          <Text style={styles.cardTitle}>{order.items.length > 1 ? 'Items' : 'Product'}</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.productName}>{item.product_name_snapshot}</Text>
                <Text style={styles.itemMeta}>
                  {item.quantity} × ₹{item.unit_price.toLocaleString('en-IN')}
                  {!isSeller && item.seller_name ? `  ·  ${item.seller_name}` : ''}
                </Text>
              </View>
              <Text style={styles.itemSubtotal}>₹{item.subtotal.toLocaleString('en-IN')}</Text>
            </View>
          ))}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{order.total_amount.toLocaleString('en-IN')}</Text>
          </View>
        </Card>

        {/* Counterparty */}
        <Card padding="md" style={styles.card}>
          <Text style={styles.cardTitle}>{isSeller ? 'Buyer' : sellerNames.length > 1 ? 'Sellers' : 'Seller'}</Text>
          <Text style={styles.buyerName}>
            {isSeller ? (order.buyer_name || 'Buyer') : (sellerNames.length ? sellerNames.join(', ') : 'Seller')}
          </Text>
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

      {actions.length > 0 && (
        <View style={styles.footer}>
          {actions.map((a, idx) => (
            <Button
              key={a.status}
              title={a.title}
              onPress={() => changeStatus(a.status, a.label)}
              variant={a.variant}
              loading={updating && idx === 0}
              disabled={updating}
              style={idx > 0 ? { marginTop: 10 } : undefined}
            />
          ))}
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
  productName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  itemMeta: { fontSize: 13, color: colors.textSecondary },
  itemSubtotal: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  totalRow: { marginTop: 8 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  buyerName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  location: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  dotCompleted: { backgroundColor: colors.success },
  dotCurrent: { backgroundColor: colors.primary },
  dotPending: { backgroundColor: colors.border },
  timelineLabel: { fontSize: 14, color: colors.textTertiary },
  timelineCompleted: { color: colors.textSecondary },
  timelineCurrent: { color: colors.primary, fontWeight: '600' },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 28, paddingTop: 8, backgroundColor: colors.background },
});
