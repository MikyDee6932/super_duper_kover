import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../../constants/colors';

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  home: { active: '⌂', inactive: '⌂' },
  chat: { active: '✦', inactive: '✦' },
  discovery: { active: '◎', inactive: '◎' },
  profile: { active: '◉', inactive: '◉' },
};

const TAB_LABELS: Record<string, string> = {
  home: 'Home',
  chat: 'Coach',
  discovery: 'Learn',
  profile: 'Profile',
};

export function KTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const key = route.name.replace('(app)/', '');

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
              <Text style={[styles.icon, isFocused && styles.iconActive]}>
                {TAB_ICONS[key]?.active ?? '·'}
              </Text>
            </View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {TAB_LABELS[key] ?? key}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.bg1,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.emerald500 + '22',
  },
  icon: {
    fontSize: 18,
    color: Colors.fg4,
  },
  iconActive: {
    color: Colors.emerald500,
  },
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    fontWeight: '500',
    color: Colors.fg4,
    letterSpacing: 0.3,
  },
  labelActive: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.emerald500,
    fontWeight: '600',
  },
});
