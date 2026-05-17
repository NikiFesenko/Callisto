import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'title' | 'card' | 'chart' | 'circle';
  width?: number | string;
  height?: number;
}

export function Skeleton({ variant = 'text', width: widthProp, height: heightProp }: SkeletonProps) {
  const baseStyle: React.CSSProperties = {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 8,
    overflow: 'hidden',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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

  if (widthProp != null) baseStyle.width = widthProp;
  if (heightProp != null) baseStyle.height = heightProp;

  return (
    <div style={baseStyle}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
    </div>
  );
}
