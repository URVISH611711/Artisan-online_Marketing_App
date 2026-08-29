import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SalesStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';

type Props = { navigation: NativeStackNavigationProp<SalesStackParamList, 'Insights'> };

export const InsightsScreen: React.FC<Props> = ({ navigation }) => (
  <ScreenWrapper padded={false}>
    <Header title="AI Insights" onBack={() => navigation.goBack()} rightIcon="sparkles-outline" />
    <View style={styles.subtitle}>
      <Text style={styles.subtitleText}>Here's what AI noticed about your business</Text>
    </View>
    <View style={styles.emptyContainer}>
      <Ionicons name="sparkles-outline" size={48} color={colors.textTertiary} />
      <Text style={styles.emptyTitle}>No AI Insights Yet</Text>
      <Text style={styles.emptyMessage}>
        AI insights will appear here as you add products and receive orders.
      </Text>
    </View>
  </ScreenWrapper>
);

const styles = StyleSheet.create({
  subtitle: { paddingHorizontal: layout.screenPadding, paddingBottom: 12 },
  subtitleText: { fontSize: 14, color: colors.textSecondary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptyMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
