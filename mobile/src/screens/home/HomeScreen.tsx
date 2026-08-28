import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
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
import { mockProducts, mockOrders, mockSalesData, mockInsights, mockNotifications } from '../../services/mock/mockData';

type Props = { navigation: NativeStackNavigationProp<HomeStackParamList, 'HomeMain'> };

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const unreadCount = mockNotifications.filter((n) => !n.read).length;
  const liveProducts = mockProducts.filter((p) => p.status === 'live').length;
  const newOrders = mockOrders.filter((o) => o.status === 'new').length;

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

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <Header
        greeting={greeting()}
        greetingName={user?.name?.split(' ')[0] || 'Artisan'}
        onNotifications={() => navigation.navigate('Notifications')}
        notificationCount={unreadCount}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: hPad,
            paddingBottom: insets.bottom + rs(80), // clear bottom nav
          },
        ]}
      >
        {/* ── Business overview cards ── */}
        <Text style={styles.sectionLabel}>Your business today</Text>
        <View style={[styles.statsRow, { gap: cardGap, marginBottom: rs(14) }]}>
          {/* Each stat card uses flex: 1 and minWidth: 0 — they share width equally */}
          <Card style={[styles.statCard, { padding: cardPad }]} padding="none">
            <Text style={[styles.statValue, { fontSize: statFontSize }]}>{liveProducts}</Text>
            <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>Products</Text>
          </Card>
          <Card style={[styles.statCard, { padding: cardPad }]} padding="none">
            <View style={styles.statValueRow}>
              <Text style={[styles.statValue, { fontSize: statFontSize }]}>{newOrders}</Text>
              {newOrders > 0 && <View style={styles.newBadge} />}
            </View>
            <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>Orders</Text>
          </Card>
          <Card style={[styles.statCard, { padding: cardPad }]} padding="none">
            {/* Allow value to shrink — never truncate with fixed width */}
            <Text
              style={[styles.statValue, { fontSize: statFontSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              ₹{(mockSalesData.totalSales / 1000).toFixed(0)}K
            </Text>
            <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>Sales</Text>
          </Card>
        </View>

        {/* ── Add Product CTA ── */}
        <TouchableOpacity
          style={[styles.addProductCard, shadows.cardElevated]}
          onPress={() => navigation.navigate('AddProduct', { screen: 'Camera' })}
          activeOpacity={0.85}
          accessibilityLabel="Add a new product"
        >
          {/* Icon — shrink: 0 so it never squishes */}
          <View style={styles.addProductIcon}>
            <Ionicons name="camera" size={rs(22)} color={colors.textOnPrimary} />
          </View>
          {/* Text container — flex: 1 + minWidth: 0 is the key pattern */}
          <View style={styles.addProductTextContainer}>
            <Text style={styles.addProductTitle}>Add Product</Text>
            <Text style={styles.addProductDesc} numberOfLines={2}>
              Take a photo and let AI do the rest
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={rs(18)} color={colors.primary} style={styles.addProductArrow} />
        </TouchableOpacity>

        {/* ── Voice card ── */}
        <TouchableOpacity
          style={[styles.voiceCard, shadows.card]}
          onPress={() => navigation.navigate('AddProduct', { screen: 'Voice' })}
          activeOpacity={0.85}
          accessibilityLabel="Describe product by voice"
        >
          <View style={styles.voiceInner}>
            <Ionicons name="mic" size={rs(20)} color={colors.secondary} />
            <Text style={styles.voiceText}>Describe by Voice</Text>
          </View>
          <Ionicons name="chevron-forward" size={rs(16)} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* ── Quick access: My Products + Smart Pricing ── */}
        <View style={[styles.quickRow, { gap: cardGap }]}>
          <TouchableOpacity
            style={[styles.quickCard, shadows.card]}
            activeOpacity={0.85}
            accessibilityLabel="My Products"
          >
            <Ionicons name="grid-outline" size={rs(26)} color={colors.primary} />
            <Text style={styles.quickTitle}>My Products</Text>
            <Text style={styles.quickSub}>{mockProducts.length} items</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, shadows.card]}
            activeOpacity={0.85}
            accessibilityLabel="Smart Pricing"
          >
            <Ionicons name="analytics-outline" size={rs(26)} color={colors.secondary} />
            <Text style={styles.quickTitle}>Smart Pricing</Text>
            <Text style={styles.quickSub}>Market trends</Text>
          </TouchableOpacity>
        </View>

        {/* ── AI Suggestion ── */}
        {mockInsights.length > 0 && (
          <Card variant="ai" padding="none" style={styles.aiCard}>
            <View style={[styles.aiCardContent, { padding: rs(14) }]}>
              {/* Label row */}
              <View style={styles.aiLabelRow}>
                <Ionicons name="sparkles" size={rs(14)} color={colors.primary} />
                <Text style={styles.aiLabelText}>AI Suggestion</Text>
              </View>
              {/* Title */}
              <Text style={styles.aiTitle}>{mockInsights[0].title}</Text>
              {/* Message — allow full wrapping */}
              <Text style={styles.aiMessage}>{mockInsights[0].message}</Text>
              {/* CTA */}
              <TouchableOpacity style={styles.aiAction}>
                <Text style={styles.aiActionText}>{mockInsights[0].actionLabel}</Text>
                <Ionicons name="arrow-forward" size={rs(13)} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    // paddingHorizontal and paddingBottom set dynamically above
  },

  // Section label
  sectionLabel: {
    fontSize: rf(12),
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: rs(10),
    marginTop: rs(4),
  },

  // ── Stats row ──────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    minWidth: 0, // prevents overflow in tight spaces
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

  // ── Add Product Card ──────────────────────────────────────
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
    flexShrink: 0, // never squish the icon
  },
  addProductTextContainer: {
    flex: 1,       // take remaining space
    minWidth: 0,   // allow shrinking below intrinsic width
    marginLeft: rs(12),
    marginRight: rs(6),
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
    lineHeight: rf(17),
  },
  addProductArrow: {
    flexShrink: 0,
  },

  // ── Voice Card ─────────────────────────────────────────────
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: rs(14),
    paddingVertical: rs(13),
    paddingHorizontal: rs(14),
    marginBottom: rs(14),
    minHeight: rs(52), // comfortable touch target
  },
  voiceInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    flex: 1,
    minWidth: 0,
  },
  voiceText: {
    fontSize: rf(14),
    fontWeight: '500',
    color: colors.textPrimary,
  },

  // ── Quick access row ───────────────────────────────────────
  quickRow: {
    flexDirection: 'row',
    marginBottom: rs(14),
  },
  quickCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: rs(14),
    padding: rs(14),
    alignItems: 'flex-start',
    minHeight: rs(100), // comfortable card height
  },
  quickTitle: {
    fontSize: rf(13),
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: rs(8),
    marginBottom: rs(2),
  },
  quickSub: {
    fontSize: rf(11),
    color: colors.textSecondary,
  },

  // ── AI Suggestion ──────────────────────────────────────────
  aiCard: {
    marginBottom: rs(16),
  },
  aiCardContent: {
    // padding set dynamically
  },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(5),
    marginBottom: rs(6),
  },
  aiLabelText: {
    fontSize: rf(11),
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: rs(5),
  },
  aiMessage: {
    fontSize: rf(13),
    color: colors.textSecondary,
    lineHeight: rf(20),
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
