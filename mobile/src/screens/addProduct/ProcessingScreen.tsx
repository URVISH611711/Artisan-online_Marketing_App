import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AddProductStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { ProcessingSteps } from '../../components/layout/ProgressStepper';
import { useDraftStore } from '../../store/useDraftStore';
import { Ionicons } from '@expo/vector-icons';

type Props = { navigation: NativeStackNavigationProp<AddProductStackParamList, 'Processing'> };

const ALL_STEPS = [
  'Understanding your product',
  'Identifying product details',
  'Creating product title',
  'Writing product description',
  'Creating keywords',
  'Preparing translation',
];

export const ProcessingScreen: React.FC<Props> = ({ navigation }) => {
  const [completedCount, setCompletedCount] = useState(0);
  const { updateDraft } = useDraftStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setCompletedCount((c) => {
        if (c >= ALL_STEPS.length) {
          clearInterval(interval);
          return c;
        }
        return c + 1;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (completedCount >= ALL_STEPS.length) {
      const timer = setTimeout(() => {
        updateDraft({
          name: 'Handcrafted Patola Silk Saree',
          category: 'Saree',
          description: 'Exquisite handwoven Patola silk saree crafted by skilled artisans in Gujarat using the traditional double ikat technique. Features vibrant geometric patterns in royal blue and gold, perfect for weddings and festive occasions.',
          shortDescription: 'Traditional double ikat Patola silk saree from Gujarat',
          keywords: ['Patola', 'Handmade', 'Silk', 'Gujarati Craft', 'Traditional', 'Wedding', 'Ikat'],
          step: 'catalog',
        });
        navigation.navigate('Catalog');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [completedCount]);

  const steps = ALL_STEPS.map((label, i) => ({
    label,
    status: (i < completedCount ? 'completed' : i === completedCount ? 'in_progress' : 'pending') as 'completed' | 'in_progress' | 'pending',
  }));

  const allDone = completedCount >= ALL_STEPS.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Animated icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={allDone ? 'checkmark-circle' : 'sparkles'}
            size={64}
            color={allDone ? colors.success : colors.primary}
          />
        </View>

        <Text style={styles.title}>
          {allDone ? 'Catalog created!' : 'Creating your catalog...'}
        </Text>
        <Text style={styles.subtitle}>
          {allDone ? 'Ready to review' : 'This usually takes about 30 seconds'}
        </Text>

        <View style={styles.stepsContainer}>
          <ProcessingSteps steps={steps} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  iconContainer: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 40 },
  stepsContainer: { width: '100%', maxWidth: 320 },
});
