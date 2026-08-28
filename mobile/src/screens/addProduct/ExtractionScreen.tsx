import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AddProductStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useDraftStore } from '../../store/useDraftStore';
import { Ionicons } from '@expo/vector-icons';

type Props = { navigation: NativeStackNavigationProp<AddProductStackParamList, 'Extraction'> };

// Mock extracted data from AI
const MOCK_EXTRACTED = {
  material: 'Silk',
  craftType: 'Patola Weaving',
  origin: 'Gujarat, India',
  productionTime: '10 days',
  techniques: ['Double Ikat', 'Handloom'],
  colors: ['Royal Blue', 'Gold', 'Red'],
  occasion: 'Wedding, Festival',
  careInstructions: 'Dry clean only',
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export const ExtractionScreen: React.FC<Props> = ({ navigation }) => {
  const { draft, updateDraft } = useDraftStore();

  const handleContinue = () => {
    updateDraft({
      material: MOCK_EXTRACTED.material,
      craftType: MOCK_EXTRACTED.craftType,
      origin: MOCK_EXTRACTED.origin,
      productionTime: MOCK_EXTRACTED.productionTime,
      step: 'processing',
    });
    navigation.navigate('Processing');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>We understood</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Transcript box */}
        {draft?.transcript && (
          <View style={styles.transcriptBox}>
            <View style={styles.transcriptHeader}>
              <Ionicons name="mic" size={14} color={colors.textSecondary} />
              <Text style={styles.transcriptLabel}>What you said ({draft.transcriptLanguage?.toUpperCase()})</Text>
            </View>
            <Text style={styles.transcriptText}>{draft.transcript}</Text>
          </View>
        )}

        {/* AI Extracted */}
        <View style={styles.aiLabel}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
          <Text style={styles.aiLabelText}>AI generated — Please review</Text>
        </View>

        <Card padding="md" style={styles.card}>
          <DetailRow label="Material" value={MOCK_EXTRACTED.material} />
          <DetailRow label="Craft Type" value={MOCK_EXTRACTED.craftType} />
          <DetailRow label="Origin" value={MOCK_EXTRACTED.origin} />
          <DetailRow label="Production Time" value={MOCK_EXTRACTED.productionTime} />
          <DetailRow label="Occasion" value={MOCK_EXTRACTED.occasion} />
        </Card>

        <Text style={styles.tagLabel}>Techniques</Text>
        <View style={styles.tagRow}>
          {MOCK_EXTRACTED.techniques.map((t) => (
            <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
          ))}
        </View>

        <Text style={styles.tagLabel}>Colors</Text>
        <View style={styles.tagRow}>
          {MOCK_EXTRACTED.colors.map((c) => (
            <View key={c} style={styles.tag}><Text style={styles.tagText}>{c}</Text></View>
          ))}
        </View>

        <TouchableOpacity style={styles.addMoreBtn}>
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.addMoreText}>Add more details</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Looks good — Continue" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  topTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 20 },
  transcriptBox: {
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  transcriptHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  transcriptLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  transcriptText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  aiLabelText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  card: { marginBottom: 16 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  detailLabel: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  detailValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 1, textAlign: 'right' },
  tagLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: {
    backgroundColor: '#EBF5FF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  tagText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 12 },
  addMoreText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 28 },
});
