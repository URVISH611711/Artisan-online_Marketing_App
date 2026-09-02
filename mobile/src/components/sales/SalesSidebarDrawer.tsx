import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface SalesSidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
  selectedPeriod: 'week' | 'month' | 'year';
  onSelectPeriod: (period: 'week' | 'month' | 'year') => void;
  onPressDuration: () => void;
}

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.75, 290);

export const SalesSidebarDrawer: React.FC<SalesSidebarDrawerProps> = ({
  visible,
  onClose,
  selectedPeriod,
  onSelectPeriod,
  onPressDuration,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getPeriodLabel = (period: 'week' | 'month' | 'year') => {
    switch (period) {
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
    }
  };

  const handlePeriodClick = (period: 'week' | 'month' | 'year') => {
    onSelectPeriod(period);
    setDropdownOpen(false);
    onClose();
  };

  const handleDurationClick = () => {
    setDropdownOpen(false);
    onPressDuration();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlayContainer}>
        {/* Backdrop (clicking closes drawer) */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sidebar Drawer Container */}
        <View style={styles.drawerContainer}>
          {/* Header with Title & Back Arrow */}
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Sales</Text>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Section 1: Period Dropdown Menu */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setDropdownOpen(!dropdownOpen)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownBtnText}>
                {getPeriodLabel(selectedPeriod)}
              </Text>
              <Ionicons
                name={dropdownOpen ? 'caret-up' : 'caret-down'}
                size={14}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            {/* Dropdown Options List */}
            {dropdownOpen && (
              <View style={styles.dropdownOptionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedPeriod === 'week' && styles.optionItemActive,
                  ]}
                  onPress={() => handlePeriodClick('week')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedPeriod === 'week' && styles.optionTextActive,
                    ]}
                  >
                    This Week
                  </Text>
                  {selectedPeriod === 'week' && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedPeriod === 'month' && styles.optionItemActive,
                  ]}
                  onPress={() => handlePeriodClick('month')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedPeriod === 'month' && styles.optionTextActive,
                    ]}
                  >
                    This Month
                  </Text>
                  {selectedPeriod === 'month' && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedPeriod === 'year' && styles.optionItemActive,
                  ]}
                  onPress={() => handlePeriodClick('year')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedPeriod === 'year' && styles.optionTextActive,
                    ]}
                  >
                    This Year
                  </Text>
                  {selectedPeriod === 'year' && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Section 2: Duration Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.durationBtn}
              onPress={handleDurationClick}
              activeOpacity={0.8}
            >
              <Text style={styles.durationBtnText}>Duration</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dim background backdrop
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: colors.surface,
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  section: {
    marginVertical: 4,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dropdownOptionsContainer: {
    marginTop: 8,
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  optionItemActive: {
    backgroundColor: '#EBF5FF',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  durationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF5FF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#B9E0FF',
  },
  durationBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
