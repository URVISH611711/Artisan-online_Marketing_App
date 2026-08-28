import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AddProductStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useDraftStore } from '../../store/useDraftStore';
import { Ionicons } from '@expo/vector-icons';

type Props = { navigation: NativeStackNavigationProp<AddProductStackParamList, 'Catalog'> };

export const CatalogScreen: React.FC<Props> = ({ navigation }) => {
  const { draft, updateDraft } = useDraftStore();
  const [productName, setProductName] = useState(draft?.name || 'Handcrafted Patola Silk Saree');
  const [description, setDescription] = useState(draft?.description || 'Exquisite handwoven Patola silk saree crafted by skilled artisans in Gujarat using the traditional double ikat technique.');
  const [activeTab, setActiveTab] = useState<'en' | 'hi'>('en');
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);

  const handleContinue = () => {
    updateDraft({ name: productName, description, step: 'pricing' });
    navigation.navigate('Pricing');
  };

  const keywords = draft?.keywords || ['Patola', 'Handmade', 'Silk', 'Gujarati Craft', 'Traditional', 'Wedding'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Catalog</Text>
        <TouchableOpacity style={styles.regenerateBtn}>
          <Ionicons name="refresh-outline" size={18} color={colors.primary} />
          <Text style={styles.regenerateText}>Regenerate</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Language tabs */}
        <View style={styles.langTabs}>
          {(['en', 'hi'] as const).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.langTab, activeTab === lang && styles.langTabActive]}
              onPress={() => setActiveTab(lang)}
            >
              <Text style={[styles.langTabText, activeTab === lang && styles.langTabTextActive]}>
                {lang === 'en' ? '🇬🇧 English' : '🇮🇳 हिंदी'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI badge */}
        <View style={styles.aiLabel}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
          <Text style={styles.aiLabelText}>AI generated — Please review</Text>
        </View>

        {/* Product Name */}
        <Text style={styles.fieldLabel}>Product Name</Text>
        <Card padding="md" style={styles.editCard}>
          {editingName ? (
            <TextInput
              style={styles.editInput}
              value={productName}
              onChangeText={setProductName}
              autoFocus
              onBlur={() => setEditingName(false)}
              multiline
            />
          ) : (
            <TouchableOpacity onPress={() => setEditingName(true)}>
              <Text style={styles.editCardText}>{productName}</Text>
              <Ionicons name="pencil-outline" size={16} color={colors.textTertiary} style={styles.editIcon} />
            </TouchableOpacity>
          )}
        </Card>

        {/* Description */}
        <Text style={styles.fieldLabel}>Description</Text>
        <Card padding="md" style={styles.editCard}>
          {editingDesc ? (
            <TextInput
              style={[styles.editInput, { minHeight: 100 }]}
              value={description}
              onChangeText={setDescription}
              autoFocus
              onBlur={() => setEditingDesc(false)}
              multiline
            />
          ) : (
            <TouchableOpacity onPress={() => setEditingDesc(true)}>
              <Text style={styles.editCardText}>{description}</Text>
              <Ionicons name="pencil-outline" size={16} color={colors.textTertiary} style={styles.editIcon} />
            </TouchableOpacity>
          )}
        </Card>

        {/* Keywords */}
        <Text style={styles.fieldLabel}>Keywords</Text>
        <View style={styles.keywordsRow}>
          {keywords.map((kw) => (
            <View key={kw} style={styles.keyword}>
              <Text style={styles.keywordText}>{kw}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Looks good — Continue" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  regenerateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  regenerateText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 20 },
  langTabs: {
    flexDirection: 'row', backgroundColor: colors.borderLight,
    borderRadius: 10, padding: 3, marginBottom: 16,
  },
  langTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  langTabActive: { backgroundColor: colors.surface },
  langTabText: { fontSize: 14, color: colors.textSecondary },
  langTabTextActive: { color: colors.primary, fontWeight: '700' },
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  aiLabelText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  editCard: { marginBottom: 16, position: 'relative' },
  editCardText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22, paddingRight: 24 },
  editIcon: { position: 'absolute', right: 0, top: 0 },
  editInput: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keyword: {
    backgroundColor: '#EBF5FF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  keywordText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 28 },
});
