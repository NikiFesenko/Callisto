import React from 'react';

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, backgroundColor: 'var(--bg-surface)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        {children}
      </div>
    </div>
  );
}
