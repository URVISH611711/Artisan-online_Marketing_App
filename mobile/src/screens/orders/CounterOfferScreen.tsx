import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OrdersStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<OrdersStackParamList, 'CounterOffer'>;
  route: RouteProp<OrdersStackParamList, 'CounterOffer'>;
};

export const CounterOfferScreen: React.FC<Props> = ({ navigation, route }) => {
  return (
    <ScreenWrapper padded={false}>
      <Header title="Counter Offer" onBack={() => navigation.goBack()} />
      <View style={styles.emptyContainer}>
        <Ionicons name="swap-horizontal-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.emptyTitle}>Counter Offer</Text>
        <Text style={styles.emptyMessage}>
          Counter offer functionality will be available when you have active bulk order requests.
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
