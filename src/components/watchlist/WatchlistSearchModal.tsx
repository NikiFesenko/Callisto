// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { Colors } from '@/src/lib/constants';
import { useWatchlistStore } from '@/src/store/useWatchlistStore';
import { formatUSD } from '@/src/lib/formatters';
import { getStockColor, hexToRgb } from '@/src/lib/stockColors';
import topStocksData from '@/src/lib/data/top_stocks.json';

interface WatchlistSearchModalProps {
  onClose: () => void;
}

export function WatchlistSearchModal({ onClose }: WatchlistSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { toggleSymbol, hasSymbol } = useWatchlistStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const filteredStocks = useMemo(() => {
    const stocks = topStocksData as any[];
    if (!searchQuery.trim()) return stocks.slice(0, 25);
    const q = searchQuery.toLowerCase();
    return stocks
      .filter(s =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.sector || '').toLowerCase().includes(q)
      )
      .slice(0, 60);
  }, [searchQuery]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />

      <div style={{
        position: 'relative', width: '92%', maxWidth: 520, height: '82vh',
        background: 'rgba(9,9,11,0.97)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: 20,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.9), 0 0 40px rgba(139,92,246,0.1)',
        animation: 'scaleUp 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: Colors.textPrimary }}>Add to Watchlist</div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>
              {topStocksData.length} global companies
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: Colors.textSecondary, fontSize: 26,
              cursor: 'pointer', padding: 0, lineHeight: 1
            }}
          >×</button>
        </div>

        {/* Search */}
        <input
          autoFocus
          placeholder="Search by symbol, name, or sector…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '13px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: Colors.textPrimary, fontSize: 15, outline: 'none',
            boxSizing: 'border-box', marginBottom: 12,
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        />

        {/* Legend */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {['Technology', 'Financials', 'Healthcare', 'Energy', 'Consumer Discretionary', 'Industrials'].map(sec => {
            const c = getStockColor(sec);
            const { r, g, b } = hexToRgb(c);
            return (
              <button
                key={sec}
                onClick={() => setSearchQuery(sec)}
                style={{
                  padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: `rgba(${r},${g},${b},0.12)`,
                  border: `1px solid rgba(${r},${g},${b},0.3)`,
                  color: c, cursor: 'pointer',
                }}
              >
                {sec}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filteredStocks.length === 0 ? (
            <div style={{ color: Colors.textSecondary, textAlign: 'center', padding: '32px 0', fontSize: 14 }}>
              No assets found
            </div>
          ) : filteredStocks.map((stock: any) => {
            const isAdded = mounted ? hasSymbol(stock.symbol) : false;
            const isPositive = stock.change24h >= 0;
            const color = getStockColor(stock.sector);
            const { r, g, b } = hexToRgb(color);

            return (
              <div
                key={stock.symbol}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 12,
                  background: isAdded ? `rgba(${r},${g},${b},0.07)` : 'rgba(255,255,255,0.02)',
                  border: isAdded ? `1px solid rgba(${r},${g},${b},0.25)` : '1px solid rgba(255,255,255,0.04)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!isAdded) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.045)';
                }}
                onMouseLeave={e => {
                  if (!isAdded) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                {/* Color tag icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: `rgba(${r},${g},${b},0.12)`,
                  border: `1px solid rgba(${r},${g},${b},0.3)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color, fontFamily: 'monospace' }}>
                    {stock.symbol.slice(0, 3)}
                  </span>
                </div>

                {/* Name info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: Colors.textPrimary }}>
                    {stock.symbol}
                  </div>
                  <div style={{ fontSize: 11, color: Colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {stock.name}
                    {stock.sector && (
                      <span style={{ marginLeft: 6, color: color, fontWeight: 600 }}>· {stock.sector}</span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: Colors.textPrimary, fontFamily: 'monospace' }}>
                    {formatUSD(stock.price)}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isPositive ? '#00FFA3' : '#F43F5E' }}>
                    {isPositive ? '+' : ''}{stock.change24h.toFixed(2)}%
                  </div>
                </div>

                {/* Toggle button */}
                <button
                  onClick={() => toggleSymbol(stock.symbol)}
                  style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: isAdded ? 'rgba(244,63,94,0.12)' : `rgba(${r},${g},${b},0.12)`,
                    border: isAdded ? '1px solid rgba(244,63,94,0.3)' : `1px solid rgba(${r},${g},${b},0.35)`,
                    color: isAdded ? '#F43F5E' : color,
                    fontSize: 18, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isAdded ? '−' : '+'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
