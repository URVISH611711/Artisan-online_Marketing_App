import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { useCart } from '../../context/CartContext';
import { checkoutCart } from '../../services/api';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';

export const CheckoutScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { cart, cartTotal, clearCart } = useCart();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (loading) return; // Prevent double taps during React re-render cycle
    if (!address.trim()) {
      Alert.alert('Required', 'Please enter a shipping address');
      return;
    }

    try {
      setLoading(true);
      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));
      
      await checkoutCart({ items, shipping_address: address });
      clearCart();
      
      Alert.alert('Success', 'Your order has been placed!', [
        { text: 'OK', onPress: () => navigation.navigate('ProductsList') }
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper padded={false}>
      <Header title="Checkout" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryCard}>
          {cart.map(item => (
            <View key={item.product.id} style={styles.summaryItem}>
              <Text style={styles.summaryItemName} numberOfLines={1}>{item.quantity}x {item.product.name}</Text>
              <Text style={styles.summaryItemPrice}>₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryTotal}>
            <Text style={styles.totalLabel}>Total to pay</Text>
            <Text style={styles.totalAmount}>₹{cartTotal.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Shipping Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter full shipping address..."
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title={`Pay ₹${cartTotal.toLocaleString('en-IN')}`} 
          onPress={handleCheckout} 
          loading={loading}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: layout.screenPadding, paddingBottom: 120 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, marginTop: 8 },
  summaryCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryItemName: { flex: 1, fontSize: 15, color: colors.textSecondary, marginRight: 16 },
  summaryItemPrice: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  summaryTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  totalAmount: { fontSize: 18, fontWeight: '800', color: colors.primary },
  input: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, fontSize: 15, color: colors.textPrimary, minHeight: 100 },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 28, paddingTop: 16, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
});
