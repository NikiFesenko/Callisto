// @ts-nocheck
import React from 'react';
import { styled, Text, XStack, GetProps } from 'tamagui';

const BadgeFrame = styled(XStack, {
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: 8,
  alignItems: 'center',
  gap: '$1',

  variants: {
    variant: {
      positive: {
        backgroundColor: 'rgba(0, 255, 136, 0.12)',
      },
      negative: {
        backgroundColor: 'rgba(255, 77, 106, 0.12)',
      },
      neutral: {
        backgroundColor: 'rgba(148, 163, 184, 0.12)',
      },
      info: {
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
      },
      warning: {
        backgroundColor: 'rgba(251, 191, 36, 0.12)',
      },
    },
    size: {
      sm: {
        paddingHorizontal: '$1.5',
        paddingVertical: 2,
      },
      md: {
        paddingHorizontal: '$2',
        paddingVertical: '$1',
      },
      lg: {
        paddingHorizontal: '$3',
        paddingVertical: '$1.5',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'neutral',
    size: 'md',
  },
});

const badgeTextColors = {
  positive: '#00FF88',
  negative: '#FF4D6A',
  neutral: '#94A3B8',
  info: '#6366F1',
  warning: '#FBB724',
};

type StatusBadgeProps = GetProps<typeof BadgeFrame> & {
  label: string;
  variant?: keyof typeof badgeTextColors;
};

export function StatusBadge({ label, variant = 'neutral', ...props }: StatusBadgeProps) {
  return (
    <BadgeFrame variant={variant} {...props} accessibilityLabel={`Status: ${label}`}>
      <Text
        fontSize={props.size === 'sm' ? 11 : props.size === 'lg' ? 14 : 12}
        fontWeight="600"
        fontFamily="$mono"
        color={badgeTextColors[variant]}
      >
        {label}
      </Text>
    </BadgeFrame>
  );
}
