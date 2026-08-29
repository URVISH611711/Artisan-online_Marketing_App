import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { fetchNotifications, NotificationData } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  order: 'receipt-outline',
  NEW_ORDER: 'receipt-outline',
  pricing: 'cash-outline',
  PRICE_OPPORTUNITY: 'cash-outline',
  ai_recommendation: 'sparkles-outline',
  AI_INSIGHT: 'sparkles-outline',
  inventory: 'cube-outline',
  LOW_STOCK: 'cube-outline',
  market_trend: 'trending-up-outline',
  buyer_message: 'chatbubble-outline',
  BULK_ORDER: 'business-outline',
  COUNTER_OFFER: 'swap-horizontal-outline',
  SYSTEM: 'information-circle-outline',
};

const NotifItem: React.FC<{ notification: NotificationData }> = ({ notification }) => {
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <TouchableOpacity style={[styles.item, !notification.read && styles.unread]} activeOpacity={0.7}>
      <View style={[styles.iconBox, !notification.read && styles.iconBoxUnread]}>
        <Ionicons name={ICON_MAP[notification.type] || 'notifications-outline'} size={20} color={notification.read ? colors.textSecondary : colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !notification.read && styles.titleUnread]}>{notification.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
        <Text style={styles.time}>{timeAgo(notification.created_at)}</Text>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications()
        .then(setNotifications)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <ScreenWrapper padded={false}>
      <Header title="Notifications" onBack={() => navigation.goBack()} />
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyMessage}>You're all caught up! Notifications will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <NotifItem notification={item} />}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  list: { paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptyMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.screenPadding, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  unread: { backgroundColor: '#F0F7FF' },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconBoxUnread: { backgroundColor: '#DBEAFE' },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  titleUnread: { fontWeight: '700' },
  message: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  time: { fontSize: 12, color: colors.textTertiary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 8 },
});
