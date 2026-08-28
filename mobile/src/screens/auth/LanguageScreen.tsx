import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { useLanguageStore } from '../../store/useAuthStore';
import { AppLanguage } from '../../types';
import { Ionicons } from '@expo/vector-icons';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Language'> };

const LANGUAGES: { code: AppLanguage; nativeName: string; englishName: string; icon: string }[] = [
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati', icon: '🏛️' },
  { code: 'hi', nativeName: 'हिंदी', englishName: 'Hindi', icon: '🌸' },
  { code: 'en', nativeName: 'English', englishName: 'English', icon: '🌐' },
];

export const LanguageScreen: React.FC<Props> = ({ navigation }) => {
  const { language, setLanguage } = useLanguageStore();
  const [selected, setSelected] = useState<AppLanguage>(language);

  const handleContinue = () => {
    setLanguage(selected);
    navigation.replace('Onboarding');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose your language</Text>
        <Text style={styles.subtitle}>अपनी भाषा चुनें</Text>

        <View style={styles.optionList}>
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setSelected(lang.code)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={lang.englishName}
              >
                <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                  <Text style={styles.flagIcon}>{lang.icon}</Text>
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.nativeName, isSelected && styles.nameSelected]}>
                    {lang.nativeName}
                  </Text>
                  <Text style={styles.englishName}>{lang.englishName}</Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <Button title="Continue" onPress={handleContinue} />
        <Text style={styles.hint}>You can change this later in Settings</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: layout.screenPadding, paddingTop: 48 },
  title: {
    fontSize: 28, fontWeight: '800', color: colors.textPrimary,
    textAlign: 'center', marginBottom: 8,
  },
  subtitle: {
    fontSize: 20, color: colors.textSecondary,
    textAlign: 'center', marginBottom: 40,
  },
  optionList: { gap: 12 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.md,
    padding: 16,
    borderWidth: 1.5, borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0F6FF',
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  iconBoxSelected: { backgroundColor: '#DBEAFE' },
  flagIcon: { fontSize: 22 },
  optionText: { flex: 1 },
  nativeName: {
    fontSize: 20, fontWeight: '700', color: colors.textPrimary,
  },
  nameSelected: { color: colors.primary },
  englishName: {
    fontSize: 13, color: colors.textSecondary, marginTop: 2,
  },
  radio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary, backgroundColor: colors.primary,
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
    gap: 12,
  },
  hint: {
    fontSize: 13, color: colors.textSecondary, textAlign: 'center',
  },
});
