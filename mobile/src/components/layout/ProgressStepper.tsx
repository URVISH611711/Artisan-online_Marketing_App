import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface ProgressStepperProps {
  totalSteps: number;
  currentStep: number;
  style?: ViewStyle;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  totalSteps,
  currentStep,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i + 1 === currentStep ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );
};

// AI Processing step list
interface ProcessingStep {
  label: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface ProcessingStepsProps {
  steps: ProcessingStep[];
  style?: ViewStyle;
}

export const ProcessingSteps: React.FC<ProcessingStepsProps> = ({
  steps,
  style,
}) => {
  return (
    <View style={[stepStyles.container, style]}>
      {steps.map((step, index) => (
        <View key={index} style={stepStyles.row}>
          {/* Connector line */}
          {index > 0 && (
            <View
              style={[
                stepStyles.connector,
                step.status !== 'pending' && stepStyles.connectorActive,
              ]}
            />
          )}
          {/* Icon */}
          <View
            style={[
              stepStyles.icon,
              step.status === 'completed' && stepStyles.iconCompleted,
              step.status === 'in_progress' && stepStyles.iconActive,
              step.status === 'pending' && stepStyles.iconPending,
            ]}
          >
            {step.status === 'completed' && (
              <Text style={stepStyles.checkmark}>✓</Text>
            )}
            {step.status === 'in_progress' && (
              <View style={stepStyles.pulsingDot} />
            )}
          </View>
          {/* Label */}
          <Text
            style={[
              stepStyles.label,
              step.status === 'completed' && stepStyles.labelCompleted,
              step.status === 'in_progress' && stepStyles.labelActive,
              step.status === 'pending' && stepStyles.labelPending,
            ]}
          >
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: colors.border,
  },
});

const stepStyles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    left: 11,
    top: -16,
    width: 2,
    height: 16,
    backgroundColor: colors.border,
  },
  connectorActive: {
    backgroundColor: colors.success,
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCompleted: {
    backgroundColor: colors.success,
  },
  iconActive: {
    backgroundColor: colors.primary,
  },
  iconPending: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.border,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textOnPrimary,
  },
  checkmark: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  labelCompleted: {
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  labelPending: {
    color: colors.textTertiary,
  },
});
