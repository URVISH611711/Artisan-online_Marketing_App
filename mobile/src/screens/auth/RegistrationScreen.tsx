import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Registration'> };

const CRAFT_TYPES = ['Handloom & Textiles', 'Pottery & Ceramics', 'Wood Carving', 'Metal Work', 'Block Print', 'Embroidery', 'Jewelry', 'Leather Craft', 'Basket Weaving', 'Other'];

export const RegistrationScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [craftType, setCraftType] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleCreateShop = async () => {
    if (!name || !businessName || !craftType) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setUser({
      id: 'artisan_001',
      phone: '+91 98765 43210',
      name,
      email: '',
      role: 'artisan',
      language: 'en',
      voiceLanguage: 'hi',
      createdAt: new Date().toISOString(),
    });
    setLoading(false);
    // RootNavigator will automatically show Main after setUser
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>Just a few details to set up your shop</Text>

        {/* Photo */}
        <TouchableOpacity style={styles.photoCircle}>
          <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
          <Text style={styles.photoText}>Add your photo</Text>
        </TouchableOpacity>

        <Input label="Your Name" placeholder="e.g. Ramesh Patel" value={name} onChangeText={setName} />
        <Input label="Business / Shop Name" placeholder="e.g. Ramesh Handicrafts" value={businessName} onChangeText={setBusinessName} />

        {/* Craft type picker */}
        <Text style={styles.craftLabel}>Craft Category</Text>
        <View style={styles.craftGrid}>
          {CRAFT_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.craftChip, craftType === type && styles.craftChipSelected]}
              onPress={() => setCraftType(type)}
            >
              <Text style={[styles.craftText, craftType === type && styles.craftTextSelected]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="State / Location"
          placeholder="e.g. Ahmedabad, Gujarat"
          value={location}
          onChangeText={setLocation}
        />

        {/* Voice hint */}
        <View style={styles.voiceHint}>
          <Ionicons name="mic-outline" size={20} color={colors.secondary} />
          <Text style={styles.voiceHintText}>You can also say your details</Text>
        </View>

        <Button
          title="Create My Shop"
          onPress={handleCreateShop}
          loading={loading}
          disabled={!name || !businessName || !craftType}
          style={styles.button}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: layout.screenPadding, paddingTop: 32, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 28, lineHeight: 22 },
  photoCircle: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 28, backgroundColor: colors.surface,
  },
  photoText: { fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  craftLabel: { fontSize: 14, fontWeight: '500', color: colors.textPrimary, marginBottom: 12 },
  craftGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  craftChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  craftChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  craftText: { fontSize: 13, color: colors.textSecondary },
  craftTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  voiceHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF7ED', borderRadius: 10, padding: 12, marginBottom: 20,
  },
  voiceHintText: { fontSize: 14, color: colors.secondary },
  button: { marginTop: 8 },
});
