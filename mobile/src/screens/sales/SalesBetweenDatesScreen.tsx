import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SalesStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchOrders, OrderData } from '../../services/api';
import { SalesSidebarDrawer } from '../../components/sales/SalesSidebarDrawer';

type Props = {
  navigation: NativeStackNavigationProp<SalesStackParamList, 'SalesBetweenDates'>;
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper to format Date object to DD/MM/YY
const formatDateToDDMMYY = (d: Date): string => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

// Helper to parse DD/MM/YY back to Date object
const parseDDMMYYToDate = (str: string): Date | null => {
  if (!str || str === 'DD/MM/YY') return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000;
  return new Date(year, month, day);
};

export const SalesBetweenDatesScreen: React.FC<Props> = ({ navigation }) => {
  const [startDateStr, setStartDateStr] = useState<string>('DD/MM/YY');
  const [endDateStr, setEndDateStr] = useState<string>('DD/MM/YY');
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Calendar navigation state
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Orders data state
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch seller (received) orders when screen gains focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        try {
          const sellerOrders = await fetchOrders('seller');
          if (active) {
            setOrders(sellerOrders);
          }
        } catch (err) {
          console.error('Error fetching seller orders for sales calculation:', err);
        } finally {
          if (active) setLoading(false);
        }
      };
      load();
      return () => {
        active = false;
      };
    }, [])
  );

  // Parse selected dates
  const startDate = parseDDMMYYToDate(startDateStr);
  const endDate = parseDDMMYYToDate(endDateStr);

  // Default to 0 initially until dates are selected by the user
  let filteredShippedOrders: OrderData[] = [];
  let totalDays = 1;

  if (startDate && endDate) {
    filteredShippedOrders = orders.filter((o) => {
      const status = o.status.toLowerCase();
      const isShippedOrDelivered = status === 'shipped' || status === 'delivered' || status === 'completed';
      if (!isShippedOrDelivered) return false;

      const orderDate = new Date(o.created_at || o.updated_at);
      const startOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
      return orderDate >= startOfDay && orderDate <= endOfDay;
    });

    const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
    totalDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
  }

  // Calculate metrics (defaults to 0 initially)
  const totalSales = startDate && endDate ? filteredShippedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) : 0;
  const totalShippedOrdersCount = startDate && endDate ? filteredShippedOrders.length : 0;
  const avgSalesPerDay = startDate && endDate ? Math.round(totalSales / totalDays) : 0;

  // Calendar Grid Generator logic
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calYear, calMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calYear, calMonth + 1, 1));
  };

  const openCalendar = (pickerType: 'start' | 'end') => {
    const existingStr = pickerType === 'start' ? startDateStr : endDateStr;
    const existingDate = parseDDMMYYToDate(existingStr);
    if (existingDate) {
      setCalendarDate(existingDate);
    } else {
      setCalendarDate(new Date());
    }
    setActivePicker(pickerType);
  };

  const handleDaySelect = (dayNum: number) => {
    const selected = new Date(calYear, calMonth, dayNum);
    const formatted = formatDateToDDMMYY(selected);
    if (activePicker === 'start') {
      setStartDateStr(formatted);
    } else if (activePicker === 'end') {
      setEndDateStr(formatted);
    }
    setActivePicker(null);
  };

  return (
    <ScreenWrapper padded={false}>
      {/* Header with Back Arrow on Right */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} activeOpacity={0.7}>
            <Ionicons name="menu-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sales</Text>
        </View>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Top Banner Card: Sales Between Two Dates Badge (Light Blue Background) */}
        <Card padding="md" style={styles.topBadgeCard}>
          <View style={styles.topBadgeBtn}>
            <Text style={styles.topBadgeText}>Sales Between Two Dates</Text>
          </View>
        </Card>

        {/* Starting Date & Ending Date Selector Card */}
        <Card padding="lg" style={styles.dateSelectorCard}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Starting Date :</Text>
            <TouchableOpacity
              style={styles.pickerBox}
              onPress={() => openCalendar('start')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pickerText,
                  startDateStr === 'DD/MM/YY' && styles.pickerTextPlaceholder,
                ]}
              >
                {startDateStr}
              </Text>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Ending Date :</Text>
            <TouchableOpacity
              style={styles.pickerBox}
              onPress={() => openCalendar('end')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pickerText,
                  endDateStr === 'DD/MM/YY' && styles.pickerTextPlaceholder,
                ]}
              >
                {endDateStr}
              </Text>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Loading Indicator or Computed Metrics */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Sales Between Two Dates Card */}
            <Card padding="lg" style={styles.salesCard}>
              <Text style={styles.salesCardLabel}>Sales Between Two Dates</Text>
              <Text style={styles.salesCardAmount}>
                ₹{totalSales.toLocaleString('en-IN')}
              </Text>
            </Card>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <Card padding="md" style={styles.statCard}>
                <Text style={styles.statLabel}>Order Between Two Dates</Text>
                <Text style={styles.statValue}>{totalShippedOrdersCount}</Text>
              </Card>
              <Card padding="md" style={styles.statCard}>
                <Text style={styles.statLabel}>Avg. Sales Per Day</Text>
                <Text style={styles.statValue}>
                  ₹{avgSalesPerDay.toLocaleString('en-IN')}
                </Text>
              </Card>
            </View>
          </>
        )}
      </ScrollView>

      {/* Interactive Calendar Format Picker Modal */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActivePicker(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.calendarModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {activePicker === 'start' ? 'Starting Date' : 'Ending Date'}
              </Text>
              <TouchableOpacity onPress={() => setActivePicker(null)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation Header */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrow}>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.monthNavText}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navArrow}>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Days of Week Header */}
            <View style={styles.weekRow}>
              {DAYS_OF_WEEK.map((d, idx) => (
                <Text key={idx} style={styles.weekDayText}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.daysGrid}>
              {/* Empty leading slots */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCell} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateObj = new Date(calYear, calMonth, dayNum);
                const formattedStr = formatDateToDDMMYY(dateObj);
                const isSelected =
                  (activePicker === 'start' ? startDateStr : endDateStr) === formattedStr;

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                    onPress={() => handleDaySelect(dayNum)}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        isSelected && styles.dayCellTextSelected,
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActivePicker(null)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Sidebar Drawer */}
      <SalesSidebarDrawer
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedPeriod="month"
        onSelectPeriod={(period) => navigation.navigate('SalesMain', { period })}
        onPressDuration={() => {}}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 100,
  },
  topBadgeCard: {
    marginBottom: 12,
  },
  topBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF5FF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#B9E0FF',
  },
  topBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  dateSelectorCard: {
    marginBottom: 12,
    gap: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    minWidth: 130,
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pickerTextPlaceholder: {
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  salesCard: {
    marginBottom: 12,
  },
  salesCardLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  salesCardAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModal: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navArrow: {
    padding: 6,
  },
  monthNavText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalCloseBtn: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
