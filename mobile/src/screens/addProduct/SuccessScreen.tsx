import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AddProductStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Button } from '../../components/ui/Button';
import { useDraftStore } from '../../store/useDraftStore';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AddProductStackParamList, 'Success'>;

// Confetti-like floating dots animation
const ConfettiDot: React.FC<{ x: number; delay: number; color: string }> = ({ x, delay, color }) => {
  const anim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, [delay, anim]);

  return (
    <Animated.View
      style={[
        styles.confettiDot,
        { backgroundColor: color, left: x },
        {
          opacity: anim.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] }),
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [200, -100] }) }],
        },
      ]}
    />
  );
};

const CONFETTI_DOTS = [
  { x: 30, delay: 0, color: colors.primary },
  { x: 80, delay: 200, color: colors.secondary },
  { x: 140, delay: 100, color: colors.success },
  { x: 200, delay: 300, color: '#8B5CF6' },
  { x: 260, delay: 150, color: colors.warning },
  { x: 310, delay: 250, color: colors.primary },
];

export const SuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const { clearDraft } = useDraftStore();
  const bounceAnim = React.useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.spring(bounceAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }).start();
    // Only clear draft after real product is published
    clearDraft();
  }, [bounceAnim, clearDraft]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Confetti */}
      <View style={styles.confettiContainer} pointerEvents="none">
        {CONFETTI_DOTS.map((dot, i) => (
          <ConfettiDot key={i} {...dot} />
        ))}
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.iconBubble, { transform: [{ scale: bounceAnim }] }]}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </Animated.View>

        <Text style={styles.title}>Product Saved as Draft! 📝</Text>
        <Text style={styles.subtitle}>Your product is saved in Drafts. You can view or publish it anytime from My Products.</Text>
      </View>

      <View style={styles.footer}>
        <Button
          title="View Product"
          onPress={() => navigation.getParent()?.navigate('Products')}
          icon="eye-outline"
        />
        <Button
          title="Share Product"
          onPress={() => {}}
          variant="outline"
          icon="share-outline"
          style={{ marginTop: 12 }}
        />
        <TouchableOpacity onPress={() => navigation.navigate('Camera')} style={styles.addAnotherBtn}>
          <Text style={styles.addAnotherText}>+ Add Another Product</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  confettiContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', overflow: 'hidden' },
  confettiDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, bottom: 0 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: layout.screenPadding },
  iconBubble: { marginBottom: 24 },
  title: { ...typography.styles.heading, color: colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  subtitle: { ...typography.styles.body, color: colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 32 },
  addAnotherBtn: { alignItems: 'center', paddingVertical: 20 },
  addAnotherText: { ...typography.styles.title, color: colors.primary, fontWeight: '700' },
});
