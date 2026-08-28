import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AddProductStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { useDraftStore } from '../../store/useDraftStore';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<AddProductStackParamList, 'Success'>;
  route: RouteProp<AddProductStackParamList, 'Success'>;
};

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
  }, []);

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

export const SuccessScreen: React.FC<Props> = ({ navigation }) => {
  const { clearDraft } = useDraftStore();
  const bounceAnim = React.useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.spring(bounceAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }).start();
    clearDraft();
  }, []);

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
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
        </Animated.View>

        <Text style={styles.title}>Your product is live! 🎉</Text>
        <Text style={styles.subtitle}>Buyers can now discover your craft</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>Potential buyers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Similar searches</Text>
          </View>
        </View>
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
          style={{ marginTop: 10 }}
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
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 20 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.primary, marginBottom: 4 },
  statLabel: { fontSize: 13, color: colors.textSecondary },
  statDivider: { width: 1, height: 40, backgroundColor: colors.border },
  footer: { paddingHorizontal: layout.screenPadding, paddingBottom: 32 },
  addAnotherBtn: { alignItems: 'center', paddingVertical: 16 },
  addAnotherText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
});
