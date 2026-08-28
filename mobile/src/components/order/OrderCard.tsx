import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { layout, shadows } from '../../theme/spacing';
import { Badge } from '../ui/Badge';
import { Order } from '../../types';

interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const statusConfig = {
    new: { label: 'NEW ORDER', variant: 'warning' as const, color: colors.warning },
    accepted: { label: 'ACCEPTED', variant: 'success' as const, color: colors.success },
    processing: { label: 'PROCESSING', variant: 'info' as const, color: colors.primary },
    shipped: { label: 'SHIPPED', variant: 'info' as const, color: colors.primary },
    completed: { label: 'COMPLETED', variant: 'success' as const, color: colors.success },
    cancelled: { label: 'CANCELLED', variant: 'error' as const, color: colors.error },
  }[order.status];

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity
      style={[styles.container, shadows.card]}
      onPress={() => onPress(order)}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <Badge label={statusConfig.label} variant={statusConfig.variant} size="sm" />
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      <Text style={styles.productName}>{order.productName}</Text>
      <View style={styles.detailRow}>
        <Text style={styles.quantity}>Qty: {order.quantity}</Text>
        <Text style={styles.amount}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.buyerRow}>
          <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.buyerName}>{order.buyerCompany || order.buyerName}</Text>
        </View>
        <TouchableOpacity style={styles.viewLink}>
          <Text style={styles.viewText}>View Order</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.md,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buyerName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 2,
  },
});
