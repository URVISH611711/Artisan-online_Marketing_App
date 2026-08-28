import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AddProductStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/layout/Header';
import { ProcessingSteps } from '../../components/layout/ProgressStepper';
import { useDraftStore } from '../../store/useDraftStore';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<AddProductStackParamList, 'AIStudio'>;
  route: RouteProp<AddProductStackParamList, 'AIStudio'>;
};

const BG_OPTIONS = ['Original', 'White', 'Studio', 'Transparent'];

const ENHANCE_STEPS = [
  { label: 'Background removed', status: 'completed' as const },
  { label: 'Lighting corrected', status: 'completed' as const },
  { label: 'Perspective corrected', status: 'completed' as const },
  { label: 'Sharpness improved', status: 'completed' as const },
  { label: 'E-commerce crop applied', status: 'completed' as const },
];

export const AIStudioScreen: React.FC<Props> = ({ navigation, route }) => {
  const { imageUri } = route.params;
  const [view, setView] = useState<'original' | 'enhanced'>('original');
  const [selectedBg, setSelectedBg] = useState('White');
  const [enhanced, setEnhanced] = useState(false);
  const { updateDraft } = useDraftStore();

  useEffect(() => {
    // Simulate AI enhancement
    const t = setTimeout(() => {
      setEnhanced(true);
      setView('enhanced');
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  const handleUsePhoto = () => {
    updateDraft({ enhancedImage: imageUri, step: 'voice' });
    navigation.navigate('Voice');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="AI Product Studio"
        onBack={() => navigation.goBack()}
        rightIcon="sparkles-outline"
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Toggle Original / Enhanced */}
        <View style={styles.toggleRow}>
          {(['original', 'enhanced'] as const).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.toggleBtn, view === v && styles.toggleActive]}
              onPress={() => setView(v)}
            >
              <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.productImage}
            resizeMode="contain"
          />
          {enhanced && view === 'enhanced' && (
            <View style={styles.enhancedBadge}>
              <Ionicons name="sparkles" size={14} color={colors.success} />
              <Text style={styles.enhancedBadgeText}>AI Enhanced</Text>
            </View>
          )}
        </View>

        {/* Enhancement steps */}
        {enhanced && (
          <View style={styles.stepsCard}>
            <ProcessingSteps steps={ENHANCE_STEPS} />
          </View>
        )}

        {/* Background options */}
        <Text style={styles.sectionTitle}>Background</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.bgRow}>
            {BG_OPTIONS.map((bg) => (
              <TouchableOpacity
                key={bg}
                style={[styles.bgOption, selectedBg === bg && styles.bgSelected]}
                onPress={() => setSelectedBg(bg)}
              >
                <View style={[styles.bgSwatch, { backgroundColor: bg === 'White' ? '#fff' : bg === 'Original' ? '#E5E7EB' : bg === 'Studio' ? '#F3F4F6' : 'transparent' }]} />
                <Text style={[styles.bgLabel, selectedBg === bg && styles.bgLabelSelected]}>{bg}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Use This Photo" onPress={handleUsePhoto} />
        <Button title="Retake Photo" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: 10 }} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 20 },
  toggleRow: {
    flexDirection: 'row', backgroundColor: colors.borderLight,
    borderRadius: 10, padding: 3, marginBottom: 16,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.surface },
  toggleText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  toggleTextActive: { color: colors.primary, fontWeight: '700' },
  imageContainer: {
    borderRadius: 16, overflow: 'hidden', marginBottom: 16,
    aspectRatio: 1, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  productImage: { width: '90%', height: '90%' },
  enhancedBadge: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.successLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  enhancedBadgeText: { fontSize: 13, color: colors.success, fontWeight: '600' },
  stepsCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  bgRow: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
  bgOption: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6 },
  bgSelected: {},
  bgSwatch: {
    width: 56, height: 56, borderRadius: 12,
    borderWidth: 2, borderColor: colors.border, marginBottom: 6,
  },
  bgLabel: { fontSize: 12, color: colors.textSecondary },
  bgLabelSelected: { color: colors.primary, fontWeight: '600' },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 28, paddingTop: 8 },
});
