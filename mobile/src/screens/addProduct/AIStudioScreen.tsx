import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AddProductStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/layout/Header';
import { useDraftStore } from '../../store/useDraftStore';
import { Ionicons } from '@expo/vector-icons';
import { enhanceProductImages, EnhanceOptions, EnhanceResult } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<AddProductStackParamList, 'AIStudio'>;
  route: RouteProp<AddProductStackParamList, 'AIStudio'>;
};

type ScreenState = 'preview' | 'processing' | 'result' | 'error';

const PROCESSING_MESSAGES = [
  'Analyzing product photos...',
  'Understanding product details...',
  'Creating professional composition...',
  'Enhancing product presentation...',
  'Preparing sales-ready images...',
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AIStudioScreen: React.FC<Props> = ({ navigation, route }) => {
  const { imageUris } = route.params;
  const insets = useSafeAreaInsets();
  const { updateDraft } = useDraftStore();

  // ── UI State ─────────────────────────────────────────────────────
  const [screenState, setScreenState] = useState<ScreenState>('preview');
  const [selectedOriginalIdx, setSelectedOriginalIdx] = useState(0);
  const [compareMode, setCompareMode] = useState<'before' | 'after'>('after');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsgIdx, setProcessingMsgIdx] = useState(0);
  const [result, setResult] = useState<EnhanceResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // ── Enhancement Options ───────────────────────────────────────────
  const [options, setOptions] = useState<EnhanceOptions>({
    clean_background: true,
    improve_lighting: true,
    improve_sharpness: true,
    professional_composition: true,
    create_lifestyle: false,
  });

  const processingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start the cycling processing messages ─────────────────────────
  const startProcessingMessages = () => {
    processingInterval.current = setInterval(() => {
      setProcessingMsgIdx((i) => (i + 1) % PROCESSING_MESSAGES.length);
    }, 3000);
  };

  const stopProcessingMessages = () => {
    if (processingInterval.current) {
      clearInterval(processingInterval.current);
      processingInterval.current = null;
    }
  };

  const [jobId, setJobId] = useState<string | null>(null);

  // ── Handle Enhance button press ───────────────────────────────────
  const handleEnhance = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setScreenState('processing');
    setProcessingMsgIdx(0);

    try {
      // Pass the product details from draft
      const currentDraft = useDraftStore.getState().draft;
      const options: EnhanceOptions = {
        product_name: currentDraft?.name || '',
        material: currentDraft?.material || '',
        color: currentDraft?.color || '',
        craft: currentDraft?.craftType || '',
        style: '', // Can add style later
        background_style: 'Professional Studio',
      };

      const res = await enhanceProductImages(imageUris, options);

      if (res.success && res.job_id) {
        setJobId(res.job_id);
        pollStatus(res.job_id);
      } else {
        setErrorMessage(res.error_message || 'Failed to start processing.');
        setScreenState('error');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
      setScreenState('error');
      setIsProcessing(false);
    }
  }, [isProcessing, imageUris]);

  const pollStatus = async (id: string) => {
    try {
      const { pollJobStatus } = require('../../services/api');
      const statusRes = await pollJobStatus(id);

      if (statusRes.status === 'COMPLETED' && statusRes.result) {
        setResult({
          success: true,
          status: 'COMPLETED',
          job_id: id,
          original_urls: statusRes.result.original_urls,
          enhanced_urls: statusRes.result.enhanced_urls,
          model: 'local_pipeline',
        });
        setScreenState('result');
        setCompareMode('after');
        setIsProcessing(false);

        useDraftStore.getState().updateDraft({
          enhancedImages: statusRes.result.enhanced_urls,
          originalUrls: statusRes.result.original_urls,
          enhancedImage: statusRes.result.enhanced_urls[0],
          image: statusRes.result.enhanced_urls[0],
          step: 'ai_studio',
        });
      } else if (statusRes.status === 'FAILED') {
        setErrorMessage(statusRes.error || 'Processing failed.');
        setScreenState('error');
        setIsProcessing(false);
      } else {
        // Update the processing message based on status
        const stateMap: Record<string, number> = {
          'UPLOADING': 0,
          'ANALYZING': 1,
          'REMOVING_BACKGROUND': 2,
          'CREATING_BACKGROUND': 3,
          'COMPOSITING': 4,
        };
        const idx = stateMap[statusRes.status];
        if (idx !== undefined) setProcessingMsgIdx(idx);
        
        // Poll again after 2 seconds
        setTimeout(() => pollStatus(id), 2000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Polling failed.');
      setScreenState('error');
      setIsProcessing(false);
    }
  };

  // ── Use enhanced photo → proceed to Voice ────────────────────────
  const handleUseEnhanced = () => {
    if (!result) return;
    updateDraft({
      enhancedImages: result.enhanced_urls,
      image: result.enhanced_urls[0],
      enhancedImage: result.enhanced_urls[0],
      step: 'voice',
    });
    navigation.navigate('Voice');
  };

  // ── Use original photos → proceed to Voice ────────────────────────
  const handleUseOriginal = () => {
    updateDraft({
      images: imageUris,
      image: imageUris[0],
      step: 'voice',
    });
    navigation.navigate('Voice');
  };

  // ── Retry after error ─────────────────────────────────────────────
  const handleRetry = () => {
    setErrorMessage('');
    setResult(null);
    setScreenState('preview');
  };

  // ── Render enhancement result chips ──────────────────────────────
  const renderEnhancementChips = () => {
    if (!result?.enhancements) return null;
    const e = result.enhancements;
    const chips: string[] = [];
    if (e.background_cleaned) chips.push('Background cleaned');
    if (e.lighting_adjusted) chips.push('Lighting optimized');
    if (e.composition_optimized) chips.push('Composition improved');
    if (e.sharpness_improved) chips.push('Image clarity enhanced');
    if (e.lifestyle_created) chips.push('Lifestyle context added');

    return chips.map((chip) => (
      <View key={chip} style={styles.chip}>
        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
        <Text style={styles.chipText}>{chip}</Text>
      </View>
    ));
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER: Processing state
  // ═══════════════════════════════════════════════════════════════════
  if (screenState === 'processing') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Header title="AI Product Studio" onBack={() => {}} />
        <View style={styles.processingContainer}>
          {/* Image preview while loading */}
          <View style={styles.processingImageBox}>
            <Image
              source={{ uri: imageUris[selectedOriginalIdx] }}
              style={styles.processingImage}
              resizeMode="contain"
            />
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          </View>

          <View style={styles.processingInfo}>
            <Ionicons name="sparkles" size={32} color={colors.primary} />
            <Text style={styles.processingTitle}>Creating professional photos...</Text>
            <Text style={styles.processingMsg}>{PROCESSING_MESSAGES[processingMsgIdx]}</Text>
            <Text style={styles.processingNote}>
              This usually takes 20–40 seconds
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER: Error state
  // ═══════════════════════════════════════════════════════════════════
  if (screenState === 'error') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Header title="AI Product Studio" onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.warning} />
          <Text style={styles.errorTitle}>Unable to enhance photos</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button title="Try Again" onPress={handleRetry} />
            <Button
              title="Use Original Photos"
              onPress={handleUseOriginal}
              variant="outline"
              style={{ marginTop: 8 }}
            />
            <Button
              title="Retake Photos"
              onPress={() => navigation.goBack()}
              variant="ghost"
              style={{ marginTop: 4 }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER: Result state
  // ═══════════════════════════════════════════════════════════════════
  if (screenState === 'result' && result) {
    const displayUri =
      compareMode === 'after'
        ? result.enhanced_urls[0]
        : imageUris[selectedOriginalIdx];

    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Header title="AI Product Studio" onBack={() => setScreenState('preview')} />

        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 180 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Success badge */}
          <View style={styles.successBadgeRow}>
            <Ionicons name="sparkles" size={16} color={colors.success} />
            <Text style={styles.successBadgeText}>Professional Photos Ready</Text>
          </View>

          {/* Before / After toggle */}
          <View style={styles.toggleRow}>
            {(['before', 'after'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.toggleBtn, compareMode === mode && styles.toggleActive]}
                onPress={() => setCompareMode(mode)}
              >
                <Text style={[styles.toggleText, compareMode === mode && styles.toggleTextActive]}>
                  {mode === 'before' ? 'Original' : '✨ Enhanced'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Main image display */}
          <View style={styles.resultImageBox}>
            <Image
              source={{ uri: displayUri }}
              style={styles.resultImage}
              resizeMode="contain"
              key={displayUri} // force refresh on URL change
            />
          </View>

          {/* Original thumbnails (for multi-image: shows which original to compare) */}
          {imageUris.length > 1 && compareMode === 'before' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
              {imageUris.map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedOriginalIdx(idx)}
                  style={[
                    styles.thumbBtn,
                    selectedOriginalIdx === idx && styles.thumbBtnActive,
                  ]}
                >
                  <Image source={{ uri }} style={styles.thumbImg} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Enhancement results */}
          <View style={styles.enhancementCard}>
            <Text style={styles.enhancementTitle}>Enhancement Results</Text>
            {renderEnhancementChips()}
            {result.processing_time_seconds && (
              <Text style={styles.processingTimeText}>
                Processed in {result.processing_time_seconds}s using {result.model}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Sticky footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button title="✨ Use Enhanced Photo" onPress={handleUseEnhanced} />
          <Button
            title="Use Original Photos"
            onPress={handleUseOriginal}
            variant="outline"
            style={{ marginTop: 8 }}
          />
          <Button
            title="Retake Photos"
            onPress={() => navigation.goBack()}
            variant="ghost"
            style={{ marginTop: 4 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER: Preview state (default — before enhancement)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header
        title="AI Product Studio"
        onBack={() => navigation.goBack()}
        rightIcon="sparkles-outline"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 200 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected photos count */}
        <Text style={styles.sectionLabel}>
          {imageUris.length} Photo{imageUris.length > 1 ? 's' : ''} Selected
        </Text>

        {/* Main image preview */}
        <View style={styles.previewImageBox}>
          <Image
            source={{ uri: imageUris[selectedOriginalIdx] }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>

        {/* Thumbnail strip for multiple images */}
        {imageUris.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
            {imageUris.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedOriginalIdx(idx)}
                style={[
                  styles.thumbBtn,
                  selectedOriginalIdx === idx && styles.thumbBtnActive,
                ]}
              >
                <Image source={{ uri }} style={styles.thumbImg} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Enhancement options */}
        <Text style={styles.optionsTitle}>Enhancement Options</Text>

        {[
          { key: 'clean_background', label: 'Clean Background', icon: 'image-outline' },
          { key: 'improve_lighting', label: 'Improve Lighting', icon: 'sunny-outline' },
          { key: 'improve_sharpness', label: 'Improve Sharpness', icon: 'eye-outline' },
          { key: 'professional_composition', label: 'Professional Composition', icon: 'crop-outline' },
          { key: 'create_lifestyle', label: 'Create Lifestyle Image', icon: 'home-outline' },
        ].map(({ key, label, icon }) => (
          <View key={key} style={styles.optionRow}>
            <Ionicons name={icon as any} size={20} color={colors.primary} />
            <Text style={styles.optionLabel}>{label}</Text>
            <Switch
              value={options[key as keyof EnhanceOptions]}
              onValueChange={(val) => setOptions((prev) => ({ ...prev, [key]: val }))}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        ))}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            AI will create professional e-commerce photos while preserving your product's authentic details, patterns, and craftsmanship.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          title="✨ Create Professional Photos"
          onPress={handleEnhance}
          loading={isProcessing}
          disabled={isProcessing}
        />
        <Button
          title="Use Original Photos"
          onPress={handleUseOriginal}
          variant="outline"
          style={{ marginTop: 8 }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: layout.screenPadding, paddingTop: 8 },

  // ── Preview ─────────────────────────────
  sectionLabel: {
    fontSize: 13, color: colors.textSecondary, fontWeight: '600',
    marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  previewImageBox: {
    height: 220, width: '100%', borderRadius: 16, overflow: 'hidden',
    backgroundColor: colors.surface, marginBottom: 12,
    borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  previewImage: { width: '95%', height: '95%' },

  thumbRow: { marginBottom: 16 },
  thumbBtn: {
    marginRight: 8, borderRadius: 10, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbBtnActive: { borderColor: colors.primary },
  thumbImg: { width: 58, height: 58 },

  optionsTitle: {
    fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    marginBottom: 8, gap: 12,
  },
  optionLabel: { flex: 1, fontSize: 14, color: colors.textPrimary },

  infoCard: {
    flexDirection: 'row', gap: 8, backgroundColor: '#EBF5FF',
    borderRadius: 12, padding: 14, marginTop: 8, alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: colors.primary, lineHeight: 18 },

  // ── Processing ──────────────────────────
  processingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  processingImageBox: {
    width: SCREEN_WIDTH - 48, height: 220, borderRadius: 16, overflow: 'hidden',
    backgroundColor: colors.surface, marginBottom: 28, position: 'relative',
  },
  processingImage: { width: '100%', height: '100%' },
  processingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  processingInfo: { alignItems: 'center', gap: 10 },
  processingTitle: {
    fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center',
  },
  processingMsg: {
    fontSize: 14, color: colors.primary, textAlign: 'center', fontWeight: '500',
  },
  processingNote: { fontSize: 12, color: colors.textTertiary, textAlign: 'center' },

  // ── Error ───────────────────────────────
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorTitle: {
    fontSize: 20, fontWeight: '700', color: colors.textPrimary,
    marginTop: 16, marginBottom: 10, textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20,
  },

  // ── Result ──────────────────────────────
  successBadgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    justifyContent: 'center', marginBottom: 14,
  },
  successBadgeText: { fontSize: 15, fontWeight: '700', color: colors.success },

  toggleRow: {
    flexDirection: 'row', backgroundColor: colors.borderLight,
    borderRadius: 10, padding: 3, marginBottom: 14,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.surface },
  toggleText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  toggleTextActive: { color: colors.primary, fontWeight: '700' },

  resultImageBox: {
    height: 240, width: '100%', borderRadius: 16, overflow: 'hidden',
    backgroundColor: colors.surface, marginBottom: 14,
    borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  resultImage: { width: '95%', height: '95%' },

  enhancementCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    marginTop: 4, gap: 8,
  },
  enhancementTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipText: { fontSize: 14, color: colors.textPrimary },
  processingTimeText: {
    fontSize: 11, color: colors.textTertiary, marginTop: 8,
  },

  // ── Shared footer ───────────────────────
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background, paddingHorizontal: layout.screenPadding,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
});
