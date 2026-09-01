import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { useAuthStore, useLanguageStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { language, voiceLanguage } = useLanguageStore();
  const langNames: Record<string, string> = { en: 'English', hi: 'Hindi', gu: 'Gujarati' };

  const displayName = user?.name || 'Artisan';
  const displayLocation = user?.location || user?.address || '';



  return (
    <ScreenWrapper padded={false}>
      <Header title="Artisan Profile" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar + name */}
        <Card padding="lg" style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={32} color={colors.textSecondary} />
              </View>
              <TouchableOpacity style={styles.editAvatarBtn}>
                <Ionicons name="pencil" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {displayLocation ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.location}>{displayLocation}</Text>
            </View>
          ) : null}
          <Button 
            title="Edit Profile" 
            onPress={() => navigation.navigate('EditProfile')} 
            variant="outline" 
            size="sm" 
            icon="pencil-outline" 
            style={styles.editBtn} 
            fullWidth={false} 
          />
        </Card>

        {/* Stats */}
        <Card padding="md" style={styles.statsCard}>
          {[
            { value: user?.productsCount ?? 0, label: 'Products' },
            { value: user?.ordersCount ?? 0, label: 'Orders' },
            { value: user?.rating ? `${user.rating} ☆` : '0 ☆', label: 'Rating' },
          ].map(({ value, label }) => (
            <View key={label} style={styles.stat}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </Card>



        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card padding="none" style={styles.fieldsCard}>
          {[
            { icon: 'globe-outline' as const, label: 'App Language', value: langNames[language] },
            { icon: 'mic-outline' as const, label: 'Voice Language', value: langNames[voiceLanguage] },
            { icon: 'volume-medium-outline' as const, label: 'AI Voice', value: 'Female' },
          ].map(({ icon, label, value }, i) => (
            <TouchableOpacity key={label} style={[styles.field, i < 2 && styles.fieldBorder]}>
              <View style={styles.fieldIconBox}>
                <Ionicons name={icon} size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.fieldValue, { flex: 1 }]}>{label}</Text>
              <Text style={styles.fieldPref}>{value}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <Card padding="none" style={styles.fieldsCard}>
          <TouchableOpacity style={[styles.field, styles.fieldBorder]}>
            <Ionicons name="shield-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.fieldValue, { flex: 1, marginLeft: 12 }]}>Privacy</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.field, styles.fieldBorder]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.fieldValue, { flex: 1, marginLeft: 12 }]}>Security</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.field} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={[styles.fieldValue, { flex: 1, marginLeft: 12, color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  profileCard: { alignItems: 'center', marginBottom: 12 },
  avatarRow: { marginBottom: 12 },
  avatarContainer: { position: 'relative' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#DBEAFE' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 20, fontWeight: '800', color: colors.primary, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  location: { fontSize: 13, color: colors.textSecondary },
  editBtn: { alignSelf: 'center' },
  statsCard: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  fieldsCard: { marginBottom: 16 },
  field: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  fieldIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  fieldText: { flex: 1 },
  fieldLabel: { fontSize: 12, color: colors.textTertiary, marginBottom: 2 },
  fieldValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  fieldPref: { fontSize: 14, color: colors.textSecondary, marginRight: 4 },
});
