import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OrdersStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { mockBulkOrders } from '../../services/mock/mockData';

type Props = {
  navigation: NativeStackNavigationProp<OrdersStackParamList, 'CounterOffer'>;
  route: RouteProp<OrdersStackParamList, 'CounterOffer'>;
};

export const CounterOfferScreen: React.FC<Props> = ({ navigation, route }) => {
  const bulk = mockBulkOrders.find((b) => b.id === route.params.bulkOrderId) || mockBulkOrders[0];
  const [qty, setQty] = useState(String(bulk.quantity));
  const [price, setPrice] = useState(String(bulk.pricePerUnit));
  const [delivery, setDelivery] = useState(String(bulk.deliveryDays));
  const [notes, setNotes] = useState('');

  const total = Number(qty) * Number(price);

  return (
    <ScreenWrapper padded={false}>
      <Header title="Send Counter Offer" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Original offer */}
        <Card padding="md" style={styles.originalCard}>
          <Text style={styles.sectionLabel}>Buyer's Original Offer</Text>
          <Text style={styles.originalText}>Qty: {bulk.quantity} units @ ₹{bulk.pricePerUnit}/unit — Delivery: {bulk.deliveryDays} days</Text>
        </Card>

        <Text style={styles.sectionTitle}>Your Counter Offer</Text>
        <Input label="Quantity (units)" value={qty} onChangeText={setQty} keyboardType="numeric" />
        <Input label="Price per unit (₹)" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <Input label="Delivery time (days)" value={delivery} onChangeText={setDelivery} keyboardType="numeric" />
        <Input label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="e.g. Minimum order 200 units for this price" multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />

        {/* Total */}
        <Card variant="success" padding="md" style={styles.totalCard}>
          <Text style={styles.totalLabel}>Your Total Value</Text>
          <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
        </Card>

        <Button title="Send Counter Offer" onPress={() => navigation.goBack()} />
        <Button title="Cancel" onPress={() => navigation.goBack()} variant="ghost" style={{ marginTop: 10 }} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 40, paddingTop: 8 },
  originalCard: { marginBottom: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: colors.borderLight },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8 },
  originalText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  totalCard: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '600', color: colors.success },
  totalValue: { fontSize: 22, fontWeight: '800', color: colors.success },
});
