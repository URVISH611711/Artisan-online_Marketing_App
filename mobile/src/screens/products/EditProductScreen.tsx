import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProductsStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { fetchProduct, updateProduct, deleteProduct } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<ProductsStackParamList, 'EditProduct'>;
  route: RouteProp<ProductsStackParamList, 'EditProduct'>;
};

export const EditProductScreen: React.FC<Props> = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProduct(route.params.productId)
      .then((p) => {
        setName(p.name);
        setPrice(String(p.price));
        setQuantity(String(p.inventory?.available_quantity ?? 0));
        setDescription(p.description);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [route.params.productId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProduct(route.params.productId, {
        name,
        price: parseFloat(price),
        description,
        quantity: parseInt(quantity, 10),
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteProduct(route.params.productId);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenWrapper padded={false}>
        <Header title="Edit Product" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper padded={false}>
      <Header title="Edit Product" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Input label="Product Name" value={name} onChangeText={setName} />
        <Input label="Price (₹)" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <Input label="Stock Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={5} style={{ height: 120, textAlignVertical: 'top' }} />
        <Button title={saving ? "Saving..." : "Save Changes"} onPress={handleSave} style={styles.button} disabled={saving} />
        <Button title="Delete Product" onPress={handleDelete} variant="danger" style={{ marginTop: 10 }} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPadding, paddingTop: 16, paddingBottom: 40 },
  button: { marginTop: 8 },
});
