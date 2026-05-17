import React from 'react';
import { Colors } from '@/src/lib/constants';

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, backgroundColor: Colors.bgBase, overflowY: 'auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {children}
      </div>
    </div>
  );
}
