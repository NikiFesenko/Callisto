// @ts-nocheck
import React from 'react';
import { Card, styled, YStack, XStack, Text, GetProps } from 'tamagui';
import { Platform } from 'react-native';

const GlassCardFrame = styled(Card, {
  backgroundColor: 'rgba(17, 24, 39, 0.65)',
  borderWidth: 1,
  borderColor: 'rgba(30, 41, 59, 0.6)',
  borderRadius: 16,
  padding: '$4',
  overflow: 'hidden',
  
  variants: {
    elevated: {
      true: {
        elevation: 8,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
    },
    glow: {
      green: {
        borderColor: 'rgba(0, 255, 136, 0.2)',
        shadowColor: 'rgba(0, 255, 136, 0.1)',
      },
      red: {
        borderColor: 'rgba(255, 77, 106, 0.2)',
        shadowColor: 'rgba(255, 77, 106, 0.1)',
      },
      indigo: {
        borderColor: 'rgba(99, 102, 241, 0.3)',
        shadowColor: 'rgba(99, 102, 241, 0.1)',
      },
    },
  } as const,

  defaultVariants: {
    elevated: true,
  },
});

type GlassCardProps = GetProps<typeof GlassCardFrame> & {
  children: React.ReactNode;
};

export function GlassCard({ children, ...props }: GlassCardProps) {
  return (
    <GlassCardFrame
      {...props}
      {...(Platform.OS === 'web' ? {
        // @ts-ignore -- web-only style for backdrop blur
        style: { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
      } : {})}
    >
      {children}
    </GlassCardFrame>
  );
}
