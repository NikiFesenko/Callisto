// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { YStack, styled, GetProps } from 'tamagui';

const SkeletonFrame = styled(YStack, {
  backgroundColor: 'rgba(30, 41, 59, 0.5)',
  borderRadius: 8,
  overflow: 'hidden',

  variants: {
    variant: {
      text: {
        height: 16,
        width: '60%',
        borderRadius: 4,
      },
      title: {
        height: 24,
        width: '40%',
        borderRadius: 6,
      },
      card: {
        height: 120,
        width: '100%',
        borderRadius: 12,
      },
      chart: {
        height: 200,
        width: '100%',
        borderRadius: 12,
      },
      circle: {
        height: 48,
        width: 48,
        borderRadius: 24,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'text',
  },
});

type SkeletonProps = GetProps<typeof SkeletonFrame>;

export function Skeleton(props: SkeletonProps) {
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

  return (
    <Animated.View style={{ opacity: animatedValue }}>
      <SkeletonFrame {...props} />
    </Animated.View>
  );
}
