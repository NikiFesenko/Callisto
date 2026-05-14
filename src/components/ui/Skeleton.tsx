// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface SkeletonProps {
  variant?: 'text' | 'title' | 'card' | 'chart' | 'circle';
}

export function Skeleton({ variant = 'text' }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const baseStyle: ViewStyle = {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 8,
    overflow: 'hidden',
  };

  if (variant === 'text') {
    baseStyle.height = 16;
    baseStyle.width = '60%';
    baseStyle.borderRadius = 4;
  } else if (variant === 'title') {
    baseStyle.height = 24;
    baseStyle.width = '40%';
    baseStyle.borderRadius = 6;
  } else if (variant === 'card') {
    baseStyle.height = 120;
    baseStyle.width = '100%';
    baseStyle.borderRadius = 12;
  } else if (variant === 'chart') {
    baseStyle.height = 200;
    baseStyle.width = '100%';
    baseStyle.borderRadius = 12;
  } else if (variant === 'circle') {
    baseStyle.height = 48;
    baseStyle.width = 48;
    baseStyle.borderRadius = 24;
  }

  return (
    <Animated.View style={[baseStyle, { opacity: animatedValue }]} />
  );
}
