import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { AddProductStackParamList } from '../../navigation/types';
import { Button, Input } from '../../components/ui';
import { Header } from '../../components/layout/Header';
import { useDraftStore } from '../../store/useDraftStore';
import { autoFillBackgroundDetails } from '../../services/api';

type Props = NativeStackScreenProps<AddProductStackParamList, 'BackgroundMode'>;

const BACKGROUND_MODES = [
  { id: 'CLEAN_WHITE', name: 'Clean White', desc: 'Studio white background with contact shadow', icon: 'square-outline' },
  { id: 'STUDIO_GREY', name: 'Studio Grey', desc: 'Professional seamless grey gradient', icon: 'color-palette-outline' },
  { id: 'NATURAL_LIGHT', name: 'Natural Light', desc: 'Window light on light wood surface', icon: 'sunny-outline' },
  { id: 'LIFESTYLE', name: 'Lifestyle', desc: 'Cozy home interior setting', icon: 'home-outline' },
  { id: 'OUTDOOR', name: 'Outdoor', desc: 'Natural outdoor dappled sunlight', icon: 'leaf-outline' },
  { id: 'FESTIVE', name: 'Festive', desc: 'Traditional Indian festive decor', icon: 'sparkles-outline' },
  { id: 'CUSTOM', name: 'Custom Studio', desc: 'Auto-fill or customize background details', icon: 'create-outline' },
];

export const BackgroundModeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { imageUris, productDetails } = route.params;
  const updateDraft = useDraftStore((state) => state.updateDraft);
  
  const [selectedMode, setSelectedMode] = useState('CLEAN_WHITE');
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Background Customization Form state
  const [bgStyle, setBgStyle] = useState('Premium Artisan Studio');
  const [environment, setEnvironment] = useState('Warm handcrafted studio setting');
  const [surface, setSurface] = useState('Natural light wooden tabletop');
  const [colorPalette, setColorPalette] = useState('Warm beige, soft cream');
  const [lighting, setLighting] = useState('Soft natural window lighting');
  const [shadow, setShadow] = useState('Realistic soft contact shadow');
  const [mood, setMood] = useState('Premium, authentic, handcrafted');
  const [composition, setComposition] = useState('Minimal commercial product photography');
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  const handleAutoFillBackground = async () => {
    if (!imageUris || imageUris.length === 0) {
      Alert.alert("Notice", "Please select a product photo first.");
      return;
    }
    try {
      setIsAutoFilling(true);
      const res: any = await autoFillBackgroundDetails(imageUris[0], productDetails);
      if (res && res.success && res.background_details) {
        const bg = res.background_details;
        if (bg.style) setBgStyle(bg.style);
        if (bg.environment) setEnvironment(bg.environment);
        if (bg.surface) setSurface(bg.surface);
        if (bg.color_palette) {
          setColorPalette(Array.isArray(bg.color_palette) ? bg.color_palette.join(', ') : bg.color_palette);
        }
        if (bg.lighting) setLighting(bg.lighting);
        if (bg.shadow) setShadow(bg.shadow);
        if (bg.mood) setMood(bg.mood);
        if (bg.composition) setComposition(bg.composition);
        setSelectedMode('CUSTOM');
        Alert.alert("Success", "Background details auto-filled using NVIDIA AI! You can edit any field before generating.");
      } else {
        throw new Error(res?.error || "Could not analyze product background");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Notice", "Using standard default background details.");
    } finally {
      setIsAutoFilling(false);
    }
  };

  const compiledCustomPrompt = `Create a photorealistic ${bgStyle} product photography environment. Place the existing product naturally on a clean ${surface} inside a ${environment}. Use a ${colorPalette} color palette, gentle ${lighting}, ${shadow} directly beneath the product, ${mood} atmosphere, ${composition}.${additionalInstructions.trim() ? ` ${additionalInstructions.trim()}` : ''}`;

  const handleNext = () => {
    const finalPrompt = selectedMode === 'CLEAN_WHITE' ? undefined : compiledCustomPrompt;
    updateDraft({
      backgroundMode: selectedMode,
      customPrompt: finalPrompt,
    });
    
    navigation.navigate('AIStudio', {
      imageUris,
      productDetails,
      backgroundMode: selectedMode,
      customPrompt: finalPrompt,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Choose Background Mode" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Select a preset studio theme or customize your background details.
        </Text>

        {/* Auto-fill Button */}
        <View style={styles.autoFillHeader}>
          <Button
            title={isAutoFilling ? "Analyzing product..." : "✨ Auto-Fill Background Details"}
            variant="secondary"
            size="md"
            onPress={handleAutoFillBackground}
            loading={isAutoFilling}
            disabled={isAutoFilling}
            fullWidth
          />
        </View>

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

        {/* Customization Form */}
        <View style={styles.customSection}>
          <Text style={styles.sectionHeading}>Background Customization</Text>
          
          <Input
            label="Background Style"
            placeholder="e.g. Premium Artisan Studio"
            value={bgStyle}
            onChangeText={setBgStyle}
            style={styles.inputSpacing}
          />
          <Input
            label="Environment"
            placeholder="e.g. Warm handcrafted studio setting"
            value={environment}
            onChangeText={setEnvironment}
            style={styles.inputSpacing}
          />
          <Input
            label="Surface"
            placeholder="e.g. Natural light wooden tabletop"
            value={surface}
            onChangeText={setSurface}
            style={styles.inputSpacing}
          />
          <Input
            label="Color Palette"
            placeholder="e.g. Warm beige, soft cream"
            value={colorPalette}
            onChangeText={setColorPalette}
            style={styles.inputSpacing}
          />
          <Input
            label="Lighting"
            placeholder="e.g. Soft natural window light from left"
            value={lighting}
            onChangeText={setLighting}
            style={styles.inputSpacing}
          />
          <Input
            label="Shadow"
            placeholder="e.g. Realistic soft contact shadow directly beneath"
            value={shadow}
            onChangeText={setShadow}
            style={styles.inputSpacing}
          />
          <Input
            label="Mood"
            placeholder="e.g. Premium, authentic, handcrafted"
            value={mood}
            onChangeText={setMood}
            style={styles.inputSpacing}
          />
          <Input
            label="Composition"
            placeholder="e.g. Minimal commercial product photography"
            value={composition}
            onChangeText={setComposition}
            style={styles.inputSpacing}
          />
          <Input
            label="Additional Instructions"
            placeholder="e.g. Add subtle flower petals or soft linen cloth on the side"
            value={additionalInstructions}
            onChangeText={setAdditionalInstructions}
            multiline
            numberOfLines={2}
            style={[styles.inputSpacing, { height: 60, textAlignVertical: 'top' }]}
          />
        </View>
        
        <View style={styles.footerSpacing} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Generate Background"
          onPress={handleNext}
          fullWidth
          icon="sparkles-outline"
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
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    ...typography.styles.body,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  autoFillHeader: {
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  modeCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: colors.border,
  },
  modeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainerSelected: {
    backgroundColor: colors.surface,
  },
  modeName: {
    ...typography.styles.title,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  modeNameSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  modeDesc: {
    ...typography.styles.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  customSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  sectionHeading: {
    ...typography.styles.title,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  inputSpacing: {
    marginBottom: 12,
  },
  footerSpacing: {
    height: 40,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
