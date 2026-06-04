import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../../constants/colors';
import { SOSModal } from './SOSModal';

export function SOSButton() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const scale = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    setVisible(true);
  };

  return (
    <>
      <Animated.View
        style={[
          styles.wrapper,
          { top: insets.top + 10, transform: [{ scale }] },
        ]}
      >
        <TouchableOpacity
          style={styles.pill}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <View style={styles.dot} />
          <Text style={styles.label}>SOS</Text>
        </TouchableOpacity>
      </Animated.View>

      <SOSModal visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 20,
    zIndex: 200,
    shadowColor: Colors.sosRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.sosRed,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#fff',
    opacity: 0.9,
  },
  label: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.8,
  },
});
