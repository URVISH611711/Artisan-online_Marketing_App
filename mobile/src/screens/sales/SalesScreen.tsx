import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SalesStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { fetchDashboard, DashboardData } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SalesSidebarDrawer } from '../../components/sales/SalesSidebarDrawer';

type Props = {
  navigation: NativeStackNavigationProp<SalesStackParamList, 'SalesMain'>;
  route: RouteProp<SalesStackParamList, 'SalesMain'>;
};

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

export const SalesScreen: React.FC<Props> = ({ navigation, route }) => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (route.params?.period) {
      setSelectedPeriod(route.params.period);
    }
  }, [route.params?.period]);

  const loadData = useCallback((period: 'week' | 'month' | 'year') => {
    setLoading(true);
    fetchDashboard(period)
      .then(setDashboard)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(selectedPeriod);
    }, [selectedPeriod, loadData])
  );

  const handlePeriodChange = (period: 'week' | 'month' | 'year') => {
    setSelectedPeriod(period);
  };

  const totalSales = dashboard?.total_sales ?? 0;
  const totalOrders = dashboard?.orders_count ?? 0;

  let revenueLabel = 'Sales This Month';
  let ordersLabel = 'Orders in Month';
  let avgLabel = 'Avg. Sales Per Week';
  let avgValue = Math.round(totalSales / 4);

  if (selectedPeriod === 'week') {
    revenueLabel = 'Sales This Week';
    ordersLabel = 'Orders in Week';
    avgLabel = 'Avg. Sales Per Day';
    avgValue = dashboard?.avg_sales !== undefined ? Math.round(dashboard.avg_sales) : Math.round(totalSales / 7);
  } else if (selectedPeriod === 'year') {
    revenueLabel = 'Sales This Year';
    ordersLabel = 'Orders in Year';
    avgLabel = 'Avg. Sales Per Month';
    avgValue = dashboard?.avg_sales !== undefined ? Math.round(dashboard.avg_sales) : Math.round(totalSales / 12);
  } else {
    revenueLabel = 'Sales This Month';
    ordersLabel = 'Orders in Month';
    avgLabel = 'Avg. Sales Per Week';
    avgValue = dashboard?.avg_sales !== undefined ? Math.round(dashboard.avg_sales) : Math.round(totalSales / 4);
  }

  return (
    <ScreenWrapper padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} activeOpacity={0.7}>
            <Ionicons name="menu-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sales</Text>
        </View>
      </View>

      {/* Period Dropdowns Row (Picture 1 style) */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, selectedPeriod === 'week' && styles.filterBtnActive]}
          onPress={() => handlePeriodChange('week')}
        >
          <Text style={styles.filterText}>This Week</Text>
          <Ionicons name="caret-down" size={12} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, selectedPeriod === 'month' && styles.filterBtnActive]}
          onPress={() => handlePeriodChange('month')}
        >
          <Text style={styles.filterText}>This Month</Text>
          <Ionicons name="caret-down" size={12} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, selectedPeriod === 'year' && styles.filterBtnActive]}
          onPress={() => handlePeriodChange('year')}
        >
          <Text style={styles.filterText}>This Year</Text>
          <Ionicons name="caret-down" size={12} color={colors.textPrimary} />
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
              <Text style={styles.revLabel}>{revenueLabel}</Text>
              <View style={styles.revRow}>
                <Text style={styles.revAmount}>₹{totalSales.toLocaleString('en-IN')}</Text>
              </View>
            </Card>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <Card padding="md" style={styles.statCard}>
                <Text style={styles.statLabel}>{ordersLabel}</Text>
                <Text style={styles.statValue}>{totalOrders}</Text>
              </Card>
              <Card padding="md" style={styles.statCard}>
                <Text style={styles.statLabel}>{avgLabel}</Text>
                <Text style={styles.statValue}>₹{avgValue.toLocaleString('en-IN')}</Text>
              </Card>
            </View>

            {/* Sales Between Two Dates */}
            <Card padding="md" style={styles.betweenDatesCard}>
              <TouchableOpacity
                style={styles.betweenDatesBtn}
                onPress={() => navigation.navigate('SalesBetweenDates')}
                activeOpacity={0.7}
              >
                <Text style={styles.betweenDatesText}>Sales Between Two Dates</Text>
              </TouchableOpacity>
            </Card>

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

      {/* Sidebar Drawer */}
      <SalesSidebarDrawer
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={(period) => setSelectedPeriod(period)}
        onPressDuration={() => navigation.navigate('SalesBetweenDates')}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.screenPadding, paddingVertical: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.screenPadding, paddingBottom: 14, gap: 8 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, flex: 1 },
  filterBtnActive: { borderColor: colors.primary, backgroundColor: '#FFFFFF' },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 100 },
  revenueCard: { marginBottom: 12 },
  revLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  revRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  revAmount: { fontSize: 36, fontWeight: '800', color: colors.textPrimary },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1 },
  statLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  betweenDatesCard: { marginBottom: 12 },
  betweenDatesBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EBF5FF', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#B9E0FF' },
  betweenDatesText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  insightsLink: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 8, marginBottom: 20 },
  insightsText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.primary },
});
