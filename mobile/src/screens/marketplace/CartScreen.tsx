import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { useCart } from '../../context/CartContext';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';

export const CartScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <ScreenWrapper padded={false}>
        <Header title="Your Cart" onBack={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Looks like you haven't added anything yet.</Text>
          <Button title="Continue Shopping" onPress={() => navigation.goBack()} style={{ marginTop: 24 }} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper padded={false}>
      <Header title="Your Cart" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {cart.map((item) => (
          <View key={item.product.id} style={styles.cartItem}>
            <Image source={{ uri: item.product.images?.[0]?.url || 'https://via.placeholder.com/100' }} style={styles.image} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
              <Text style={styles.itemPrice}>₹{item.product.price.toLocaleString('en-IN')}</Text>
              
              <View style={styles.actionsRow}>
                <View style={styles.quantityControl}>
                  <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity - 1)} style={styles.qBtn}>
                    <Ionicons name="remove" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.qText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => {
                        const stock = item.product.inventory?.available_quantity || 0;
                        if (item.quantity < stock) updateQuantity(item.product.id, item.quantity + 1);
                        else Alert.alert('Stock Limit Reached', `Only ${stock} items available`);
                      }} style={styles.qBtn}>
                      <Ionicons name="add" size={20} color={item.quantity >= (item.product.inventory?.available_quantity || 0) ? colors.border : colors.textPrimary} />
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity onPress={() => removeFromCart(item.product.id)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₹{cartTotal.toLocaleString('en-IN')}</Text>
        </View>
        <Button 
          title="Proceed to Checkout" 
          onPress={() => navigation.navigate('Checkout')} 
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: layout.screenPadding },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  scroll: { padding: layout.screenPadding, paddingBottom: 120 },
  cartItem: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  image: { width: 80, height: 80, borderRadius: 8, backgroundColor: colors.borderLight, marginRight: 12 },
  itemDetails: { flex: 1, justifyContent: 'space-between' },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  itemPrice: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 4 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  qBtn: { padding: 4 },
  qText: { paddingHorizontal: 12, fontSize: 15, fontWeight: '600' },
  removeBtn: { padding: 8 },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 28, paddingTop: 16, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 16, color: colors.textSecondary },
  totalAmount: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
});
