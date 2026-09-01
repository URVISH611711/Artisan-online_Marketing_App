import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;
};

const TopBar = ({ title, onBack }: { title: string, onBack: () => void }) => (
  <View style={styles.topRow}>
    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
      <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
    </TouchableOpacity>
    <Text style={styles.topTitle}>{title}</Text>
    <View style={{ width: 40 }} />
  </View>
);

const Field = ({
  label, value, onChange, placeholder, disabled = false, keyboardType = 'default'
}: {
  label: string, value: string, onChange?: (t: string) => void, placeholder?: string, disabled?: boolean, keyboardType?: any
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputWrapper, disabled && styles.inputWrapperDisabled]}>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        editable={!disabled}
        keyboardType={keyboardType}
      />
      {disabled && (
        <Ionicons name="lock-closed" size={16} color={colors.textTertiary} style={styles.lockIcon} />
      )}
    </View>
  </View>
);

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, fetchAndSetProfile } = useAuthStore();

  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [address, setAddress] = useState(user?.address || '');
  const [craftType, setCraftType] = useState(user?.craftType || '');

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        business_name: businessName.trim() || undefined,
        address: address.trim() || undefined,
        craft_type: craftType.trim() || undefined,
      });

      // Globally sync the new profile data!
      await fetchAndSetProfile();

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Unable to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Edit Profile" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Card padding="md" style={styles.card}>
            <Field label="Full Name" value={name} onChange={setName} placeholder="Your name" />
            <Field label="Mobile Number" value={phone} onChange={setPhone} placeholder="e.g. 9876543210" keyboardType="phone-pad" />
            <Field label="Email" value={email} disabled={true} />
          </Card>

          <Text style={styles.sectionTitle}>Business Information</Text>
          <Card padding="md" style={styles.card}>
            <Field label="Business Name" value={businessName} onChange={setBusinessName} placeholder="Your business name" />
            <Field label="Address" value={address} onChange={setAddress} placeholder="City, State" />
            <Field label="Craft Type / Tags" value={craftType} onChange={setCraftType} placeholder="e.g. Pottery, Handicraft" />
          </Card>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title={saving ? 'Updating...' : 'Update Profile'}
          onPress={handleUpdate}
          loading={saving}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 24, paddingTop: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 12 },
  card: { marginBottom: 12 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputWrapperDisabled: {
    backgroundColor: colors.borderLight,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputDisabled: {
    color: colors.textSecondary,
  },
  lockIcon: {
    paddingRight: 12,
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 28,
    paddingTop: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
