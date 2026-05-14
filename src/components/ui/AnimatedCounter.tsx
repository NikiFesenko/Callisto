// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Text, GetProps } from '@/src/components/ui/core';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
}

export function AnimatedCounter({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 2,
  fontSize = 28,
  color = '#E2E8F0',
  fontWeight = '700',
}: AnimatedCounterProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const from = previousValue.current;
    const to = value;
    previousValue.current = value;

    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value: progress }) => {
      const current = from + (to - from) * progress;
      setDisplayValue(current);
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, duration]);

  const formattedValue = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <Text
      fontFamily="$mono"
      fontSize={fontSize}
      fontWeight={fontWeight as any}
      color={color}
      accessibilityLabel={`${prefix}${formattedValue}${suffix}`}
    >
      {prefix}{formattedValue}{suffix}
    </Text>
  );
}
