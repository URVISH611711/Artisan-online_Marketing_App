import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SalesStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { mockInsights } from '../../services/mock/mockData';
import { AIInsight } from '../../types';
import { Ionicons } from '@expo/vector-icons';

type Props = { navigation: NativeStackNavigationProp<SalesStackParamList, 'Insights'> };

const InsightCard: React.FC<{ insight: AIInsight }> = ({ insight }) => (
  <Card
    variant="ai"
    padding="md"
    style={[styles.card, { borderLeftColor: insight.color }] as any}
  >
    <View style={styles.iconRow}>
      <View style={[styles.iconBox, { backgroundColor: `${insight.color}20` }]}>
        <Ionicons name={insight.icon as any} size={20} color={insight.color} />
      </View>
      <Text style={[styles.title, { color: insight.color }]}>{insight.title}</Text>
    </View>
    <Text style={styles.message}>{insight.message}</Text>
    <TouchableOpacity style={styles.action}>
      <Text style={[styles.actionText, { color: insight.color }]}>{insight.actionLabel}</Text>
      <Ionicons name="arrow-forward" size={14} color={insight.color} />
    </TouchableOpacity>
  </Card>
);

export const InsightsScreen: React.FC<Props> = ({ navigation }) => (
  <ScreenWrapper padded={false}>
    <Header title="AI Insights" onBack={() => navigation.goBack()} rightIcon="sparkles-outline" />
    <View style={styles.subtitle}>
      <Text style={styles.subtitleText}>Here's what AI noticed about your business</Text>
    </View>
    <FlatList
      data={mockInsights}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <InsightCard insight={item} />}
    />
  </ScreenWrapper>
);

const styles = StyleSheet.create({
  subtitle: { paddingHorizontal: layout.screenPadding, paddingBottom: 12 },
  subtitleText: { fontSize: 14, color: colors.textSecondary },
  list: { paddingHorizontal: layout.screenPadding, paddingBottom: 100 },
  card: { marginBottom: 12 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  message: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 14, fontWeight: '600' },
});
