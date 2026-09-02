import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProductsStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import {
  useAudioRecorder, useAudioRecorderState, RecordingPresets, AudioModule, setAudioModeAsync,
} from 'expo-audio';
import {
  transcribeVoice, generateCatalog, applyCatalog, CatalogResult, fetchProduct, ProductData
} from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<ProductsStackParamList, 'BoostProduct'>;
  route: RouteProp<ProductsStackParamList, 'BoostProduct'>;
};

type Step = 'record' | 'generating' | 'review';

const LOW_CONFIDENCE = 0.6;

const langLabel = (code?: string) => {
  const map: Record<string, string> = { en: 'English', hi: 'Hindi', gu: 'Gujarati', auto: 'Auto-detected' };
  return code ? (map[code] || code) : 'Auto-detected';
};

// ── Reusable editable field ──
const Field = ({
  label, value, onChange, multiline, placeholder, keyboardType,
}: {
  label: string; value: string; onChange: (t: string) => void;
  multiline?: boolean; placeholder?: string; keyboardType?: 'default' | 'numeric';
}) => (
  <View style={styles.field}>
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
    <TextInput
      style={[styles.input, multiline && styles.inputMultiline]}
      value={value}
      onChangeText={onChange}
      multiline={multiline}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      keyboardType={keyboardType || 'default'}
    />
  </View>
);

