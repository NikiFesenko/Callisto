// @ts-nocheck
import React from 'react';
import { Text, XStack } from '@/src/components/ui/core';

const badgeTextColors = {
  positive: '#00FF88',
  negative: '#FF4D6A',
  neutral: '#94A3B8',
  info: '#6366F1',
  warning: '#FBB724',
};

const badgeBgColors = {
  positive: 'rgba(0, 255, 136, 0.12)',
  negative: 'rgba(255, 77, 106, 0.12)',
  neutral: 'rgba(148, 163, 184, 0.12)',
  info: 'rgba(99, 102, 241, 0.12)',
  warning: 'rgba(251, 191, 36, 0.12)',
};

interface StatusBadgeProps {
  label: string;
  variant?: keyof typeof badgeTextColors;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ label, variant = 'neutral', size = 'md', ...props }: StatusBadgeProps) {
  let paddingHorizontal = '$2';
  let paddingVertical = '$1';
  let fontSize = 12;

  if (size === 'sm') {
    paddingHorizontal = '$1.5';
    paddingVertical = 2;
    fontSize = 11;
  } else if (size === 'lg') {
    paddingHorizontal = '$3';
    paddingVertical = '$1.5';
    fontSize = 14;
  }

  return (
    <XStack
      paddingHorizontal={paddingHorizontal}
      paddingVertical={paddingVertical}
      borderRadius={8}
      alignItems="center"
      gap="$1"
      backgroundColor={badgeBgColors[variant]}
      accessibilityLabel={`Status: ${label}`}
      {...props}
    >
      <Text
        fontSize={fontSize}
        fontWeight="600"
        fontFamily="$mono"
        color={badgeTextColors[variant]}
      >
        {label}
      </Text>
    </XStack>
  );
}
