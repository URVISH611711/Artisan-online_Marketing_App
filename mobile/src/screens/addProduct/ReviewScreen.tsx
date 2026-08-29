import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AddProductStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { publishStudioProduct } from '../../services/api';

type Props = NativeStackScreenProps<AddProductStackParamList, 'Review'>;

const CheckItem: React.FC<{ label: string; done?: boolean }> = ({ label, done = true }) => (
  <View style={styles.checkRow}>
    <View style={[styles.checkIcon, done ? styles.checkDone : styles.checkPending]}>
      {done && <Ionicons name="checkmark" size={14} color="#fff" />}
    </View>
    <Text style={[styles.checkLabel, !done && styles.checkLabelPending]}>{label}</Text>
  </View>
);

export const ReviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId, enhancedUrls, productDetails } = route.params;
  const insets = useSafeAreaInsets();
  
  const [publishing, setPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePublish = async () => {
    if (publishing) return;
    setPublishing(true);
    setErrorMessage('');
    
    try {
      const res = await publishStudioProduct(jobId, productDetails);
      if (res.success && res.product_id) {
        navigation.navigate('Success', { productId: res.product_id });
      } else {
        throw new Error(res.message || 'Failed to publish product');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Network error');
      setPublishing(false);
    }
  };

  const previewImage = enhancedUrls.length > 0 ? enhancedUrls[0] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Publish</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 150 + insets.bottom }]}>
        {/* Thumbnail */}
        <Card padding="none" style={styles.imageCard}>
          {previewImage ? (
            <Image source={{ uri: previewImage }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={48} color={colors.textTertiary} />
            </View>
          )}
          <View style={styles.imageOverlay}>
            <Text style={styles.productName}>{productDetails.name}</Text>
            {productDetails.price && (
              <Text style={styles.productPrice}>₹{parseFloat(productDetails.price).toLocaleString('en-IN')}</Text>
            )}
          </View>
        </Card>

        {/* Ready checklist */}
        <Text style={styles.readyLabel}>Ready to publish</Text>
        <Card padding="md" style={styles.checklistCard}>
          <CheckItem label="Professional photos created" />
          <CheckItem label="Product details complete" />
          <CheckItem label="Background style applied" />
          <CheckItem label="Price configured" done={!!productDetails.price} />
        </Card>
        
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          title="Publish Product"
          onPress={handlePublish}
          loading={publishing}
          disabled={publishing}
          rightIcon={<Ionicons name="arrow-up-circle-outline" size={20} color={colors.surface} />}
        />
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="outline"
          disabled={publishing}
          style={{ marginTop: 10 }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border
  },
  backBtn: { padding: 8 },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  scroll: { paddingHorizontal: layout.screenPadding, paddingTop: 16 },
  
  imageCard: { marginBottom: 24, overflow: 'hidden', borderRadius: 16 },
  productImage: { width: '100%', height: 260 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  imageOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', padding: 16,
  },
  productName: { ...typography.h4, color: '#fff', marginBottom: 4 },
  productPrice: { ...typography.h3, fontWeight: '800', color: '#fff' },
  
  readyLabel: { ...typography.h4, color: colors.textPrimary, marginBottom: 12 },
  checklistCard: { marginBottom: 16 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  checkIcon: { 
    width: 24, height: 24, borderRadius: 12, 
    alignItems: 'center', justifyContent: 'center', marginRight: 12 
  },
  checkDone: { backgroundColor: colors.success },
  checkPending: { backgroundColor: colors.border },
  checkLabel: { ...typography.body1, color: colors.textPrimary, fontWeight: '500' },
  checkLabelPending: { color: colors.textSecondary },
  
  errorContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF5F5', padding: 12, borderRadius: 8,
    marginTop: 8,
  },
  errorText: { ...typography.body2, color: colors.warning, flex: 1 },
  
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: layout.screenPadding, 
    paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border
  },
});
