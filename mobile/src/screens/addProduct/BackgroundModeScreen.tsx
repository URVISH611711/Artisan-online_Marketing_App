import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { AddProductStackParamList } from '../../navigation/types';
import { Button, Input } from '../../components/ui';
import { useDraftStore } from '../../store/useDraftStore';

type Props = NativeStackScreenProps<AddProductStackParamList, 'BackgroundMode'>;

const BACKGROUND_MODES = [
  { id: 'CLEAN_WHITE', name: 'Clean White', desc: 'Studio white background with contact shadow', icon: 'square-outline' },
  { id: 'STUDIO_GREY', name: 'Studio Grey', desc: 'Professional seamless grey gradient', icon: 'color-palette-outline' },
  { id: 'NATURAL_LIGHT', name: 'Natural Light', desc: 'Window light on light wood surface', icon: 'sunny-outline' },
  { id: 'LIFESTYLE', name: 'Lifestyle', desc: 'Cozy home interior setting', icon: 'home-outline' },
  { id: 'OUTDOOR', name: 'Outdoor', desc: 'Natural outdoor dappled sunlight', icon: 'leaf-outline' },
  { id: 'FESTIVE', name: 'Festive', desc: 'Traditional Indian festive decor', icon: 'sparkles-outline' },
  { id: 'CUSTOM', name: 'Custom', desc: 'Write your own background prompt', icon: 'create-outline' },
];

export const BackgroundModeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { imageUris, productDetails } = route.params;
  const updateDraft = useDraftStore((state) => state.updateDraft);
  
  const [selectedMode, setSelectedMode] = useState('CLEAN_WHITE');
  const [customPrompt, setCustomPrompt] = useState('');

  const handleNext = () => {
    updateDraft({
      backgroundMode: selectedMode,
      customPrompt: selectedMode === 'CUSTOM' ? customPrompt : undefined,
    });
    
    navigation.navigate('AIStudio', {
      imageUris,
      productDetails,
      backgroundMode: selectedMode,
      customPrompt: selectedMode === 'CUSTOM' ? customPrompt : undefined,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button 
          variant="ghost" 
          size="sm" 
          onPress={() => navigation.goBack()}
          leftIcon={<Ionicons name="arrow-back" size={24} color={colors.textPrimary} />}
        />
        <Text style={styles.headerTitle}>Background</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Choose how you want your product to be presented.
        </Text>
        
        <View style={styles.grid}>
          {BACKGROUND_MODES.map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <TouchableOpacity
                key={mode.id}
                style={[styles.modeCard, isSelected && styles.modeCardSelected]}
                onPress={() => setSelectedMode(mode.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                  <Ionicons 
                    name={mode.icon as any} 
                    size={24} 
                    color={isSelected ? colors.primary : colors.textSecondary} 
                  />
                </View>
                <Text style={[styles.modeName, isSelected && styles.modeNameSelected]}>{mode.name}</Text>
                <Text style={styles.modeDesc}>{mode.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedMode === 'CUSTOM' && (
          <View style={styles.customPromptContainer}>
            <Input
              label="Custom Background Prompt"
              placeholder="e.g., sitting on a marble countertop next to a vase of yellow roses"
              value={customPrompt}
              onChangeText={setCustomPrompt}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
            />
          </View>
        )}
        
        <View style={styles.footerSpacing} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Enhance Images"
          onPress={handleNext}
          disabled={selectedMode === 'CUSTOM' && !customPrompt.trim()}
          fullWidth
          rightIcon={<Ionicons name="color-wand" size={20} color={colors.surface} />}
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
    ...typography.h3,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  modeCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  modeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10', // 10% opacity
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: colors.surface,
  },
  modeName: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modeNameSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  modeDesc: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  customPromptContainer: {
    marginTop: 24,
  },
  footerSpacing: {
    height: 40,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
