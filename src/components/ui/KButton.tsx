import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/colors';

type Variant = 'primary' | 'secondary' | 'text' | 'earned' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface KButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  full?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function KButton({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  full = false,
  disabled = false,
  loading = false,
  style,
}: KButtonProps) {
  const [pressed, setPressed] = useState(false);

  const containerStyle: ViewStyle = {
    ...styles.base,
    ...sizeStyles[size],
    ...variantStyles[variant].container,
    ...(full ? styles.full : {}),
    ...(disabled || loading ? styles.disabled : {}),
    ...(pressed && !disabled ? styles.pressed : {}),
    ...style,
  };

  const textStyle: TextStyle = {
    ...styles.text,
    ...sizeText[size],
    ...variantStyles[variant].text,
    ...(disabled || loading ? styles.disabledText : {}),
  };

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={() => !disabled && setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={1}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].text.color || Colors.cream50} size="small" />
      ) : (
        <Text style={textStyle}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  full: { width: '100%' },
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.45 },
  text: { fontFamily: 'Manrope_700Bold', fontWeight: '700' },
  disabledText: { color: Colors.fg4 },
});

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingHorizontal: 18, paddingVertical: 10 },
  md: { paddingHorizontal: 28, paddingVertical: 16 },
  lg: { paddingHorizontal: 32, paddingVertical: 18 },
};

const sizeText: Record<Size, TextStyle> = {
  sm: { fontSize: 13 },
  md: { fontSize: 16 },
  lg: { fontSize: 17 },
};

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: Colors.emerald500 },
    text: { color: Colors.cream50 },
  },
  secondary: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.hairlineStrong },
    text: { color: Colors.cream50 },
  },
  text: {
    container: { backgroundColor: 'transparent', paddingHorizontal: 4, paddingVertical: 8 },
    text: { color: Colors.cream50 },
  },
  earned: {
    container: {
      backgroundColor: Colors.emerald500,
      shadowColor: Colors.emerald500,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    text: { color: Colors.cream50 },
  },
  danger: {
    container: { backgroundColor: Colors.sosRed },
    text: { color: Colors.cream50 },
  },
};
