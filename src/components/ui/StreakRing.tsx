import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { Colors, Fonts } from '../../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface StreakRingProps {
  streak: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  /** When true the ring fills completely — used to celebrate today's completion. */
  completed?: boolean;
}

export function StreakRing({ streak, size = 120, strokeWidth = 8, showLabel = true, completed = false }: StreakRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  // Full ring when lesson is done today; otherwise wrap at milestones 7 / 14 / 30 / 60 / 90.
  const milestone = streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : streak < 60 ? 60 : 90;
  const progress = completed ? 1 : Math.min((streak % milestone) / milestone, 1);

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Track ring */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={Colors.hairline}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/*
          Progress ring — rotated so it starts at 12 o'clock.
          Use SVG transform attribute on a G wrapper instead of the
          `rotation` + `origin` props, which get converted to the
          CSS `transform-origin` property and crash React DOM on web.
        */}
        <G transform={`rotate(-90 ${cx} ${cy})`}>
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={Colors.emerald500}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      {showLabel && (
        <View style={styles.label}>
          <Text style={styles.count}>{streak}</Text>
          <Text style={styles.unit}>DAYS</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    alignItems: 'center',
  },
  count: {
    fontFamily: Fonts.display,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.fg1,
    lineHeight: 36,
  },
  unit: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.fg3,
    letterSpacing: 1.5,
  },
});