export const BoostProductScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId, imageUris, productDetails } = route.params as any;

  const [step, setStep] = useState<Step>('record');

  // ── Existing Product Data ──
  const [existingProduct, setExistingProduct] = useState<ProductData | null>(null);

  // ── Record / type step ──
  const [transcript, setTranscript] = useState('');
  const [detectedLang, setDetectedLang] = useState<string | undefined>(undefined);
  const [confidence, setConfidence] = useState<number | undefined>(undefined);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const meterAnim = useRef(new Animated.Value(0)).current;   // 0..1 live input level
  const [level, setLevel] = useState(0);                     // for the level bar

  // HIGH_QUALITY + metering so we can show a live "your mic is working" halo.
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, 100);
  const isRecording = recorderState.isRecording;

  // ── Review step (editable draft) ──
  const [catalog, setCatalog] = useState<CatalogResult | null>(null);
  const [name, setName] = useState('');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const [craftType, setCraftType] = useState('');
  const [origin, setOrigin] = useState('');
  const [price, setPrice] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [diameter, setDiameter] = useState('');

  const [enName, setEnName] = useState('');
  const [enDesc, setEnDesc] = useState('');
  const [enShort, setEnShort] = useState('');
  const [hiName, setHiName] = useState('');
  const [hiDesc, setHiDesc] = useState('');
  const [hiShort, setHiShort] = useState('');

  const [seoTitle, setSeoTitle] = useState('');
  const [seoMeta, setSeoMeta] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [tagsText, setTagsText] = useState('');

  const [mismatchDismissed, setMismatchDismissed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (productId) {
          fetchProduct(productId).then(setExistingProduct).catch(console.warn);
        } else if (productDetails) {
          // Initialize state from AddProduct flow
          if (productDetails.name) setName(productDetails.name);
          if (productDetails.material) setMaterial(productDetails.material);
          if (productDetails.color) setColor(productDetails.color);
          if (productDetails.craftType) setCraftType(productDetails.craftType);
          if (productDetails.price) setPrice(productDetails.price.toString());
          if (productDetails.description) setEnDesc(productDetails.description);
        }
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          setPermissionDenied(true);
          return;
        }
        // Without allowsRecording the recorder captures nothing on iOS/Android.
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
        setMicReady(true);
      } catch (e) {
        console.warn('Audio setup failed:', e);
      }
    })();
  }, []);

  // Drive a live halo + level bar from the real input meter. If the halo never
  // moves while you speak, the mic genuinely isn't picking up sound.
  useEffect(() => {
    if (isRecording && typeof recorderState.metering === 'number') {
      // metering is in dB, roughly -60 (silence) .. 0 (loud). Normalize to 0..1.
      const norm = Math.max(0, Math.min(1, (recorderState.metering + 60) / 60));
      setLevel(norm);
      Animated.timing(meterAnim, { toValue: norm, duration: 90, useNativeDriver: true }).start();
    } else if (!isRecording) {
      setLevel(0);
      Animated.timing(meterAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
  }, [recorderState.metering, isRecording, meterAnim]);

  const handleMicPress = async () => {
    if (permissionDenied) {
      Alert.alert(
        'Microphone blocked',
        'Please enable microphone access for this app in your device Settings, then try again.',
      );
      return;
    }
    if (isRecording) {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        setIsTranscribing(true);
        try {
          const result = await transcribeVoice(uri);
          const text = (result.text || '').trim();
          if (!text) {
            Alert.alert('No speech detected', 'We could not hear anything. Move closer and try speaking again.');
          } else {
            setTranscript((prev) => (prev ? prev + ' ' + text : text).trim());
            if (result.language) setDetectedLang(result.language);
            if (typeof result.language_probability === 'number') setConfidence(result.language_probability);
          }
        } catch (err: any) {
          Alert.alert('Transcription failed', err.message || 'Please try again or type below.');
        } finally {
          setIsTranscribing(false);
        }
      } else {
        Alert.alert('Recording failed', 'No audio was captured. Please try again.');
      }
    } else {
      try {
        // Must prepare before every recording, or record() is a no-op.
        await recorder.prepareToRecordAsync();
        recorder.record();
      } catch (err: any) {
        Alert.alert('Could not start recording', err.message || 'Please check microphone permissions and try again.');
      }
    }
  };

  const cleanVal = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v).trim();
    const lower = s.toLowerCase();
    if (!lower || lower === 'null' || lower === 'none' || lower === 'n/a' || lower === 'not provided' || lower === 'not mentioned' || lower === 'unknown' || lower === 'unspecified') {
      return '';
    }
    return s;
  };

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      Alert.alert('Nothing to describe', 'Please record or type a short description first.');
      return;
    }
    setStep('generating');
    try {
      const res = await generateCatalog({
        transcript: transcript.trim(),
        language: detectedLang || 'auto',
        product_id: productId,
        confidence_score: confidence,
        existing_description: existingProduct?.description || productDetails?.description || '',
      });
      const c = res.catalog;
      setCatalog(c);

      let currentProduct = existingProduct;
      if (!currentProduct && productId) {
        try {
          currentProduct = await fetchProduct(productId);
          setExistingProduct(currentProduct);
        } catch (e) {
          console.warn('Failed to fetch existing product for fallback', e);
        }
      }

      const ex = c.extracted || ({} as CatalogResult['extracted']);
      const en = c.translations?.en || {};
      setName(currentProduct?.name || productDetails?.name || cleanVal(en.name) || cleanVal(ex.name) || '');
      setMaterial(cleanVal(ex.material) || currentProduct?.material || productDetails?.material || '');
      setColor(cleanVal(ex.color) || currentProduct?.color || productDetails?.color || '');
      setCraftType(cleanVal(ex.craft_type) || currentProduct?.craft_type || productDetails?.craftType || '');
      setOrigin(cleanVal(ex.origin) || currentProduct?.origin || '');
      setPrice(cleanVal(ex.price) || (currentProduct?.price ? String(currentProduct.price) : (productDetails?.price?.toString() || '')));
      setLength(cleanVal(ex.length) || (currentProduct?.length ? String(currentProduct.length) : ''));
      setWidth(cleanVal(ex.width) || (currentProduct?.width ? String(currentProduct.width) : ''));
      setDiameter(cleanVal(ex.diameter) || (currentProduct?.diameter ? String(currentProduct.diameter) : ''));
      const hi = c.translations?.hi || {};

      const existingEn = currentProduct?.translations?.find(t => t.language_code === 'en');
      const existingHi = currentProduct?.translations?.find(t => t.language_code === 'hi');

      setEnName(cleanVal(en.name) || existingEn?.name || '');
      setEnDesc(cleanVal(en.description) || existingEn?.description || currentProduct?.description || productDetails?.description || '');
      setEnShort(cleanVal(en.short_description) || existingEn?.short_description || currentProduct?.short_description || '');

      setHiName(cleanVal(hi.name) || existingHi?.name || '');
      setHiDesc(cleanVal(hi.description) || existingHi?.description || '');
      setHiShort(cleanVal(hi.short_description) || existingHi?.short_description || '');

      const seo = c.seo || {};
      setSeoTitle(cleanVal(seo.title) || currentProduct?.seo?.title || '');
      setSeoMeta(cleanVal(seo.meta_description) || currentProduct?.seo?.meta_description || '');

      const newKeywords = Array.isArray(seo.keywords) ? seo.keywords : (typeof seo.keywords === 'string' ? (seo.keywords as string).split(',').map((k: string) => k.trim()) : []);
      const oldKeywords = (currentProduct as any)?.keywords || [];
      const mergedKeywords = Array.from(new Set([...newKeywords, ...oldKeywords]));
      setKeywordsText(mergedKeywords.join(', '));

      const newTags = Array.isArray(seo.tags) ? seo.tags : (typeof seo.tags === 'string' ? (seo.tags as string).split(',').map((t: string) => t.trim()) : []);
      const oldTags = (currentProduct as any)?.seo?.tags || [];
      const mergedTags = Array.from(new Set([...newTags, ...oldTags]));
      setTagsText(mergedTags.join(', '));

      setMismatchDismissed(false);
      setStep('review');
    } catch (err: any) {
      Alert.alert('Generation failed', err.message || 'Could not generate the catalog. Please try again.');
      setStep('record');
    }
  };

  const splitList = (s: string) =>
    s.split(',').map((x) => x.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!enName.trim() && !name.trim()) {
      Alert.alert('Name required', 'Please provide a product name in English.');
      return;
    }
    setSaving(true);
    try {
      const keywords = splitList(keywordsText);
      const tags = splitList(tagsText);

      const translations: Record<string, any> = {};
      if (enName.trim() || enDesc.trim()) {
        translations.en = {
          name: enName.trim() || name.trim() || null,
          description: enDesc.trim() || null,
          short_description: enShort.trim() || null,
        };
      }
      if (hiName.trim() || hiDesc.trim()) {
        translations.hi = {
          name: hiName.trim() || null,
          description: hiDesc.trim() || null,
          short_description: hiShort.trim() || null,
        };
      }

      const base_updates: Record<string, any> = {};
      if (name.trim()) base_updates.name = name.trim();
      if (material.trim()) base_updates.material = material.trim();
      if (color.trim()) base_updates.color = color.trim();
      if (craftType.trim()) base_updates.craft_type = craftType.trim();
      if (origin.trim()) base_updates.origin = origin.trim();
      const priceNum = parseFloat(price);
      if (!isNaN(priceNum) && priceNum > 0) base_updates.price = priceNum;
      
      const lenNum = parseFloat(length);
      if (!isNaN(lenNum) && lenNum > 0) base_updates.length = lenNum;
      const widNum = parseFloat(width);
      if (!isNaN(widNum) && widNum > 0) base_updates.width = widNum;
      const diaNum = parseFloat(diameter);
      if (!isNaN(diaNum) && diaNum > 0) base_updates.diameter = diaNum;
      
      if (enShort.trim()) base_updates.short_description = enShort.trim();
      if (enDesc.trim()) base_updates.description = enDesc.trim();

      if (productId) {
        await applyCatalog({
          product_id: productId,
          translations,
          keywords,
          seo: {
            title: seoTitle.trim() || null,
            meta_description: seoMeta.trim() || null,
            keywords,
            tags,
          },
          base_updates: Object.keys(base_updates).length ? base_updates : undefined,
        });

        Alert.alert('Boosted!', 'Your product listing has been updated with bilingual descriptions and SEO.', [
          { text: 'Done', onPress: () => navigation.goBack() },
        ]);
      } else {
        // ADD PRODUCT FLOW: Do not save to DB yet. Pass enriched data to Choose Background.
        const updatedDetails = {
          ...productDetails,
          name,
          price: base_updates.price || productDetails?.price,
          material: base_updates.material || productDetails?.material,
          color: base_updates.color || productDetails?.color,
          craftType: base_updates.craft_type || productDetails?.craftType,
          origin: base_updates.origin,
          length: base_updates.length,
          width: base_updates.width,
          diameter: base_updates.diameter,
          description: enDesc.trim(),
          short_description: enShort.trim(),
          translations,
          seo: {
            title: seoTitle.trim(),
            meta_description: seoMeta.trim(),
            keywords,
            tags
          }
        };

        navigation.navigate('BackgroundMode' as any, {
          imageUris,
          productDetails: updatedDetails
        });
      }
    } catch (err: any) {
      Alert.alert('Save failed', err.message || 'Could not save the catalog. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const conf = (field: string): number | undefined => catalog?.extracted?.confidence?.[field];
  
  // Check if any field has low confidence
  const hasLowConfidence = catalog?.extracted?.confidence && 
    Object.values(catalog.extracted.confidence).some(c => c !== undefined && c < LOW_CONFIDENCE);

  // ── Header ──
  const TopBar = ({ title }: { title: string }) => (
    <View style={styles.topRow}>
      <TouchableOpacity
        onPress={() => (step === 'review' ? setStep('record') : navigation.goBack())}
        style={styles.backBtn}
      >
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.topTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  // ── Step: generating ──
  if (step === 'generating') {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar title="Boost Product" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.genText}>Writing your bilingual listing…</Text>
          <Text style={styles.genSub}>Extracting details, translating to English & हिंदी, and preparing SEO.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step: review ──
  if (step === 'review') {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar title="Review & Edit" />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.subtitle}>
              AI-generated from your voice note. Review and correct every field before saving —
              nothing is invented; blanks mean it wasn't mentioned.
            </Text>

            {catalog?.image_check?.mismatch && !mismatchDismissed && (
              <View style={styles.mismatchBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mismatchTitle}>⚠️ Possible mismatch</Text>
                  <Text style={styles.mismatchMsg}>
                    {catalog.image_check.message ||
                      'What you described may not match the product photo. Please double-check.'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setMismatchDismissed(true)} style={styles.mismatchClose}>
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Product Details</Text>
              {hasLowConfidence && <Text style={styles.verifyFlag}>⚠️ Please verify</Text>}
            </View>
            <Field label="Name" value={name} onChange={setName} placeholder="Not provided" />
            <Field label="Material" value={material} onChange={setMaterial} placeholder="Not provided" />
            <Field label="Craft Type" value={craftType} onChange={setCraftType} placeholder="Not provided" />
            <Field label="Color" value={color} onChange={setColor} placeholder="Not provided" />
            <Field label="Origin" value={origin} onChange={setOrigin} placeholder="Not provided" />
            
            <Text style={[styles.sectionTitle, { marginTop: 16, marginBottom: 10 }]}>Structured Dimensions</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Field label="Length (cm)" value={length} onChange={setLength} placeholder="e.g. 20" keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Width (cm)" value={width} onChange={setWidth} placeholder="e.g. 15" keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Diameter (cm)" value={diameter} onChange={setDiameter} placeholder="e.g. 10" keyboardType="numeric" />
              </View>
            </View>

            <Field label="Price (₹)" value={price} onChange={setPrice} placeholder="Leave blank to keep current" keyboardType="numeric" />

            <Field label="Description" value={enDesc} onChange={setEnDesc} multiline placeholder="Professional English description" />



            <Text style={styles.sectionTitle}>SEO</Text>
            <Field label="SEO Title" value={seoTitle} onChange={setSeoTitle} placeholder="Search-friendly title" />
            <Field label="Meta Description" value={seoMeta} onChange={setSeoMeta} multiline placeholder="Short meta description" />
            <Field label="Keywords (comma-separated)" value={keywordsText} onChange={setKeywordsText} placeholder="e.g. handloom, patola, silk" />
            <Field label="Tags (comma-separated)" value={tagsText} onChange={setTagsText} placeholder="e.g. traditional, festive" />
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <Button title={saving ? 'Saving…' : (productId ? 'Save to Product' : 'Next: Choose Background')} onPress={handleSave} loading={saving} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Step: record / type ──
  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Boost Product" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Describe your product</Text>
          <Text style={styles.subtitle}>
            Speak naturally in Gujarati, Hindi, or English. We'll turn it into a professional
            bilingual listing. You can also type below.
          </Text>

          <View style={styles.micContainer}>
            <View style={styles.micStage}>
              {/* Live halo — grows with your actual voice level. No movement = no input. */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.halo,
                  {
                    opacity: meterAnim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.55] }),
                    transform: [{ scale: meterAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }],
                  },
                ]}
              />
              <TouchableOpacity
                style={[styles.micButton, isRecording && styles.micButtonRecording]}
                onPress={handleMicPress}
                activeOpacity={0.8}
                disabled={isTranscribing}
              >
                {isTranscribing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name={isRecording ? 'stop' : 'mic'} size={36} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.micLabel}>
              {isTranscribing
                ? 'Transcribing…'
                : isRecording
                  ? `● Recording ${Math.floor((recorderState.durationMillis || 0) / 1000)}s`
                  : 'Tap and start speaking'}
            </Text>

            {/* Level meter — the bar jumps as you speak, proving the mic is capturing. */}
            {isRecording && (
              <View style={styles.levelTrack}>
                <View style={[styles.levelFill, { width: `${Math.round(level * 100)}%` }]} />
              </View>
            )}
            {isRecording && level < 0.05 && (
              <Text style={styles.silentHint}>No sound detected yet — speak a little louder.</Text>
            )}

            {permissionDenied && (
              <Text style={styles.silentHint}>Microphone access is blocked. Enable it in Settings.</Text>
            )}
            {detectedLang && !isRecording && !isTranscribing && (
              <Text style={styles.langNote}>Detected: {langLabel(detectedLang)}</Text>
            )}
          </View>

          <View style={styles.transcriptBox}>
            <Text style={styles.fieldLabel}>Transcript (you can edit this)</Text>
            <TextInput
              style={styles.transcriptInput}
              multiline
              value={transcript}
              onChangeText={setTranscript}
              placeholder="Your spoken description will appear here, or type it yourself…"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title="Generate Listing"
          onPress={handleGenerate}
          icon="sparkles-outline"
          iconPosition="right"
          disabled={!transcript.trim() || isTranscribing}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  backBtn: { padding: 8 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  genText: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginTop: 20, textAlign: 'center' },
  genSub: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 8, marginTop: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginBottom: 16 },
  micContainer: { alignItems: 'center', marginVertical: 24 },
  micStage: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  halo: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary,
  },
  micButton: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  micButtonRecording: { backgroundColor: colors.error },
  micLabel: { fontSize: 15, fontWeight: '600', color: colors.primary },
  levelTrack: {
    width: 200, height: 6, borderRadius: 3, backgroundColor: colors.borderLight,
    marginTop: 12, overflow: 'hidden',
  },
  levelFill: { height: '100%', borderRadius: 3, backgroundColor: colors.error },
  silentHint: { fontSize: 12, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  langNote: { fontSize: 13, color: colors.textSecondary, marginTop: 6 },
  transcriptBox: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  transcriptInput: {
    fontSize: 15, color: colors.textPrimary, lineHeight: 22, minHeight: 100,
    textAlignVertical: 'top', marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 20, marginBottom: 10 },
  field: { marginBottom: 12 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  verifyFlag: { fontSize: 12, color: colors.error, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.textPrimary,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  mismatchBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FEF3C7', borderRadius: 12, borderWidth: 1, borderColor: '#F59E0B',
    padding: 14, marginBottom: 8,
  },
  mismatchTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  mismatchMsg: { fontSize: 13, color: '#92400E', lineHeight: 19 },
  mismatchClose: { padding: 2 },
  footer: {
    paddingHorizontal: layout.screenPadding, paddingBottom: 28, paddingTop: 8,
    backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border,
  },
});
