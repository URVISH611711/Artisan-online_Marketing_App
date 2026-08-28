import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [imageEnhancement, setImageEnhancement] = React.useState(true);
  const [autoTranslation, setAutoTranslation] = React.useState(true);

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <Card padding="none">{children}</Card>
    </View>
  );

  const ToggleRow: React.FC<{ label: string; value: boolean; onToggle: (v: boolean) => void }> = ({ label, value, onToggle }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );

  const LinkRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
    <View style={[styles.row, styles.linkRow]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
    </View>
  );

  return (
    <ScreenWrapper padded={false}>
      <Header title="Settings" onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: layout.screenPadding }}>
        <Section title="LANGUAGE">
          <LinkRow label="App Language" value="Hindi" />
          <View style={styles.divider} />
          <LinkRow label="Voice Language" value="Gujarati" />
        </Section>

        <Section title="AI">
          <ToggleRow label="Auto Image Enhancement" value={imageEnhancement} onToggle={setImageEnhancement} />
          <View style={styles.divider} />
          <ToggleRow label="Auto Translation" value={autoTranslation} onToggle={setAutoTranslation} />
        </Section>

        <Section title="BUSINESS">
          <LinkRow label="Default Profit Margin" value="30%" />
          <View style={styles.divider} />
          <LinkRow label="Shipping Settings" />
          <View style={styles.divider} />
          <LinkRow label="Currency" value="INR (₹)" />
        </Section>

        <Section title="HELP">
          <LinkRow label="Tutorials" />
          <View style={styles.divider} />
          <LinkRow label="FAQs" />
          <View style={styles.divider} />
          <LinkRow label="Contact Support" />
        </Section>

        <Section title="ABOUT">
          <LinkRow label="App Version" value="1.0.0" />
          <View style={styles.divider} />
          <LinkRow label="Terms of Service" />
          <View style={styles.divider} />
          <LinkRow label="Privacy Policy" />
        </Section>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  linkRow: {},
  rowLabel: { fontSize: 15, color: colors.textPrimary },
  rowValue: { fontSize: 14, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 16 },
});
