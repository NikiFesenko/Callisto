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

export function GlassCard({ children, padding = '$4', elevated = false, style, width, className, glow, pressStyle, animation, accessibilityLabel, ...rest }: GlassCardProps) {
  const p = typeof padding === 'string' && padding.startsWith('$') ? parseFloat(padding.slice(1)) * 4 : padding;
  
  let combinedClassName = "glass-card web3-glass-card";
  if (className) combinedClassName += ` ${className}`;
  if (glow) combinedClassName += ` glow-${glow}`;
  
  return (
    <div className={combinedClassName} aria-label={accessibilityLabel} style={{
      padding: p,
      borderRadius: 16,
      width,
      boxShadow: elevated ? '0 8px 32px rgba(0, 0, 0, 0.4)' : undefined,
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }} {...rest}>
      {children}
    </div>
  );
}
