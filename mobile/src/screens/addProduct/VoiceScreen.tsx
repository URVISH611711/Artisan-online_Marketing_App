import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AddProductStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { ProgressStepper } from '../../components/layout/ProgressStepper';
import { useDraftStore } from '../../store/useDraftStore';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, AudioModule } from 'expo-audio';

type Props = { navigation: NativeStackNavigationProp<AddProductStackParamList, 'Voice'> };

const LANGUAGES = [
  { code: 'hi', name: 'Hindi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'en', name: 'English' },
];

const PROMPTS = [
  { icon: 'chatbubble-outline' as const, question: 'What is this product made of?', desc: 'Materials, fabric, or clay type' },
  { icon: 'time-outline' as const, question: 'How long does it take to make?', desc: 'Time and effort involved' },
  { icon: 'star-outline' as const, question: 'What makes it special?', desc: 'Unique patterns or traditional techniques' },
];

export const VoiceScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedLang, setSelectedLang] = useState('hi');
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const { updateDraft } = useDraftStore();

  const audioRecorder = useAudioRecorder({} as any);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        console.warn('Microphone permission not granted');
      }
    })();
  }, []);

  useEffect(() => {
    if (audioRecorder.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [audioRecorder.isRecording, pulseAnim]);

  const handleMicPress = async () => {
    if (audioRecorder.isRecording) {
      await audioRecorder.stop();
      
      if (audioRecorder.uri) {
        setIsTranscribing(true);
        try {
          const { transcribeVoice } = require('../../services/api');
          const result = await transcribeVoice(audioRecorder.uri);
          
          setTranscript((prev) => (prev ? prev + ' ' + result.text : result.text).trim());
          // Language detection can be used if needed, but not part of draft yet
        } catch (err) {
          console.warn('Transcription failed:', err);
        } finally {
          setIsTranscribing(false);
        }
      }
    } else {
      await audioRecorder.record();
    }
  };

  const handleNext = () => {
    updateDraft({ description: transcript });
    navigation.navigate('ProductDetails', { imageUris: [] });
  };

  const selectedLangName = LANGUAGES.find((l) => l.code === selectedLang)?.name || 'Hindi';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ProgressStepper totalSteps={5} currentStep={1} />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Tell us about your product</Text>
        <Text style={styles.subtitle}>Speak naturally in your language. You don't need to type.</Text>

        {/* Language picker */}
        <TouchableOpacity style={styles.langPicker} onPress={() => setLangPickerOpen(!langPickerOpen)}>
          <Ionicons name="globe-outline" size={18} color={colors.secondary} />
          <Text style={styles.langText}>{selectedLangName}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        {langPickerOpen && (
          <View style={styles.langDropdown}>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={styles.langOption}
                onPress={() => { setSelectedLang(l.code); setLangPickerOpen(false); }}
              >
                <Text style={[styles.langOptionText, selectedLang === l.code && styles.langOptionSelected]}>
                  {l.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Mic button */}
        <View style={styles.micContainer}>
          <Animated.View style={[styles.micPulse, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
              style={[styles.micButton, audioRecorder.isRecording && styles.micButtonRecording]}
              onPress={handleMicPress}
              activeOpacity={0.8}
              disabled={isTranscribing}
            >
              {isTranscribing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name={audioRecorder.isRecording ? 'stop' : 'mic'} size={36} color="#fff" />
              )}
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.micLabel}>
            {isTranscribing ? 'Transcribing...' : audioRecorder.isRecording ? '● Recording...' : 'Tap and start speaking'}
          </Text>
        </View>
        
        {/* Editable Transcript Area */}
        {(transcript.length > 0 || isTranscribing) && (
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>Transcript (You can edit this):</Text>
            <TextInput
              style={styles.transcriptInput}
              multiline
              value={transcript}
              onChangeText={setTranscript}
              placeholder="Your transcribed text will appear here..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        )}

        {/* Prompt cards */}
        {!transcript && !isTranscribing && (
          <>
            <Text style={styles.promptsLabel}>What to say:</Text>
            {PROMPTS.map((p, i) => (
              <View key={i} style={styles.promptCard}>
                <View style={styles.promptIcon}>
                  <Ionicons name={p.icon} size={20} color={colors.textSecondary} />
                </View>
                <View>
                  <Text style={styles.promptQ}>{p.question}</Text>
                  <Text style={styles.promptDesc}>{p.desc}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title={transcript.length > 0 ? "Continue" : "Skip for now"} 
          onPress={handleNext} 
          variant={transcript.length > 0 ? "primary" : "outline"} 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  backBtn: { padding: 8 },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 10, marginTop: 12 },
  subtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  langPicker: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'center', borderWidth: 1, borderColor: colors.border,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 8,
    backgroundColor: colors.surface,
  },
  langText: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  langDropdown: {
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, marginBottom: 8,
  },
  langOption: { paddingHorizontal: 16, paddingVertical: 12 },
  langOptionText: { fontSize: 15, color: colors.textSecondary },
  langOptionSelected: { color: colors.primary, fontWeight: '700' },
  micContainer: { alignItems: 'center', marginVertical: 32 },
  micPulse: { marginBottom: 16 },
  micButton: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  micButtonRecording: { backgroundColor: colors.error },
  micLabel: { fontSize: 15, fontWeight: '600', color: colors.primary },
  transcriptBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  transcriptLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8, fontWeight: '500' },
  transcriptInput: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  promptsLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 10, fontWeight: '500' },
  promptCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 10,
  },
  promptIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  promptQ: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  promptDesc: { fontSize: 13, color: colors.textSecondary },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 28 },
});
