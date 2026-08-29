import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OrdersStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { OrderCard } from '../../components/order/OrderCard';
import { EmptyState } from '../../components/states/StateScreens';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { fetchOrders, fetchNotifications, OrderData } from '../../services/api';
import { Order } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

type Props = { navigation: NativeStackNavigationProp<OrdersStackParamList, 'OrdersList'> };

type Filter = 'All' | 'New' | 'Processing' | 'Completed';

export const OrdersScreen: React.FC<Props> = ({ navigation }) => {
  const [filter, setFilter] = useState<Filter>('All');
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const [ordersData, notifs] = await Promise.all([
            fetchOrders(),
            fetchNotifications(),
          ]);
          setOrders(ordersData);
          setUnread(notifs.filter((n) => !n.read).length);
        } catch (err) {
          console.error('Orders load error:', err);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  const newCount = orders.filter((o) => o.status === 'PENDING' || o.status === 'pending').length;

  const filtered = orders.filter((o) => {
    const s = o.status.toLowerCase();
    if (filter === 'All') return true;
    if (filter === 'New') return s === 'pending';
    if (filter === 'Processing') return s === 'processing' || s === 'shipped' || s === 'accepted';
    if (filter === 'Completed') return s === 'completed' || s === 'delivered' || s === 'cancelled';
    return true;
  });

  // Map to Order type for OrderCard
  const mapToOrder = (o: OrderData): Order => ({
    id: o.id,
    orderId: o.order_number,
    productId: o.items?.[0]?.id || '',
    productName: o.items?.[0]?.product_name_snapshot || 'Order',
    quantity: o.items?.reduce((sum, i) => sum + i.quantity, 0) || 0,
    pricePerUnit: o.items?.[0]?.unit_price || 0,
    totalAmount: o.total_amount,
    status: o.status.toLowerCase() as any,
    buyerName: '',
    buyerVerified: false,
    timeline: o.timeline.map((t) => ({
      label: t.status_label,
      status: t.status_state as any,
      timestamp: t.created_at,
    })),
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  });

  const TABS: { label: string; filter: Filter; badge?: number }[] = [
    { label: 'All', filter: 'All' },
    { label: 'New', filter: 'New', badge: newCount },
    { label: 'Processing', filter: 'Processing' },
    { label: 'Completed', filter: 'Completed' },
  ];

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={18} color={colors.textSecondary} />
        </View>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity style={styles.bellBtn} accessibilityLabel={`${unread} notifications`}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          {unread > 0 && <View style={styles.bellDot} />}
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.filter}
            style={[styles.tab, filter === tab.filter && styles.tabActive]}
            onPress={() => setFilter(tab.filter)}
          >
            <Text style={[styles.tabText, filter === tab.filter && styles.tabTextActive]}>
              {tab.label}
              {tab.badge ? (
                <Text style={styles.tabBadge}> {tab.badge}</Text>
              ) : null}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState icon="receipt-outline" title="No orders yet" message="Your products are ready for buyers. Orders will appear here." />
      ) : (
        <FlatList
          data={filtered.map(mapToOrder)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={(o) => navigation.navigate('OrderDetail', { orderId: o.id })} />
          )}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding, paddingVertical: 12,
  },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  bellBtn: { padding: 8, position: 'relative' },
  bellDot: {
    position: 'absolute', top: 6, right: 6,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.secondary,
  },
  tabBar: {
    flexDirection: 'row', paddingHorizontal: layout.screenPadding,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  tab: {
    marginRight: 20, paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 15, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  tabBadge: {
    fontSize: 12, color: colors.secondary,
    fontWeight: '700',
  },
  list: { paddingHorizontal: layout.screenPadding, paddingTop: 12, paddingBottom: 100 },
});
