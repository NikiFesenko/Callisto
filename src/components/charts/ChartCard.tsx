// @ts-nocheck
import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}

export function ChartCard({ title, subtitle, children, rightAction }: ChartCardProps) {
  return (
    <div className="colisto-card-elevated" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</div>
          )}
        </div>
        {rightAction}
      </div>
      {children}
    </div>
  );
}
