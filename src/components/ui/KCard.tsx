import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../../constants/colors';

type Variant = 'default' | 'earned' | 'glass';

interface KCardProps {
  children: React.ReactNode;
  variant?: Variant;
  style?: ViewStyle;
  padding?: number;
}

export function KCard({ children, variant = 'default', style, padding }: KCardProps) {
  const containerStyle: ViewStyle = {
    ...styles.base,
    ...variantStyles[variant],
    ...(padding !== undefined ? { padding } : {}),
    ...style,
  };

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    overflow: 'hidden',
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  default: {
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  earned: {
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.emerald500,
    shadowColor: Colors.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
};
