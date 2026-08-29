import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';

export const ArtisanProfileScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  // Artisan profile data from marketplace would need a dedicated endpoint (GET /profile/:artisanId)
  // For now show a placeholder with the artisan ID
  return (
    <ScreenWrapper padded={false}>
      <Header onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={48} color="#fff" />
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.shopName}>Artisan</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.location}>India</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { value: '—', label: 'Products' },
              { value: '—', label: 'Orders' },
              { value: '—', label: 'Rating' },
            ].map(({ value, label }) => (
              <View key={label} style={styles.stat}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.story}>Artisan profile details will be available soon.</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 80 },
  banner: { height: 140, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 0 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', marginBottom: -40 },
  profileInfo: { paddingHorizontal: layout.screenPadding, paddingTop: 48, alignItems: 'center' },
  shopName: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  location: { fontSize: 13, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 16, marginTop: 16 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  story: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
});
