import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProductsStackParamList } from '../../navigation/types';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { mockProducts } from '../../services/mock/mockData';

type Props = {
  navigation: NativeStackNavigationProp<ProductsStackParamList, 'EditProduct'>;
  route: RouteProp<ProductsStackParamList, 'EditProduct'>;
};

export const EditProductScreen: React.FC<Props> = ({ navigation, route }) => {
  const product = mockProducts.find((p) => p.id === route.params.productId) || mockProducts[0];
  const [name, setName] = React.useState(product.name);
  const [price, setPrice] = React.useState(String(product.price));
  const [quantity, setQuantity] = React.useState(String(product.quantity));
  const [description, setDescription] = React.useState(product.description);

  return (
    <ScreenWrapper padded={false}>
      <Header title="Edit Product" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Input label="Product Name" value={name} onChangeText={setName} />
        <Input label="Price (₹)" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <Input label="Stock Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={5} style={{ height: 120, textAlignVertical: 'top' }} />
        <Button title="Save Changes" onPress={() => navigation.goBack()} style={styles.button} />
        <Button title="Delete Product" onPress={() => {}} variant="danger" style={{ marginTop: 10 }} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPadding, paddingTop: 16, paddingBottom: 40 },
  button: { marginTop: 8 },
});
