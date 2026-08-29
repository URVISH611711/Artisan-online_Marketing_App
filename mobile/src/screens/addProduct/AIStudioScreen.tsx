import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AddProductStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/layout/Header';
import { useDraftStore } from '../../store/useDraftStore';
import { Ionicons } from '@expo/vector-icons';
import { enhanceProductImages, getEnhancementStatus, JobStatusResult } from '../../services/api';

type Props = NativeStackScreenProps<AddProductStackParamList, 'AIStudio'>;

type ScreenState = 'processing' | 'result' | 'error';

const PROCESSING_MESSAGES = [
  'Analyzing product photos...',
  'Isolating the product...',
  'Generating beautiful background...',
  'Compositing final image...',
  'Adding contact shadows...',
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AIStudioScreen: React.FC<Props> = ({ navigation, route }) => {
  const { imageUris, productDetails, backgroundMode, customPrompt } = route.params;
  const insets = useSafeAreaInsets();
  const { updateDraft } = useDraftStore();

  // ── UI State ─────────────────────────────────────────────────────
  const [screenState, setScreenState] = useState<ScreenState>('processing');
  const [selectedOriginalIdx, setSelectedOriginalIdx] = useState(0);
  const [compareMode, setCompareMode] = useState<'before' | 'after'>('after');
  const [processingMsgIdx, setProcessingMsgIdx] = useState(0);
  const [result, setResult] = useState<JobStatusResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);

  const processingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPolling = useRef(false);
  const isComponentMounted = useRef(true);

  useEffect(() => {
    isComponentMounted.current = true;
    startProcessing();
    
    return () => {
      isComponentMounted.current = false;
      stopProcessingMessages();
    };
  }, []); // Only run once on mount

  const startProcessingMessages = () => {
    stopProcessingMessages();
    processingInterval.current = setInterval(() => {
      if (!isComponentMounted.current) return;
      setProcessingMsgIdx((i) => (i + 1) % PROCESSING_MESSAGES.length);
    }, 3000);
  };

  const stopProcessingMessages = () => {
    if (processingInterval.current) {
      clearInterval(processingInterval.current);
      processingInterval.current = null;
    }
  };

  const startProcessing = async () => {
    setScreenState('processing');
    setProcessingMsgIdx(0);
    startProcessingMessages();
    setErrorMessage('');

    try {
      const options = {
        ...productDetails,
        background_mode: backgroundMode,
        custom_prompt: customPrompt,
      };

      const res = await enhanceProductImages(imageUris, options);

      if (res.success && res.job_id) {
        setJobId(res.job_id);
        isPolling.current = true;
        pollStatus(res.job_id);
      } else {
        throw new Error(res.error_message || 'Failed to start processing.');
      }
    } catch (err: any) {
      if (!isComponentMounted.current) return;
      stopProcessingMessages();
      setErrorMessage(err.message || 'Network error.');
      setScreenState('error');
    }
  };

  const pollStatus = async (id: string) => {
    if (!isComponentMounted.current || !isPolling.current) return;
    
    try {
      const statusRes = await getEnhancementStatus(id);

      if (!isComponentMounted.current) return;

      if (statusRes.status === 'COMPLETED' && statusRes.result) {
        stopProcessingMessages();
        setResult(statusRes);
        setScreenState('result');
        setCompareMode('after');
        
        updateDraft({
          jobId: id,
          enhancedImageUrls: statusRes.result.enhanced_urls,
          step: 'ai_studio',
        });
      } else if (statusRes.status === 'FAILED') {
        stopProcessingMessages();
        setErrorMessage(statusRes.error || 'Processing failed.');
        setScreenState('error');
      } else {
        // Update the processing message based on status
        const stateMap: Record<string, number> = {
          'UPLOADING': 0,
          'ANALYZING_PRODUCT': 0,
          'REMOVING_BACKGROUND': 1,
          'PRODUCT_ISOLATED': 1,
          'GENERATING_BACKGROUND': 2,
          'COMPOSITING_PRODUCT': 3,
          'SAVING': 4,
        };
        const idx = stateMap[statusRes.status];
        if (idx !== undefined) setProcessingMsgIdx(idx);
        
        // Poll again after 2 seconds - capped and cleaned up on unmount
        setTimeout(() => {
          if (isPolling.current && isComponentMounted.current) {
            pollStatus(id);
          }
        }, 2000);
      }
    } catch (err: any) {
      if (!isComponentMounted.current) return;
      stopProcessingMessages();
      setErrorMessage(err.message || 'Polling failed.');
      setScreenState('error');
    }
  };

  const handleNext = () => {
    if (!result?.result || !jobId) return;
    
    navigation.navigate('Review', {
      jobId,
      enhancedUrls: result.result.enhanced_urls,
      productDetails,
    });
  };

  const handleChangeBackground = () => {
    isPolling.current = false;
    navigation.goBack(); // Goes back to BackgroundMode screen
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER: Processing state
  // ═══════════════════════════════════════════════════════════════════
  if (screenState === 'processing') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Header title="Enhancing..." onBack={() => { isPolling.current = false; navigation.goBack(); }} />
        <View style={styles.processingContainer}>
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
        <Header title="Error" onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.warning} />
          <Text style={styles.errorTitle}>Unable to enhance photos</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button title="Try Again" onPress={startProcessing} />
            <Button
              title="Change Background"
              onPress={handleChangeBackground}
              variant="outline"
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER: Result state
  // ═══════════════════════════════════════════════════════════════════
  if (screenState === 'result' && result?.result) {
    const displayUri = compareMode === 'after'
      ? result.result.enhanced_urls[selectedOriginalIdx]
      : imageUris[selectedOriginalIdx];

    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Header title="Result" onBack={() => navigation.goBack()} />

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 180 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successBadgeRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.successBadgeText}>Photos Enhanced</Text>
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
              key={displayUri}
            />
          </View>

          {/* Thumbnails */}
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
                  <Image 
                    source={{ uri: compareMode === 'after' ? result.result!.enhanced_urls[idx] : uri }} 
                    style={styles.thumbImg} 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button 
            title="Review & Publish" 
            onPress={handleNext} 
            rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.surface} />}
          />
          <Button
            title="Change Background"
            onPress={handleChangeBackground}
            variant="outline"
            style={{ marginTop: 8 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: layout.screenPadding, paddingTop: 8 },

  // ── Processing ──────────────────────────
  processingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  processingImageBox: {
    width: SCREEN_WIDTH - 48, height: 260, borderRadius: 16, overflow: 'hidden',
    backgroundColor: colors.surface, marginBottom: 28, position: 'relative',
  },
  processingImage: { width: '100%', height: '100%' },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  processingInfo: { alignItems: 'center', gap: 10 },
  processingTitle: {
    ...typography.h4, color: colors.textPrimary, textAlign: 'center',
  },
  processingMsg: {
    ...typography.body1, color: colors.primary, textAlign: 'center', fontWeight: '500',
  },

  // ── Error ───────────────────────────────
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorTitle: {
    ...typography.h3, color: colors.textPrimary,
    marginTop: 16, marginBottom: 10, textAlign: 'center',
  },
  errorMessage: {
    ...typography.body1, color: colors.textSecondary, textAlign: 'center', lineHeight: 20,
  },

  // ── Result ──────────────────────────────
  successBadgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    justifyContent: 'center', marginBottom: 14,
  },
  successBadgeText: { ...typography.subtitle1, color: colors.success },

  toggleRow: {
    flexDirection: 'row', backgroundColor: colors.borderLight,
    borderRadius: 10, padding: 3, marginBottom: 14,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.surface },
  toggleText: { ...typography.body2, color: colors.textSecondary, fontWeight: '500' },
  toggleTextActive: { color: colors.primary, fontWeight: '700' },

  resultImageBox: {
    height: 320, width: '100%', borderRadius: 16, overflow: 'hidden',
    backgroundColor: colors.surface, marginBottom: 14,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  resultImage: { width: '100%', height: '100%' },

  thumbRow: { marginBottom: 16 },
  thumbBtn: {
    marginRight: 8, borderRadius: 10, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbBtnActive: { borderColor: colors.primary },
  thumbImg: { width: 64, height: 64 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background, paddingHorizontal: layout.screenPadding,
    paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border,
  },
});
