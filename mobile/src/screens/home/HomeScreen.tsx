import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { layout, shadows } from '../../theme/spacing';
import { useAuthStore } from '../../store/useAuthStore';
import { mockProducts, mockOrders, mockSalesData, mockInsights, mockNotifications } from '../../services/mock/mockData';

type Props = { navigation: NativeStackNavigationProp<HomeStackParamList, 'HomeMain'> };

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const unreadCount = mockNotifications.filter((n) => !n.read).length;
  const liveProducts = mockProducts.filter((p) => p.status === 'live').length;
  const newOrders = mockOrders.filter((o) => o.status === 'new').length;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScreenWrapper scrollable padded={false}>
      {/* Header with greeting */}
      <Header
        greeting={greeting()}
        greetingName={user?.name?.split(' ')[0] || 'Artisan'}
        onNotifications={() => navigation.navigate('Notifications')}
        notificationCount={unreadCount}
        style={styles.header}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Business overview cards */}
        <Text style={styles.sectionLabel}>Your business today</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard} padding="md">
            <Text style={styles.statValue}>{liveProducts}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </Card>
          <Card style={styles.statCard} padding="md">
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{newOrders}</Text>
              {newOrders > 0 && <View style={styles.newBadge} />}
            </View>
            <Text style={styles.statLabel}>Orders</Text>
          </Card>
          <Card style={styles.statCard} padding="md">
            <Text style={styles.statValue}>₹{(mockSalesData.totalSales / 1000).toFixed(0)}K</Text>
            <Text style={styles.statLabel}>Sales</Text>
          </Card>
        </View>

        {/* Add Product CTA */}
        <TouchableOpacity
          style={[styles.addProductCard, shadows.cardElevated]}
          onPress={() => navigation.navigate('AddProduct', { screen: 'Camera' })}
          activeOpacity={0.8}
        >
          <View style={styles.addProductLeft}>
            <View style={styles.addProductIcon}>
              <Ionicons name="camera" size={24} color={colors.textOnPrimary} />
            </View>
            <View>
              <Text style={styles.addProductTitle}>Add Product</Text>
              <Text style={styles.addProductDesc}>Take a photo and let AI do the rest</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Voice add */}
        <TouchableOpacity
          style={[styles.voiceCard, shadows.card]}
          onPress={() => navigation.navigate('AddProduct', { screen: 'Voice' })}
          activeOpacity={0.8}
        >
          <View style={styles.voiceInner}>
            <Ionicons name="mic" size={20} color={colors.secondary} />
            <Text style={styles.voiceText}>Describe by Voice</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* My Products quick access */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickCard, shadows.card]}
            onPress={() => {}} // handled by tab
            activeOpacity={0.8}
          >
            <Ionicons name="grid-outline" size={28} color={colors.primary} />
            <Text style={styles.quickTitle}>My Products</Text>
            <Text style={styles.quickSub}>{mockProducts.length} items</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickCard, shadows.card]} activeOpacity={0.8}>
            <Ionicons name="analytics-outline" size={28} color={colors.secondary} />
            <Text style={styles.quickTitle}>Smart Pricing</Text>
            <Text style={styles.quickSub}>Market trends</Text>
          </TouchableOpacity>
        </View>

        {/* AI Suggestion */}
        {mockInsights.length > 0 && (
          <Card variant="ai" padding="md" style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiLabel}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
                <Text style={styles.aiLabelText}>AI Suggestion</Text>
              </View>
            </View>
            <Text style={styles.aiTitle}>{mockInsights[0].title}</Text>
            <Text style={styles.aiMessage}>{mockInsights[0].message}</Text>
            <TouchableOpacity style={styles.aiAction}>
              <Text style={styles.aiActionText}>{mockInsights[0].actionLabel}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.screenPadding },
  scrollContent: { paddingHorizontal: layout.screenPadding, paddingBottom: 100 },
  sectionLabel: {
    fontSize: 13, fontWeight: '600', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 4,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  newBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary },
  statLabel: { fontSize: 13, color: colors.textSecondary },
  addProductCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.md,
    padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  addProductLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  addProductIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  addProductTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  addProductDesc: { fontSize: 13, color: colors.textSecondary },
  voiceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: layout.borderRadius.md,
    padding: 14, marginBottom: 16,
  },
  voiceInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  voiceText: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  quickCard: {
    flex: 1, backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.md, padding: 16, alignItems: 'flex-start',
  },
  quickTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 10, marginBottom: 2 },
  quickSub: { fontSize: 12, color: colors.textSecondary },
  aiCard: { marginBottom: 16 },
  aiHeader: { marginBottom: 8 },
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiLabelText: { fontSize: 12, fontWeight: '600', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  aiTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  aiMessage: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  aiAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aiActionText: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
