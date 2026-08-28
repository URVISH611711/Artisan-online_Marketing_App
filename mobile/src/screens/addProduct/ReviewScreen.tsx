import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AddProductStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useDraftStore } from '../../store/useDraftStore';
import { Ionicons } from '@expo/vector-icons';

type Props = { navigation: NativeStackNavigationProp<AddProductStackParamList, 'Review'> };

const CheckItem: React.FC<{ label: string; done?: boolean }> = ({ label, done = true }) => (
  <View style={styles.checkRow}>
    <View style={[styles.checkIcon, done ? styles.checkDone : styles.checkPending]}>
      {done && <Ionicons name="checkmark" size={14} color="#fff" />}
    </View>
    <Text style={[styles.checkLabel, !done && styles.checkLabelPending]}>{label}</Text>
  </View>
);

export const ReviewScreen: React.FC<Props> = ({ navigation }) => {
  const { draft, updateDraft } = useDraftStore();
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setPublishing(false);
    navigation.navigate('Success', { productId: `prod_${Date.now()}` });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Publish</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Thumbnail */}
        <Card padding="none" style={styles.imageCard}>
          {draft?.image ? (
            <Image source={{ uri: draft.image }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={48} color={colors.textTertiary} />
            </View>
          )}
          <View style={styles.imageOverlay}>
            <Text style={styles.productName}>{draft?.name || 'Handcrafted Patola Silk Saree'}</Text>
            <Text style={styles.productPrice}>₹{(draft?.price || 2499).toLocaleString('en-IN')}</Text>
          </View>
        </Card>

        {/* Ready checklist */}
        <Text style={styles.readyLabel}>Ready to publish</Text>
        <Card padding="md" style={styles.checklistCard}>
          <CheckItem label="Professional photo" />
          <CheckItem label="Product information" />
          <CheckItem label="English description" />
          <CheckItem label="हिंदी description" />
          <CheckItem label="Recommended price set" />
        </Card>

        {/* AI disclaimer */}
        <View style={styles.aiDisclaimer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.aiDisclaimerText}>
            Descriptions were AI generated. You reviewed and confirmed them.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Publish Product"
          onPress={handlePublish}
          loading={publishing}
          icon="arrow-up-circle-outline"
          iconPosition="right"
        />
        <Button
          title="Save as Draft"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={{ marginTop: 10 }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 20 },
  imageCard: { marginBottom: 20, overflow: 'hidden', borderRadius: 16 },
  productImage: { width: '100%', height: 200 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.borderLight },
  imageOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', padding: 16,
  },
  productName: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  productPrice: { fontSize: 20, fontWeight: '800', color: '#fff' },
  readyLabel: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  checklistCard: { marginBottom: 16 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  checkIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkDone: { backgroundColor: colors.success },
  checkPending: { backgroundColor: colors.border },
  checkLabel: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  checkLabelPending: { color: colors.textSecondary },
  aiDisclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12,
  },
  aiDisclaimerText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 18 },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 28 },
});
