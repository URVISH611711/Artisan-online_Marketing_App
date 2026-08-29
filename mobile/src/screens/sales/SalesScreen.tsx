import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SalesStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { fetchDashboard, DashboardData } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

type Props = { navigation: NativeStackNavigationProp<SalesStackParamList, 'SalesMain'> };

// Simple line chart substitute (uses View-based bars)
const MiniChart: React.FC<{ data: { week: string; amount: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.amount));
  return (
    <View style={chartStyles.container}>
      {data.map((d, i) => (
        <View key={i} style={chartStyles.barGroup}>
          <View
            style={[chartStyles.bar, { height: `${(d.amount / max) * 100}%` }]}
          />
          <Text style={chartStyles.label}>{d.week.replace('Week ', 'Wk ')}</Text>
        </View>
      ))}
    </View>
  );
};

const chartStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 12, marginTop: 16, marginBottom: 8 },
  barGroup: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '60%', backgroundColor: colors.primary, borderRadius: 4, minHeight: 8 },
  label: { fontSize: 10, color: colors.textTertiary },
});

export const SalesScreen: React.FC<Props> = ({ navigation }) => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard()
        .then(setDashboard)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [])
  );

  const totalSales = dashboard?.total_sales ?? 0;
  const totalOrders = dashboard?.orders_count ?? 0;
  const avgOrder = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  return (
    <ScreenWrapper padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity>
            <Ionicons name="menu-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sales</Text>
        </View>
        <TouchableOpacity style={styles.periodBtn}>
          <Text style={styles.periodText}>This Month</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Revenue card */}
            <Card padding="lg" style={styles.revenueCard}>
              <Text style={styles.revLabel}>Sales This Month</Text>
              <View style={styles.revRow}>
                <Text style={styles.revAmount}>₹{totalSales.toLocaleString('en-IN')}</Text>
              </View>
            </Card>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <Card padding="md" style={styles.statCard}>
                <Text style={styles.statLabel}>Orders</Text>
                <Text style={styles.statValue}>{totalOrders}</Text>
              </Card>
              <Card padding="md" style={styles.statCard}>
                <Text style={styles.statLabel}>Avg. Order</Text>
                <Text style={styles.statValue}>₹{avgOrder.toLocaleString('en-IN')}</Text>
              </Card>
            </View>

            {/* No data message */}
            {totalSales === 0 && (
              <Card padding="md" style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
                  No sales data yet. Sales will appear here when you receive orders.
                </Text>
              </Card>
            )}
          </>
        )}

        {/* AI Insights link */}
        <TouchableOpacity style={styles.insightsLink} onPress={() => navigation.navigate('Insights')}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <Text style={styles.insightsText}>View AI Business Insights</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.screenPadding, paddingVertical: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  periodBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EBF5FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  periodText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 100 },
  revenueCard: { marginBottom: 12 },
  revLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  revRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  revAmount: { fontSize: 36, fontWeight: '800', color: colors.textPrimary },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.successLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  growthText: { fontSize: 12, color: colors.success, fontWeight: '600' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekLabel: { fontSize: 10, color: colors.textTertiary },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1 },
  statLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buyerCard: { marginBottom: 16 },
  buyerInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  buyerIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  buyerTextBox: { flex: 1 },
  buyerTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  buyerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  viewLink: { fontSize: 14, fontWeight: '700', color: colors.primary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  topRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  topRank: { fontSize: 16, fontWeight: '800', color: colors.textTertiary, width: 20 },
  topThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.borderLight },
  topName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  topRevenue: { fontSize: 15, fontWeight: '700', color: colors.primary },
  insightsLink: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 8, marginBottom: 20 },
  insightsText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.primary },
});
