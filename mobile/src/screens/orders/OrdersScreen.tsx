import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OrdersStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
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
// Every user is both buyer and seller on the SAME account. These two views read
// the same underlying orders from opposite sides.
type Mode = 'received' | 'purchases';

export const OrdersScreen: React.FC<Props> = ({ navigation }) => {
  const [mode, setMode] = useState<Mode>('received');
  const [filter, setFilter] = useState<Filter>('All');
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        try {
          const [ordersData, notifs] = await Promise.all([
            fetchOrders(mode === 'purchases' ? 'buyer' : 'seller'),
            fetchNotifications(),
          ]);
          if (!active) return;
          setOrders(ordersData);
          setUnread(notifs.filter((n) => !n.read).length);
        } catch (err) {
          console.error('Orders load error:', err);
        } finally {
          if (active) setLoading(false);
        }
      };
      load();
      return () => {
        active = false;
      };
    }, [mode])
  );

  const newCount = orders.filter((o) => o.status.toLowerCase() === 'pending').length;

  const filtered = orders.filter((o) => {
    const s = o.status.toLowerCase();
    if (filter === 'All') return true;
    if (filter === 'New') return s === 'pending';
    if (filter === 'Processing') return s === 'processing' || s === 'shipped' || s === 'accepted';
    if (filter === 'Completed') return s === 'completed' || s === 'delivered' || s === 'cancelled' || s === 'rejected';
    return true;
  });

  // Build the counterparty label for the card: the buyer sees who they bought
  // FROM (seller), the seller sees who bought (buyer).
  const counterparty = (o: OrderData): string => {
    if (mode === 'received') return o.buyer_name || 'Buyer';
    const names = Array.from(new Set((o.items || []).map((i) => i.seller_name).filter(Boolean))) as string[];
    if (names.length === 0) return 'Seller';
    return names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`;
  };

  const mapToOrder = (o: OrderData): Order => {
    const first = o.items?.[0]?.product_name_snapshot || 'Order';
    const extra = (o.items?.length || 0) - 1;
    return {
      id: o.id,
      orderId: o.order_number,
      productId: o.items?.[0]?.product_id || o.items?.[0]?.id || '',
      productName: extra > 0 ? `${first} +${extra} more` : first,
      quantity: o.items?.reduce((sum, i) => sum + i.quantity, 0) || 0,
      pricePerUnit: o.items?.[0]?.unit_price || 0,
      totalAmount: o.total_amount,
      status: o.status.toLowerCase() as any,
      buyerName: counterparty(o),
      buyerVerified: false,
      timeline: o.timeline.map((t) => ({
        label: t.status_label,
        status: t.status_state as any,
        timestamp: t.created_at,
      })),
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    };
  };

  const TABS: { label: string; filter: Filter; badge?: number }[] = [
    { label: 'All', filter: 'All' },
    { label: 'New', filter: 'New', badge: newCount },
    { label: 'Processing', filter: 'Processing' },
    { label: 'Completed', filter: 'Completed' },
  ];

  const emptyCopy =
    mode === 'received'
      ? { title: 'No orders received', message: 'When someone buys one of your products, it appears here.' }
      : { title: 'No purchases yet', message: 'Products you buy from other sellers appear here.' };

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

      {/* Buyer / seller view switch — same account, two perspectives */}
      <View style={styles.segment}>
        {([
          { key: 'received' as Mode, label: 'Received Orders' },
          { key: 'purchases' as Mode, label: 'My Purchases' },
        ]).map((seg) => (
          <TouchableOpacity
            key={seg.key}
            style={[styles.segmentBtn, mode === seg.key && styles.segmentBtnActive]}
            onPress={() => {
              setMode(seg.key);
              setFilter('All');
            }}
          >
            <Text style={[styles.segmentText, mode === seg.key && styles.segmentTextActive]}>{seg.label}</Text>
          </TouchableOpacity>
        ))}
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
              {tab.badge ? <Text style={styles.tabBadge}> {tab.badge}</Text> : null}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState icon="receipt-outline" title={emptyCopy.title} message={emptyCopy.message} />
      ) : (
        <FlatList
          data={filtered.map(mapToOrder)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={(o) =>
                navigation.navigate('OrderDetail', {
                  orderId: o.id,
                  role: mode === 'purchases' ? 'buyer' : 'seller',
                })
              }
            />
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
  segment: {
    flexDirection: 'row',
    marginHorizontal: layout.screenPadding,
    marginBottom: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    padding: 4,
  },
  segmentBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    ...({ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }),
  },
  segmentText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  segmentTextActive: { color: colors.primary },
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
