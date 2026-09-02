import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { rs, rf, rp, rg, rv } from '../../theme/responsive';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchDashboard, fetchNotifications, fetchOrders, DashboardData } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';

type Props = { navigation: NativeStackNavigationProp<HomeStackParamList, 'HomeMain'> };

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [todaySales, setTodaySales] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [dashData, notifs, sellerOrders] = await Promise.all([
        fetchDashboard('today'),
        fetchNotifications(),
        fetchOrders('seller').catch(() => []),
      ]);
      setDashboard(dashData);
      setUnreadCount(notifs.filter((n) => !n.read).length);

      const shippedStatuses = ['shipped', 'delivered', 'completed'];
      const now = new Date();
      const calculatedTodaySales = (sellerOrders || [])
        .filter((o) => {
          const dateStr = o.updated_at || o.created_at;
          if (!dateStr) return false;
          const d = new Date(dateStr);
          const isSameDay =
            d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
          return isSameDay && shippedStatuses.includes(o.status.toLowerCase());
        })
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const backendSales = dashData?.total_sales || 0;
      setTodaySales(Math.max(backendSales, calculatedTodaySales));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Responsive sizing
  const hPad = rp();
  const cardGap = rg();
  const statFontSize = rv({ small: 20, medium: 24, large: 26 });
  const statLabelSize = rv({ small: 11, medium: 12, large: 13 });
  const cardPad = rv({ small: 10, medium: 14, large: 16 });

  const productsCount = dashboard?.products_count ?? 0;
  const ordersCount = dashboard?.new_orders_count ?? 0;

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <Header
        greeting={greeting()}
        greetingName={user?.name?.split(' ')[0] || 'Artisan'}
        onNotifications={() => navigation.navigate('Notifications')}
        onProfilePress={() => (navigation.getParent() as any)?.navigate('Profile')}
        notificationCount={unreadCount}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: hPad,
            paddingBottom: insets.bottom + rs(80),
          },
        ]}
      >
        {/* ── Business overview cards ── */}
        <Text style={styles.sectionLabel}>Your business today</Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <View style={[styles.statsRow, { gap: cardGap, marginBottom: rs(14) }]}>
            <Card style={[styles.statCard, { padding: cardPad }]} padding="none">
              <Text style={[styles.statValue, { fontSize: statFontSize }]}>{productsCount}</Text>
              <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>Products</Text>
            </Card>
            <Card style={[styles.statCard, { padding: cardPad }]} padding="none">
              <View style={styles.statValueRow}>
                <Text style={[styles.statValue, { fontSize: statFontSize }]}>{ordersCount}</Text>
                {ordersCount > 0 && <View style={styles.newBadge} />}
              </View>
              <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>Orders</Text>
            </Card>
            <Card style={[styles.statCard, { padding: cardPad }]} padding="none">
              <Text
                style={[styles.statValue, { fontSize: statFontSize }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {todaySales >= 1000000
                  ? `₹${(todaySales / 1000000).toFixed(1)}M`
                  : todaySales >= 100000
                  ? `₹${(todaySales / 1000).toFixed(0)}K`
                  : `₹${todaySales.toLocaleString('en-IN')}`}
              </Text>
              <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>Sales</Text>
            </Card>
          </View>
        )}

        {/* ── Add Product CTA ── */}
        <TouchableOpacity
          style={[styles.addProductCard, shadows.cardElevated]}
          onPress={() => navigation.navigate('AddProduct', { screen: 'Camera' })}
          activeOpacity={0.85}
          accessibilityLabel="Add a new product"
        >
          <View style={styles.addProductIcon}>
            <Ionicons name="camera" size={rs(22)} color={colors.textOnPrimary} />
          </View>
          <View style={styles.addProductTextContainer}>
            <Text style={styles.addProductTitle}>Add Product</Text>
            <Text style={styles.addProductDesc} numberOfLines={2}>
              Take a photo and let AI do the rest
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={rs(18)} color={colors.primary} style={styles.addProductArrow} />
        </TouchableOpacity>

        {/* ── Quick access: My Products + Smart Pricing ── */}
        <View style={[styles.quickRow, { gap: cardGap }]}>
          <TouchableOpacity
            style={[styles.quickCard, shadows.card]}
            activeOpacity={0.85}
            accessibilityLabel="My Products"
            onPress={() => (navigation.getParent() as any)?.navigate('Products', { screen: 'ProductsList' })}
          >
            <Ionicons name="grid-outline" size={rs(26)} color={colors.primary} />
            <Text style={styles.quickTitle}>My Products</Text>
            <Text style={styles.quickSub}>{productsCount} items</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, shadows.card]}
            activeOpacity={0.85}
            accessibilityLabel="Smart Pricing"
            onPress={() => navigation.navigate('SmartPricePicker')}
          >
            <Ionicons name="analytics-outline" size={rs(26)} color={colors.secondary} />
            <Text style={styles.quickTitle}>Smart Pricing</Text>
            <Text style={styles.quickSub}>AI-powered</Text>
          </TouchableOpacity>
        </View>

        {/* ── AI Suggestion ── */}
        <Card variant="ai" padding="none" style={styles.aiCard}>
          <View style={[styles.aiCardContent, { padding: rs(14) }]}>
            <View style={styles.aiLabelRow}>
              <Ionicons name="sparkles" size={rs(14)} color={colors.primary} />
              <Text style={styles.aiLabelText}>AI Suggestion</Text>
            </View>
            <Text style={styles.aiTitle}>Get Started</Text>
            <Text style={styles.aiMessage}>
              {productsCount === 0
                ? 'Add your first product to start receiving orders and AI insights.'
                : 'No new AI insights available yet. Keep adding products!'}
            </Text>
            <TouchableOpacity
              style={styles.aiAction}
              onPress={() => navigation.navigate('AddProduct', { screen: 'Camera' })}
            >
              <Text style={styles.aiActionText}>Add product</Text>
              <Ionicons name="arrow-forward" size={rs(13)} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {},
  sectionLabel: {
    fontSize: rf(12),
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: rs(10),
    marginTop: rs(4),
  },
  loadingRow: {
    height: rs(80),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: rs(2),
    textAlign: 'center',
  },
  statLabel: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  newBadge: {
    width: rs(7),
    height: rs(7),
    borderRadius: rs(4),
    backgroundColor: colors.secondary,
  },
  addProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: rs(14),
    padding: rs(14),
    marginBottom: rs(10),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  addProductIcon: {
    width: rs(46),
    height: rs(46),
    borderRadius: rs(23),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addProductTextContainer: {
    flex: 1,
    minWidth: 0,
    marginLeft: rs(12),
  },
  addProductTitle: {
    fontSize: rf(15),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: rs(2),
  },
  addProductDesc: {
    fontSize: rf(12),
    color: colors.textSecondary,
    lineHeight: rf(16),
  },
  addProductArrow: {
    flexShrink: 0,
    marginLeft: rs(8),
  },
  quickRow: {
    flexDirection: 'row',
    marginBottom: rs(14),
  },
  quickCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: rs(12),
    padding: rs(14),
    alignItems: 'center',
    gap: rs(6),
  },
  quickTitle: {
    fontSize: rf(13),
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  quickSub: {
    fontSize: rf(11),
    color: colors.textSecondary,
  },
  aiCard: {
    marginBottom: rs(14),
    overflow: 'hidden',
  },
  aiCardContent: {},
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    marginBottom: rs(6),
  },
  aiLabelText: {
    fontSize: rf(10),
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  aiTitle: {
    fontSize: rf(15),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: rs(4),
  },
  aiMessage: {
    fontSize: rf(13),
    color: colors.textSecondary,
    lineHeight: rf(18),
    marginBottom: rs(10),
  },
  aiAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
  },
  aiActionText: {
    fontSize: rf(13),
    fontWeight: '600',
    color: colors.primary,
  },
});
