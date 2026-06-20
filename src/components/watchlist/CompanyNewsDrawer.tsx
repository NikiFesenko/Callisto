// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { getStockColor, hexToRgb } from '@/src/lib/stockColors';
import { resolveGoogleNewsItem } from '@/src/lib/formatters';

interface NewsItem {
  title: string;
  summary: string;
  time: string;
  source: string;
  impact: 'high' | 'medium';
  link: string;
}

interface CompanyNewsDrawerProps {
  symbol: string;
  name: string;
  sector?: string;
  price: number;
  change24h: number;
  onClose: () => void;
}

async function fetchCompanyNews(symbol: string): Promise<NewsItem[]> {
  const res = await fetch(`/api/news/company?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error('fetch failed');
  const data: any[] = await res.json();
  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    title:   item.title   ?? '',
    summary: item.summary ?? '',
    time:    item.publishedAt
      ? (() => {
          const diffH = Math.floor((Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000);
          return diffH < 1 ? 'Just now' : diffH < 24 ? `${diffH}h ago` : `${Math.floor(diffH / 24)}d ago`;
        })()
      : '',
    source: item.source ?? 'Finnhub',
    impact: (item.impact ?? 'medium') as 'high' | 'medium',
    link:   item.url ?? '',
  }));
}

export function CompanyNewsDrawer({
  symbol, name, sector, price, change24h, onClose
}: CompanyNewsDrawerProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const color = getStockColor(sector);
  const { r, g, b } = hexToRgb(color);
  const isPositive = change24h >= 0;

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Fetch news
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchCompanyNews(symbol)
      .then(items => { if (alive) setNews(items); })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [symbol]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
          width: '100%', maxWidth: 420,
          background: 'rgba(5,10,24,0.97)',
          borderLeft: `1px solid rgba(${r},${g},${b},0.3)`,
          boxShadow: `-24px 0 64px rgba(0,0,0,0.8), 0 0 40px rgba(${r},${g},${b},0.1)`,
          display: 'flex', flexDirection: 'column',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 24px 20px',
          borderBottom: `1px solid rgba(${r},${g},${b},0.15)`,
          background: `rgba(${r},${g},${b},0.04)`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Color tag / icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `rgba(${r},${g},${b},0.15)`,
                border: `1px solid rgba(${r},${g},${b},0.4)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: color, fontFamily: 'monospace' }}>
                  {symbol.slice(0, 3)}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{symbol}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{name}</div>
              </div>
            </div>

            <button
              onClick={handleClose}
              style={{
                background: 'transparent', border: 'none',
                color: 'rgba(255,255,255,0.4)', fontSize: 24, cursor: 'pointer',
                padding: 0, lineHeight: 1, transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >
              ×
            </button>
          </div>

          {/* Price row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 16 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
              ${price.toFixed(2)}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: isPositive ? '#00FFA3' : '#F43F5E',
              background: isPositive ? 'rgba(0,255,163,0.1)' : 'rgba(244,63,94,0.1)',
              padding: '3px 10px', borderRadius: 100,
            }}>
              {isPositive ? '+' : ''}{change24h.toFixed(2)}%
            </div>
          </div>

          {/* Sector tag */}
          {sector && (
            <div style={{ marginTop: 12 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: color,
                background: `rgba(${r},${g},${b},0.12)`,
                border: `1px solid rgba(${r},${g},${b},0.3)`,
                padding: '3px 10px', borderRadius: 100,
              }}>
                {sector}
              </span>
            </div>
          )}
        </div>

        {/* News section */}
        <div style={{ padding: 20, flex: 1 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
            marginBottom: 16,
          }}>
            Latest Market News
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: `2px solid rgba(${r},${g},${b},0.15)`,
                borderTopColor: color,
                animation: 'drawer-spin 0.9s linear infinite',
              }} />
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                Fetching latest news for {symbol}…
              </div>
            </div>
          ) : news.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>
              No recent news found for {symbol}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {news.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: '14px 16px', borderRadius: 14,
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = `rgba(${r},${g},${b},0.07)`;
                    el.style.borderColor = `rgba(${r},${g},${b},0.25)`;
                    el.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'rgba(255,255,255,0.025)';
                    el.style.borderColor = 'rgba(255,255,255,0.07)';
                    el.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Impact + source row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', borderRadius: 100,
                      padding: '2px 8px',
                      background: item.impact === 'high' ? 'rgba(244,63,94,0.2)' : 'rgba(251,146,60,0.15)',
                      color: item.impact === 'high' ? '#F43F5E' : '#FB923C',
                    }}>
                      {item.impact} impact
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{item.time}</span>
                  </div>

                  {/* Title */}
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.45, marginBottom: 6 }}>
                    {item.title}
                  </div>

                  {/* Summary */}
                  {item.summary && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 8 }}>
                      {item.summary}
                    </div>
                  )}

                  {/* Source */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: color, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: color }}>{item.source}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>↗</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes drawer-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
