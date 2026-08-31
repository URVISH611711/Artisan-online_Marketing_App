import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { AddProductStackParamList } from '../../navigation/types';
import { Button, Input } from '../../components/ui';
import { Header } from '../../components/layout/Header';
import { useDraftStore } from '../../store/useDraftStore';
import { autoDescribeProduct } from '../../services/api';

type Props = NativeStackScreenProps<AddProductStackParamList, 'ProductDetails'>;

export const ProductDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { imageUris } = route.params;
  const updateDraft = useDraftStore((state) => state.updateDraft);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('');
  const [craftType, setCraftType] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const handleAutoFill = async () => {
    if (!imageUris || imageUris.length === 0) return;
    setIsAutoFilling(true);
    try {
      const data = await autoDescribeProduct(imageUris[0]);
      if (data) {
        if (data.name) setName(data.name);
        if (data.description) setDescription(data.description);
        if (data.material) setMaterial(data.material);
        if (data.color) setColor(data.color);
        if (data.craft_type) setCraftType(data.craft_type);
      }
    } catch (e) {
      console.error("Auto-fill failed", e);
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleNext = () => {
    if (!name.trim()) return; // Validation: name required
    
    const details = {
      name,
      description,
      material,
      color,
      price: price ? parseFloat(price) : undefined,
      craftType,
    };
    
    updateDraft({
      ...details,
      imageUris,
    });
    
    navigation.navigate('BackgroundMode', {
      imageUris,
      productDetails: { ...details, price: price.toString() }, // Stringify for navigation param
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Product Details" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {imageUris.length > 0 && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUris[0] }} style={styles.imagePreview} />
              {imageUris.length > 1 && (
                <View style={styles.imageCountBadge}>
                  <Text style={styles.imageCountText}>+{imageUris.length - 1}</Text>
                </View>
              )}
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Basic Info</Text>
            <Button 
              title="✨ Auto-fill with AI" 
              variant="secondary" 
              size="sm" 
              fullWidth={false}
              onPress={handleAutoFill}
              loading={isAutoFilling}
              disabled={isAutoFilling}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Input
              label="Product Name *"
              placeholder="e.g., Handwoven Silk Saree"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            
            <Input
              label="Description"
              placeholder="Describe your product..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
            />
            
            <Input
              label="Price (₹)"
              placeholder="e.g., 2500"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.sectionTitle}>Materials & Craft</Text>
          
          <View style={styles.formGroup}>
            <Input
              label="Material"
              placeholder="e.g., Pure Silk, Terracotta"
              value={material}
              onChangeText={setMaterial}
            />
            
            <Input
              label="Color"
              placeholder="e.g., Crimson Red, Earthy Brown"
              value={color}
              onChangeText={setColor}
            />
            
            <Input
              label="Craft Type"
              placeholder="e.g., Block Print, Pottery"
              value={craftType}
              onChangeText={setCraftType}
            />
          </View>
          
          <View style={styles.footerSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title="Next: Choose Background"
          onPress={handleNext}
          disabled={!name.trim()}
          fullWidth
          icon="arrow-forward-outline"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.styles.heading,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  imagePreviewContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 24,
    position: 'relative',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: colors.background,
  },
  imageCountText: {
    ...typography.styles.caption,
    fontWeight: 'bold',
    color: colors.surface,
  },
  sectionTitle: {
    ...typography.styles.title,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  formGroup: {
    gap: 16,
    marginBottom: 32,
  },
  footerSpacing: {
    height: 40,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
