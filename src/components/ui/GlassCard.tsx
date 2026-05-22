import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: string | number;
  elevated?: boolean;
  style?: React.CSSProperties;
  width?: number | string;
  glow?: string;
  pressStyle?: any;
  animation?: string;
  accessibilityLabel?: string;
}

export function GlassCard({
  children,
  padding = '$4',
  elevated = false,
  style,
  width,
  className,
  glow,
  pressStyle,
  animation,
  accessibilityLabel,
  ...rest
}: GlassCardProps) {
  const p = typeof padding === 'string' && padding.startsWith('$')
    ? parseFloat(padding.slice(1)) * 4
    : padding;

  const glowClass = glow ? ` glow-${glow}` : '';

  return (
    <div
      className={`colisto-card${elevated ? '-elevated' : ''}${glowClass}${className ? ` ${className}` : ''}`}
      aria-label={accessibilityLabel}
      style={{
        padding: p,
        width,
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
