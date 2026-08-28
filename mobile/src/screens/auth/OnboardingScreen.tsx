import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'> };

const SLIDES = [
  {
    id: '1',
    icon: 'camera-outline' as const,
    iconColor: '#1E3A5F',
    title: 'Turn your craft into a digital catalog',
    description: 'Take a photo and let AI create a professional product listing with the perfect description.',
    bg: '#EBF5FF',
  },
  {
    id: '2',
    icon: 'mic-outline' as const,
    iconColor: '#C4704B',
    title: 'Just speak. AI creates your listing.',
    description: 'No typing needed. Describe your product in your language and AI will create the catalog.',
    bg: '#FFF7ED',
  },
  {
    id: '3',
    icon: 'storefront-outline' as const,
    iconColor: '#2E7D32',
    title: 'Reach buyers beyond exhibitions',
    description: 'Connect with B2B buyers across India. Sell your craft year-round, not just at exhibitions.',
    bg: '#E8F5E9',
  },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const { setOnboarded } = useAuthStore();

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    setOnboarded(true);
    navigation.replace('Login');
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip */}
      {!isLast && (
        <TouchableOpacity style={styles.skip} onPress={handleGetStarted}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Illustration area */}
            <View style={[styles.illustrationBox, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={80} color={item.iconColor} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      {/* Pagination dots */}
      <View style={styles.paginationRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.pageDot, i === currentIndex ? styles.pageDotActive : styles.pageDotInactive]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          title={isLast ? 'Get Started' : 'Next'}
          onPress={handleNext}
          icon={isLast ? 'arrow-forward' : undefined}
          iconPosition="right"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  skip: {
    position: 'absolute', top: 48, right: 20, zIndex: 10, padding: 8,
  },
  skipText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  slide: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 60,
  },
  illustrationBox: {
    width: 200, height: 200, borderRadius: 100,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 26, fontWeight: '800', color: colors.textPrimary,
    textAlign: 'center', marginBottom: 16, lineHeight: 34,
  },
  description: {
    fontSize: 16, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 24,
  },
  paginationRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 6, marginBottom: 16,
  },
  pageDot: { height: 6, borderRadius: 3 },
  pageDotActive: { width: 24, backgroundColor: colors.primary },
  pageDotInactive: { width: 6, backgroundColor: colors.border },
  footer: {
    paddingHorizontal: layout.screenPadding, paddingBottom: 32,
  },
});
