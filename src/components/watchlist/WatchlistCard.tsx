// @ts-nocheck — Tamagui v2 RC index-signature strict typing
import React, { useState } from 'react';
import { YStack, XStack, Text } from '@/src/components/ui/core';
import { Colors } from '@/src/lib/constants';
import { formatUSD } from '@/src/lib/formatters';
import { useWatchlistStore } from '@/src/store/useWatchlistStore';
import { getStockColor, hexToRgb } from '@/src/lib/stockColors';
import { CompanyNewsDrawer } from './CompanyNewsDrawer';

interface WatchlistCardProps {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  sector?: string;
  country?: string;
  lat?: number;
  lng?: number;
  liveLoading?: boolean;
}

export function WatchlistCard({ symbol, name, price, change24h, sector, liveLoading }: WatchlistCardProps) {
  const isPositive = change24h >= 0;
  const { removeSymbol } = useWatchlistStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const color = getStockColor(sector);
  const { r, g, b } = hexToRgb(color);

  return (
    <>
      <div
        onClick={() => setDrawerOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px',
          borderBottom: `1px solid ${Colors.borderSubtle}`,
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = Colors.bgHover)}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Color Tag Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: `rgba(${r},${g},${b},0.12)`,
          border: `1px solid rgba(${r},${g},${b},0.35)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: color, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
            {symbol.slice(0, 3)}
          </span>
        </div>

        {/* Name + sector */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: Colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {symbol}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: color, boxShadow: `0 0 5px ${color}`,
            }} />
            <span style={{ fontSize: 11, color: Colors.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {sector || name}
            </span>
          </div>
        </div>

        {/* Price + change */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: Colors.textPrimary, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
            {liveLoading ? (
              <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', borderTopColor: '#00FFA3', display: 'inline-block', animation: 'wl-spin 0.8s linear infinite' }} />
            ) : null}
            {formatUSD(price)}
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, marginTop: 2,
            color: isPositive ? '#00FFA3' : '#F43F5E',
          }}>
            {isPositive ? '+' : ''}{change24h.toFixed(2)}%
          </div>
        </div>

        {/* Remove button */}
        <button
          onClick={e => { e.stopPropagation(); removeSymbol(symbol); }}
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: 'rgba(244,63,94,0.08)',
            border: '1px solid rgba(244,63,94,0.2)',
            color: '#F43F5E', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(244,63,94,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(244,63,94,0.08)';
          }}
          title="Remove from watchlist"
        >
          ×
        </button>
      </div>

      {/* Company News Drawer */}
      {drawerOpen && (
        <CompanyNewsDrawer
          symbol={symbol}
          name={name}
          sector={sector}
          price={price}
          change24h={change24h}
          onClose={() => setDrawerOpen(false)}
        />
      )}
      <style>{`@keyframes wl-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
