import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { Colors, Fonts } from '../../constants/colors';

interface KEyebrowProps {
  children: React.ReactNode;
  style?: TextStyle;
  color?: string;
}

export function KEyebrow({ children, style, color }: KEyebrowProps) {
  return (
    <Text style={[styles.eyebrow, color ? { color } : undefined, style]}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.accent,
  },
});
