// @ts-nocheck
import React from 'react';
import { View, Platform, StyleSheet, ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  elevated?: boolean;
  glow?: 'green' | 'red' | 'indigo';
  padding?: string | number;
}

const resolvePadding = (p?: string | number) => {
  if (typeof p === 'string' && p.startsWith('$')) {
    return parseFloat(p.slice(1)) * 4;
  }
  return p;
};

export function GlassCard({ children, elevated = true, glow, padding = '$4', style, ...props }: GlassCardProps) {
  const baseStyle: any = {
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: resolvePadding(padding),
    overflow: 'hidden',
  };

  if (elevated) {
    baseStyle.elevation = 8;
    baseStyle.shadowColor = 'rgba(0, 0, 0, 0.3)';
    baseStyle.shadowOffset = { width: 0, height: 4 };
    baseStyle.shadowOpacity = 0.3;
    baseStyle.shadowRadius = 12;
  }

  if (glow === 'green') {
    baseStyle.borderColor = 'rgba(0, 255, 136, 0.2)';
    baseStyle.shadowColor = 'rgba(0, 255, 136, 0.1)';
  } else if (glow === 'red') {
    baseStyle.borderColor = 'rgba(255, 77, 106, 0.2)';
    baseStyle.shadowColor = 'rgba(255, 77, 106, 0.1)';
  } else if (glow === 'indigo') {
    baseStyle.borderColor = 'rgba(99, 102, 241, 0.3)';
    baseStyle.shadowColor = 'rgba(99, 102, 241, 0.1)';
  }

  return (
    <View
      style={[
        baseStyle,
        Platform.OS === 'web' && {
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
