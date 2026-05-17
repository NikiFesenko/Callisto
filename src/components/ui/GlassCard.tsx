import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  padding?: string | number;
  elevated?: boolean;
  style?: React.CSSProperties;
  width?: number | string;
}

export function GlassCard({ children, padding = '$4', elevated = false, style, width }: GlassCardProps) {
  const p = typeof padding === 'string' && padding.startsWith('$') ? parseFloat(padding.slice(1)) * 4 : padding;
  
  return (
    <div className="glass-card" style={{
      padding: p,
      borderRadius: 16,
      width,
      boxShadow: elevated ? '0 8px 32px rgba(0, 0, 0, 0.4)' : undefined,
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}>
      {children}
    </div>
  );
}
