import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { Colors, Fonts } from '../../constants/colors';

// ── Only these 4 routes appear in the tab bar ─────────────────────────────────
const VISIBLE_TABS = ['home', 'chat', 'discovery', 'profile'];

const TAB_LABELS: Record<string, string> = {
  home:      'Home',
  chat:      'Chat',
  discovery: 'Discovery',
  profile:   'Profile',
};

// ── SVG icon components ───────────────────────────────────────────────────────

function HomeIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* House outline */}
      <Path
        d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ChatIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Speech bubble with dots */}
      <Path
        d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx="9" cy="10" r="1" fill={color} />
      <Circle cx="12" cy="10" r="1" fill={color} />
      <Circle cx="15" cy="10" r="1" fill={color} />
    </Svg>
  );
}

function DiscoveryIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Compass */}
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.75} />
      <Path
        d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="1" fill={color} />
    </Svg>
  );
}

function ProfileIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Person silhouette */}
      <Circle
        cx="12"
        cy="8"
        r="4"
        stroke={color}
        strokeWidth={1.75}
      />
      <Path
        d="M4 20C4 17 7.58 14.5 12 14.5C16.42 14.5 20 17 20 20"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const TAB_ICONS: Record<string, (color: string) => React.ReactNode> = {
  home:      (c) => <HomeIcon      color={c} size={22} />,
  chat:      (c) => <ChatIcon      color={c} size={22} />,
  discovery: (c) => <DiscoveryIcon color={c} size={22} />,
  profile:   (c) => <ProfileIcon   color={c} size={22} />,
};

// ── Tab bar ───────────────────────────────────────────────────────────────────

export function KTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Filter to only the 4 visible tabs — lesson/journal have href:null and
  // must not appear even though they exist in state.routes.
  const visibleRoutes = state.routes.filter((r: any) =>
    VISIBLE_TABS.includes(r.name),
  );

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      {visibleRoutes.map((route: any) => {
        const globalIndex = state.routes.findIndex((r: any) => r.key === route.key);
        const isFocused   = state.index === globalIndex;
        const name        = route.name;
        const color       = isFocused ? Colors.emerald400 : Colors.fg4;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
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
            accessibilityRole="button"
            accessibilityLabel={TAB_LABELS[name]}
            accessibilityState={{ selected: isFocused }}
          >
            {/* Active pill highlight */}
            <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
              {TAB_ICONS[name]?.(color) ?? null}
            </View>

            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {TAB_LABELS[name] ?? name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.bg1,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 8,
    // Subtle elevation on Android
    elevation: 8,
    // Shadow on iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.emerald500 + '22',
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
    fontWeight: '600',
    color: Colors.emerald400,
  },
});
