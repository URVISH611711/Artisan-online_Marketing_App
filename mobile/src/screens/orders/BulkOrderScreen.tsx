import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OrdersStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<OrdersStackParamList, 'BulkOrder'>;
  route: RouteProp<OrdersStackParamList, 'BulkOrder'>;
};

export const BulkOrderScreen: React.FC<Props> = ({ navigation, route }) => {
  // Bulk orders are not yet implemented in the backend — show placeholder
  return (
    <ScreenWrapper padded={false}>
      <Header title="Bulk Order Request" onBack={() => navigation.goBack()} />
      <View style={styles.emptyContainer}>
        <Ionicons name="business-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.emptyTitle}>No Bulk Order Data</Text>
        <Text style={styles.emptyMessage}>
          Bulk order requests will appear here when buyers submit them.
        </Text>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptyMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
