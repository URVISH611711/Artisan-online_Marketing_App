import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { mockNotifications } from '../../services/mock/mockData';
import { Notification } from '../../types';
import { Ionicons } from '@expo/vector-icons';

const ICON_MAP: Record<Notification['type'], keyof typeof Ionicons.glyphMap> = {
  order: 'receipt-outline',
  pricing: 'cash-outline',
  ai_recommendation: 'sparkles-outline',
  inventory: 'cube-outline',
  market_trend: 'trending-up-outline',
  buyer_message: 'chatbubble-outline',
};

const NotifItem: React.FC<{ notification: Notification }> = ({ notification }) => {
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
        <Ionicons name={ICON_MAP[notification.type]} size={20} color={notification.read ? colors.textSecondary : colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !notification.read && styles.titleUnread]}>{notification.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
        <Text style={styles.time}>{timeAgo(notification.createdAt)}</Text>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <ScreenWrapper padded={false}>
    <Header title="Notifications" onBack={() => navigation.goBack()} rightText="Mark all read" onRightPress={() => {}} />
    <FlatList
      data={mockNotifications}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => <NotifItem notification={item} />}
    />
  </ScreenWrapper>
);

const styles = StyleSheet.create({
  list: { paddingBottom: 40 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: layout.screenPadding, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  unread: { backgroundColor: '#F0F6FF' },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  iconBoxUnread: { backgroundColor: '#DBEAFE' },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: 3 },
  titleUnread: { color: colors.textPrimary, fontWeight: '700' },
  message: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  time: { fontSize: 11, color: colors.textTertiary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
});
