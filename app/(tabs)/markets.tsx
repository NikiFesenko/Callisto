// @ts-nocheck
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWatchlistStore } from '@/src/store/useWatchlistStore';
import { getStockColor } from '@/src/lib/stockColors';
import { CompanyNewsDrawer } from '@/src/components/watchlist/CompanyNewsDrawer';
import topStocksData from '@/src/lib/data/top_stocks.json';
import { GEO_HOTSPOTS, SEVERITY_PULSE, type GeoHotspot } from '@/src/lib/geoHotspots';

// ─── Financial Regions ────────────────────────────────────────────────────────
const FINANCIAL_REGIONS = [
  {
    name: 'North America',
    exchanges: 'NYSE · NASDAQ · TSX',
    color: '#00D4FF',
    glow: 'rgba(0,212,255,0.5)',
    countries: ['United States of America', 'Canada', 'Mexico'],
  },
  {
    name: 'Europe',
    exchanges: 'LSE · Euronext · XETRA',
    color: '#9D6FFF',
    glow: 'rgba(157,111,255,0.5)',
    countries: [
      'United Kingdom', 'Germany', 'France', 'Italy', 'Spain',
      'Netherlands', 'Switzerland', 'Sweden', 'Norway', 'Denmark',
      'Belgium', 'Austria', 'Poland', 'Portugal', 'Finland',
      'Ireland', 'Greece', 'Czech Republic', 'Hungary', 'Romania',
    ],
  },
  {
    name: 'Asia Pacific',
    exchanges: 'TSE · SSE · HKEX · ASX',
    color: '#00FFA3',
    glow: 'rgba(0,255,163,0.5)',
    countries: [
      'Japan', 'China', 'Hong Kong', 'South Korea', 'Australia',
      'India', 'Singapore', 'Taiwan', 'Indonesia', 'Malaysia',
      'Thailand', 'New Zealand', 'Philippines', 'Vietnam', 'Pakistan',
    ],
  },
  {
    name: 'Middle East',
    exchanges: 'Tadawul · DFM · ADX',
    color: '#FFB800',
    glow: 'rgba(255,184,0,0.5)',
    countries: [
      'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait',
      'Bahrain', 'Oman', 'Israel', 'Turkey', 'Iran', 'Iraq',
    ],
  },
  {
    name: 'Latin America',
    exchanges: 'B3 · BMV · BVL',
    color: '#FF4D8D',
    glow: 'rgba(255,77,141,0.5)',
    countries: ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Ecuador', 'Bolivia'],
  },
  {
    name: 'Africa',
    exchanges: 'JSE · NSE · EGX',
    color: '#FB923C',
    glow: 'rgba(251,146,60,0.5)',
    countries: ['South Africa', 'Nigeria', 'Egypt', 'Kenya', 'Morocco', 'Ghana', 'Ethiopia', 'Tanzania'],
  },
];

// ─── Mock News Data ───────────────────────────────────────────────────────────
const REGION_NEWS: Record<string, Array<{ title: string; summary: string; time: string; source: string; impact: 'high' | 'medium' | 'low'; link: string }>> = {
  'North America': [
    { title: 'Fed Signals Potential Rate Cut in Q3', summary: 'Federal Reserve chair indicates inflation cooling faster than expected, prompting tech rally.', time: '2h ago', source: 'Bloomberg', impact: 'high', link: '#' },
    { title: 'SEC Approves New Crypto Spot ETFs', summary: 'Regulatory body greenlights several spot Ethereum ETFs, boosting crypto market capitalization.', time: '5h ago', source: 'CoinDesk', impact: 'high', link: '#' },
    { title: 'Tech Giants Announce AI Infrastructure Fund', summary: 'Major silicon valley companies pool $50B for decentralized AI computing networks.', time: '12h ago', source: 'Reuters', impact: 'medium', link: '#' },
  ],
  'Europe': [
    { title: 'ECB Maintains Interest Rates', summary: 'European Central Bank holds rates steady amid mixed economic signals from Germany and France.', time: '1h ago', source: 'Financial Times', impact: 'high', link: '#' },
    { title: 'MiCA Framework Fully Implemented', summary: 'EU finalizes crypto-asset regulatory framework, bringing clarity to continental exchanges.', time: '4h ago', source: 'CoinTelegraph', impact: 'high', link: '#' },
    { title: 'LSE Welcomes First Blockchain Bonds', summary: 'London Stock Exchange successfully pilots tokenized bond issuance on public ledger.', time: '8h ago', source: 'Reuters', impact: 'medium', link: '#' },
  ],
  'Asia Pacific': [
    { title: 'BOJ Considers Yield Curve Control Tweak', summary: 'Bank of Japan hints at policy normalization, sending ripples through Asian tech equities.', time: '3h ago', source: 'Nikkei Asia', impact: 'high', link: '#' },
    { title: 'HKEX Crypto ETF Trading Surges', summary: 'Hong Kong crypto ETFs see record daily volume as mainland investors seek exposure.', time: '6h ago', source: 'South China Morning Post', impact: 'high', link: '#' },
    { title: 'PBOC Announces Digital Yuan Expansion', summary: 'China pushes further adoption of CBDC in cross-border settlements with regional partners.', time: '14h ago', source: 'Bloomberg', impact: 'medium', link: '#' },
  ],
  'Middle East': [
    { title: 'UAE Unveils Golden Visa for Web3 Founders', summary: 'Dubai and Abu Dhabi expand residency programs to attract global blockchain talent.', time: '4h ago', source: 'Gulf News', impact: 'medium', link: '#' },
    { title: 'Tadawul Hits All-Time High', summary: 'Saudi stock exchange rallies on energy sector profits and tech diversification plans.', time: '7h ago', source: 'Al Jazeera', impact: 'high', link: '#' },
    { title: 'Sovereign Fund Allocates to Bitcoin', summary: 'Major regional sovereign wealth fund reportedly beginning direct Bitcoin purchases.', time: '1d ago', source: 'CoinDesk', impact: 'high', link: '#' },
  ],
  'Latin America': [
    { title: 'Brazil Central Bank advances DREX Phase 2', summary: 'Brazilian digital currency testing moves to smart contract functionality with major banks.', time: '5h ago', source: 'Reuters', impact: 'medium', link: '#' },
    { title: 'Argentina Crypto Adoption Accelerates', summary: 'Inflation hedges drive record volume on local exchanges as regulations soften.', time: '9h ago', source: 'CoinTelegraph', impact: 'high', link: '#' },
    { title: 'B3 Exchange Lists Solana ETP', summary: 'Brazilian stock exchange expands crypto offerings with new Solana exchange-traded product.', time: '1d ago', source: 'Bloomberg', impact: 'medium', link: '#' },
  ],
  'Africa': [
    { title: 'Nigeria Lifts Banking Ban on Crypto', summary: 'Central Bank of Nigeria issues new guidelines allowing banks to service crypto firms.', time: '2h ago', source: 'Financial Times', impact: 'high', link: '#' },
    { title: 'Mobile Money Interoperability Network Launches', summary: 'Pan-African payments network goes live, integrating with major stablecoins.', time: '6h ago', source: 'TechCrunch', impact: 'high', link: '#' },
    { title: 'JSE Proposes Carbon Credit Tokenization', summary: 'Johannesburg Stock Exchange plans to list tokenized green assets to fund transition.', time: '1d ago', source: 'Reuters', impact: 'medium', link: '#' },
  ]
};

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function getRegion(countryName: string) {
  if (!countryName) return null;
  return FINANCIAL_REGIONS.find(region =>
    region.countries.some(c =>
      countryName.toLowerCase().includes(c.toLowerCase()) ||
      c.toLowerCase().includes(countryName.toLowerCase())
    )
  ) || null;
}

// ─── Fly targets ──────────────────────────────────────────────────────────────
const FLY_TARGETS: Record<string, { lat: number; lng: number; altitude: number }> = {
  'North America': { lat: 45, lng: -100, altitude: 1.6 },
  'Europe':        { lat: 50, lng:   15, altitude: 1.5 },
  'Asia Pacific':  { lat: 20, lng:  115, altitude: 1.6 },
  'Middle East':   { lat: 27, lng:   47, altitude: 1.7 },
  'Latin America': { lat: -15, lng: -58, altitude: 1.7 },
  'Africa':        { lat:  0, lng:   25, altitude: 1.7 },
};

// ─── Generate solid dark canvas texture ───────────────────────────────────────
function makeDarkTexture(color = '#030C1A'): string {
  const cv = document.createElement('canvas');
  cv.width = 4; cv.height = 4;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 4, 4);
  return cv.toDataURL();
}

// ─── Pre-generate stable star positions ──────────────────────────────────────
const STARS = Array.from({ length: 150 }, (_, i) => ({
  id: i,
  left: (i * 137.508 % 100).toFixed(2),
  top: (i * 97.3 % 100).toFixed(2),
  size: i % 7 === 0 ? 2 : 1,
  opacity: (0.15 + (i % 5) * 0.1).toFixed(2),
  dur: (2 + (i % 4)).toFixed(1),
  delay: (i % 3).toFixed(1),
}));

// ─── GeoNewsDrawer ─────────────────────────────────────────────────────────────
function GeoNewsDrawer({ hotspot, onClose }: { hotspot: GeoHotspot; onClose: () => void }) {
  const [news, setNews] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [visible, setVisible] = React.useState(false);

  const HIGH_IMPACT_WORDS = ['war','attack','sanction','missile','coup','conflict','ceasefire','invasion','airstrike','nuclear','protest','explosion','crisis','rally','plunge','surge','ban','embargo'];

  React.useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const q = encodeURIComponent(hotspot.newsQuery);
        const rssUrl = encodeURIComponent(`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`);
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        const data = await res.json();
        if (data.status === 'ok' && data.items && alive) {
          const parsed = data.items.slice(0, 7).map((item: any) => {
            const parts = item.title.split(' - ');
            const source = parts.length > 1 ? parts.pop()!.trim() : 'News';
            const title = parts.join(' - ').trim();
            const text = (title + ' ' + (item.description || '')).toLowerCase();
            const isHigh = HIGH_IMPACT_WORDS.some(w => text.includes(w));
            const pubDate = new Date(item.pubDate);
            const diffH = Math.floor((Date.now() - pubDate.getTime()) / 3_600_000);
            const timeStr = diffH < 1 ? 'Just now' : diffH < 24 ? `${diffH}h ago` : `${Math.floor(diffH/24)}d ago`;
            const summary = (item.description || '').replace(/<[^>]+>/g, '').replace(/\s+/g,' ').trim().slice(0,130);
            return { title, summary: summary ? summary + '…' : '', time: timeStr, source, impact: isHigh ? 'high' : 'medium', link: item.link };
          });
          setNews(parsed);
        }
      } catch(e) { console.error(e); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [hotspot.id]);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 300); };
  const { r, g, b } = hexToRgb(hotspot.color);
  const severityLabel = hotspot.severity === 'critical' ? '🔴 CRITICAL' : hotspot.severity === 'high' ? '🟠 HIGH RISK' : '🟡 MEDIUM RISK';

  return (
    <>
      <div onClick={handleClose} style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)',opacity:visible?1:0,transition:'opacity 0.3s ease' }} />
      <div style={{
        position:'fixed',top:0,right:0,bottom:0,zIndex:201,
        width:'100%',maxWidth:440,
        background:'rgba(5,8,20,0.98)',
        borderLeft:`1px solid rgba(${r},${g},${b},0.35)`,
        boxShadow:`-24px 0 64px rgba(0,0,0,0.85), 0 0 40px rgba(${r},${g},${b},0.12)`,
        display:'flex',flexDirection:'column',
        transform:visible?'translateX(0)':'translateX(100%)',
        transition:'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
        overflowY:'auto',
      }}>
        {/* Header */}
        <div style={{ padding:'24px 24px 20px', borderBottom:`1px solid rgba(${r},${g},${b},0.12)`, background:`rgba(${r},${g},${b},0.04)`, flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {/* Diamond icon */}
              <div style={{ width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <div style={{ width:22,height:22,background:hotspot.color,transform:'rotate(45deg)',borderRadius:3,boxShadow:`0 0 16px ${hotspot.color}` }} />
              </div>
              <div>
                <div style={{ fontSize:19,fontWeight:800,color:'#fff',lineHeight:1.2 }}>{hotspot.name}</div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:2 }}>{hotspot.region}</div>
              </div>
            </div>
            <button onClick={handleClose} style={{ background:'transparent',border:'none',color:'rgba(255,255,255,0.4)',fontSize:24,cursor:'pointer',padding:0,lineHeight:1,transition:'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='#fff'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.4)'}>×</button>
          </div>
          {/* Severity */}
          <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:11,fontWeight:700,letterSpacing:'0.08em',color:hotspot.color,background:`rgba(${r},${g},${b},0.12)`,border:`1px solid rgba(${r},${g},${b},0.3)`,padding:'3px 10px',borderRadius:100 }}>
              {severityLabel}
            </span>
            <span style={{ fontSize:11,color:'rgba(255,255,255,0.35)' }}>Geopolitical Impact</span>
          </div>
        </div>

        {/* News */}
        <div style={{ padding:20,flex:1 }}>
          <div style={{ fontSize:11,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',marginBottom:14 }}>
            Market-Impacting News
          </div>
          {loading ? (
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',padding:'40px 0',gap:14 }}>
              <div style={{ width:34,height:34,borderRadius:'50%',border:`2px solid rgba(${r},${g},${b},0.15)`,borderTopColor:hotspot.color,animation:'geo-drawer-spin 0.9s linear infinite' }} />
              <div style={{ color:'rgba(255,255,255,0.35)',fontSize:13 }}>Fetching geopolitical news…</div>
            </div>
          ) : news.length === 0 ? (
            <div style={{ color:'rgba(255,255,255,0.4)',textAlign:'center',padding:'32px 0',fontSize:14 }}>No recent news found.</div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {news.map((item:any, i:number) => (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" style={{ display:'block',padding:'14px 16px',borderRadius:14,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',textDecoration:'none',transition:'all 0.2s ease' }}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background=`rgba(${r},${g},${b},0.07)`;el.style.borderColor=`rgba(${r},${g},${b},0.25)`;el.style.transform='translateY(-1px)';}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='rgba(255,255,255,0.02)';el.style.borderColor='rgba(255,255,255,0.06)';el.style.transform='translateY(0)';}}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7 }}>
                    <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',borderRadius:100,padding:'2px 8px',background:item.impact==='high'?'rgba(244,63,94,0.18)':'rgba(251,146,60,0.14)',color:item.impact==='high'?'#F43F5E':'#FB923C' }}>{item.impact} impact</span>
                    <span style={{ fontSize:11,color:'rgba(255,255,255,0.28)' }}>{item.time}</span>
                  </div>
                  <div style={{ fontSize:14,fontWeight:700,color:'#fff',lineHeight:1.45,marginBottom:6 }}>{item.title}</div>
                  {item.summary && <div style={{ fontSize:12,color:'rgba(255,255,255,0.48)',lineHeight:1.5,marginBottom:8 }}>{item.summary}</div>}
                  <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                    <div style={{ width:6,height:6,borderRadius:'50%',background:hotspot.color,flexShrink:0 }} />
                    <span style={{ fontSize:11,fontWeight:600,color:hotspot.color }}>{item.source}</span>
                    <span style={{ fontSize:11,color:'rgba(255,255,255,0.22)' }}>↗</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes geo-drawer-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ─── News of the Day Widget ───────────────────────────────────────────────────
function NewsOfDay() {
  const [headlines, setHeadlines] = React.useState<any[]>([]);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const timerRef = React.useRef<any>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Simplified query that Google News RSS supports
        const query = 'stock market OR geopolitical OR oil price OR Fed OR war OR sanctions';
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (!alive) return;
        if (data.status === 'ok' && Array.isArray(data.items) && data.items.length) {
          const HIGH = ['war','attack','sanction','rate cut','rate hike','crash','plunge','surge','ceasefire','fed','invasion','nuclear','missiles','tariff'];
          const parsed = data.items.slice(0, 6).map((item: any) => {
            const parts = (item.title || '').split(' - ');
            const source = parts.length > 1 ? parts.pop()!.trim() : 'News';
            const title = parts.join(' - ').trim();
            const isBreaking = HIGH.some(w => title.toLowerCase().includes(w));
            const pubDate = new Date(item.pubDate);
            const diffH = Math.floor((Date.now() - pubDate.getTime()) / 3_600_000);
            const timeStr = diffH < 1 ? 'Just now' : diffH < 24 ? `${diffH}h ago` : `${Math.floor(diffH / 24)}d ago`;
            return { title, source, timeStr, isBreaking, link: item.link };
          });
          setHeadlines(parsed);
        } else {
          setFetchError(true);
        }
      } catch (_) {
        if (alive) setFetchError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Auto-cycle
  React.useEffect(() => {
    if (!headlines.length || expanded) return;
    timerRef.current = setInterval(() => setActiveIdx(i => (i + 1) % headlines.length), 6000);
    return () => clearInterval(timerRef.current);
  }, [headlines.length, expanded]);

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const active = headlines[activeIdx];

  return (
    <div style={{ position: 'absolute', bottom: 28, left: 28, zIndex: 20, width: expanded ? 380 : 320, transition: 'width 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
      <div style={{ background: 'rgba(5,9,22,0.94)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', boxShadow: '0 8px 40px rgba(0,0,0,0.75)', overflow: 'hidden' }}>

        {/* Header — always clickable */}
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 9px', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setExpanded(e => !e)}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F43F5E', boxShadow: '0 0 8px #F43F5E', animation: 'live-pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>News of the Day</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#FFB800', background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.25)', padding: '1px 7px', borderRadius: 100 }}>{today}</span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{expanded ? '▼' : '▲'}</span>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(244,63,94,0.15)', borderTopColor: '#F43F5E', animation: 'geo-drawer-spin 0.8s linear infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Loading headlines…</span>
          </div>
        ) : fetchError || !headlines.length ? (
          <div style={{ padding: '14px', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Could not load headlines. Check connection.</div>
        ) : (
          <>
            {/* Active headline */}
            {active && (
              <a href={active.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '11px 14px 8px', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  {active.isBreaking
                    ? <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#F43F5E', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)', padding: '1px 7px', borderRadius: 100 }}>⚡ Breaking</span>
                    : <span />}
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>{active.timeStr}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.5, marginBottom: 6 }}>{active.title}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>{active.source}</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>↗</span>
                </div>
              </a>
            )}

            {/* Expanded list */}
            {expanded && headlines.length > 1 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {headlines.map((h: any, i: number) => i === activeIdx ? null : (
                  <a key={i} href={h.link} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', gap: 8, padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    {h.isBreaking && <span style={{ fontSize: 9, color: '#F43F5E', flexShrink: 0, marginTop: 2 }}>⚡</span>}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.78)', lineHeight: 1.4, marginBottom: 2 }}>{h.title}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{h.source} · {h.timeStr}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Dot navigation */}
            {headlines.length > 1 && !expanded && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '7px 14px 11px' }}>
                {headlines.map((_: any, i: number) => (
                  <div key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveIdx(i); clearInterval(timerRef.current); }}
                    style={{ width: i === activeIdx ? 16 : 5, height: 5, borderRadius: 100, background: i === activeIdx ? '#F43F5E' : 'rgba(255,255,255,0.18)', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: i === activeIdx ? '0 0 8px #F43F5E' : 'none' }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MarketsScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const activeRegionRef = useRef<string | null>(null);
  const hoveredRegionRef = useRef<string | null>(null);

  const { symbols: watchlistSymbols } = useWatchlistStore();
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<GeoHotspot | null>(null);

  // Hover tooltip state — React overlay (avoids globe.gl overflow:hidden clipping)
  const [hoveredHotspot, setHoveredHotspot] = useState<GeoHotspot | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{x: number; y: number} | null>(null);
  const [hotspotHeadlines, setHotspotHeadlines] = useState<Record<string, {title: string; source: string; timeStr: string; link: string} | null>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [fetchedNews, setFetchedNews] = useState<Record<string, any[]>>({});
  const [isFetchingNews, setIsFetchingNews] = useState(false);

  // Fetch real news when modal opens
  useEffect(() => {
    if (!isNewsModalOpen || !activeRegion) return;
    if (fetchedNews[activeRegion]) return; // Already fetched

    let isMounted = true;
    const fetchNews = async () => {
      setIsFetchingNews(true);
      try {
        // Build an RSS URL that searches Google News for finance/crypto/stock news regarding the region
        const query = encodeURIComponent(`(finance OR crypto OR stock OR market) "${activeRegion}"`);
        const rssUrl = encodeURIComponent(`https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`);
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;
        
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        if (data.status === 'ok' && data.items && isMounted) {
          const parsedNews = data.items.slice(0, 5).map((item: any) => {
            // Google News RSS titles usually look like: "Real Title - Source Name"
            const parts = item.title.split(' - ');
            const source = parts.length > 1 ? parts.pop() : 'News';
            const title = parts.join(' - ');
            
            // Generate mock impact based on keywords
            const textToSearch = (title + ' ' + item.description).toLowerCase();
            const isHigh = ['crash', 'surge', 'rate', 'fed', 'sec', 'banned', 'record', 'plunge', 'jump', 'all-time high'].some(w => textToSearch.includes(w));
            
            // Format time
            const pubDate = new Date(item.pubDate);
            const now = new Date();
            const diffHours = Math.floor((now.getTime() - pubDate.getTime()) / (1000 * 60 * 60));
            const timeStr = diffHours < 1 ? 'Just now' : diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours/24)}d ago`;

            return {
              title,
              summary: item.description?.replace(/<[^>]+>/g, '').slice(0, 120) + '...', // Strip HTML
              time: timeStr,
              source,
              impact: isHigh ? 'high' : 'medium',
              link: item.link
            };
          });
          
          setFetchedNews(prev => ({ ...prev, [activeRegion]: parsedNews }));
        }
      } catch (err) {
        console.error('Error fetching news:', err);
      } finally {
        if (isMounted) setIsFetchingNews(false);
      }
    };
    
    fetchNews();
    
    return () => { isMounted = false; };
  }, [isNewsModalOpen, activeRegion, fetchedNews]);

  // Keep refs in sync so globe.gl callbacks always have fresh values
  useEffect(() => { activeRegionRef.current = activeRegion; }, [activeRegion]);
  useEffect(() => { hoveredRegionRef.current = hoveredRegion; }, [hoveredRegion]);

  // ── Globe initialization ─────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let Globe: any;
    let globe: any;
    let destroyed = false;

    (async () => {
      try {
        // Dynamic import so Vite can chunk it separately
        const mod = await import('globe.gl');
        Globe = mod.default ?? mod;

        if (destroyed || !containerRef.current) return;

        // Fetch world countries GeoJSON
        let geoData: { features: any[] } = { features: [] };
        try {
          const res = await fetch(
            'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson'
          );
          if (res.ok) geoData = await res.json();
        } catch {
          // Features will be empty — globe still renders, just no borders
        }

        if (destroyed || !containerRef.current) return;

        const el = containerRef.current;
        const W = el.offsetWidth  || window.innerWidth;
        const H = el.offsetHeight || window.innerHeight - 64;

        // Dark canvas texture so the sphere is visible
        const darkTexture = makeDarkTexture('#030D1C');

        globe = Globe({ animateIn: false })(el);

        globe
          .width(W)
          .height(H)
          .backgroundColor('rgba(0,0,0,0)')
          .globeImageUrl(darkTexture)
          .showAtmosphere(true)
          .atmosphereColor('#1255CC')
          .atmosphereAltitude(0.14)
          .showGraticules(false)
          .enablePointerInteraction(true);

        // Country polygons
        globe
          .polygonsData(geoData.features)
          .polygonAltitude((feat: any) => {
            const name = feat?.properties?.ADMIN ?? feat?.properties?.name ?? '';
            return getRegion(name) ? 0.006 : 0.001;
          })
          .polygonCapColor((feat: any) => {
            const name = feat?.properties?.ADMIN ?? feat?.properties?.name ?? '';
            const region = getRegion(name);
            if (!region) return 'rgba(8, 22, 48, 0.75)';
            const { r, g, b } = hexToRgb(region.color);
            const isHighlighted =
              hoveredRegionRef.current === region.name ||
              activeRegionRef.current  === region.name;
            return isHighlighted
              ? `rgba(${r},${g},${b},0.50)`
              : `rgba(${r},${g},${b},0.18)`;
          })
          .polygonSideColor(() => 'rgba(0,0,0,0)')
          .polygonStrokeColor((feat: any) => {
            const name = feat?.properties?.ADMIN ?? feat?.properties?.name ?? '';
            const region = getRegion(name);
            return region ? region.color : 'rgba(15, 35, 65, 0.6)';
          })
          .polygonLabel((feat: any) => {
            const name = feat?.properties?.ADMIN ?? feat?.properties?.name ?? '';
            const region = getRegion(name);
            if (!region) return '';
            const { r, g, b } = hexToRgb(region.color);
            return `<div style="
              background: rgba(3,8,20,0.96);
              border: 1px solid ${region.color};
              border-radius: 10px;
              padding: 9px 15px;
              font-family: Inter, sans-serif;
              box-shadow: 0 0 24px rgba(${r},${g},${b},0.5);
              backdrop-filter: blur(16px);
              min-width: 140px;
            ">
              <div style="font-size:13px;font-weight:800;color:${region.color};margin-bottom:3px;">${region.name}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.45);">${region.exchanges}</div>
            </div>`;
          })
          .onPolygonHover((feat: any) => {
            const name = feat?.properties?.ADMIN ?? feat?.properties?.name ?? '';
            const region = getRegion(name);
            const regionName = region?.name ?? null;
            hoveredRegionRef.current = regionName;
            setHoveredRegion(regionName);
            if (el) el.style.cursor = region ? 'pointer' : 'grab';
          })
          .onPolygonClick((feat: any) => {
            const name = feat?.properties?.ADMIN ?? feat?.properties?.name ?? '';
            const region = getRegion(name);
            if (!region) return;
            const next = activeRegionRef.current === region.name ? null : region.name;
            activeRegionRef.current = next;
            setActiveRegion(next);
            if (next && FLY_TARGETS[next]) {
              globe.pointOfView(FLY_TARGETS[next], 1200);
            }
          });

        // Controls
        const controls = globe.controls();
        controls.autoRotate      = true;
        controls.autoRotateSpeed = 0.35;
        controls.enableZoom      = true;
        controls.minDistance     = 200;
        controls.maxDistance     = 650;
        controls.enableDamping   = true;
        controls.dampingFactor   = 0.08;
        controls.enablePan       = false;

        // Stop auto-rotation on first user interaction with the globe
        const stopSpin = () => {
          if (controls.autoRotate) controls.autoRotate = false;
        };
        el.addEventListener('mousedown', stopSpin, { once: false });
        el.addEventListener('touchstart', stopSpin, { once: false, passive: true });
        // Store for cleanup
        globe._stopSpin = stopSpin;

        globe.pointOfView({ lat: 20, lng: 10, altitude: 2.4 }, 0);

        // ── Watchlist markers — will be updated after init ──────────────
        globe
          .pointsData([])
          .pointLat((d: any) => d.lat)
          .pointLng((d: any) => d.lng)
          .pointAltitude(0.01)
          .pointRadius((d: any) => d.radius || 0.35)
          .pointColor((d: any) => d.color)
          .pointLabel((d: any) => `
            <div style="
              background:rgba(3,8,20,0.96);
              border:1px solid ${d.color};
              border-radius:10px;
              padding:8px 14px;
              font-family:Inter,sans-serif;
              box-shadow:0 0 20px ${d.color}55;
              min-width:130px;
            ">
              <div style="font-size:13px;font-weight:800;color:${d.color};margin-bottom:2px;">${d.symbol}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.55);">${d.name}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:3px;">${d.sector}</div>
            </div>
          `)
          .onPointClick((d: any) => {
            if (d) setSelectedCompany(d);
          })
          .onPointHover((d: any) => {
            if (containerRef.current) {
              containerRef.current.style.cursor = d ? 'pointer' : 'grab';
            }
          });

        // ── Geopolitical hotspot markers (HTML diamond elements) ──────────
        globe
          .htmlElementsData(GEO_HOTSPOTS)
          .htmlLat((d: any) => d.lat)
          .htmlLng((d: any) => d.lng)
          .htmlAltitude(0.02)
          .htmlElement((d: GeoHotspot) => {
            const pulse = SEVERITY_PULSE[d.severity] || '1.5s';

            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;';

            wrapper.innerHTML = `
              <style>
                @keyframes gp-${d.id} {
                  0%,100%{opacity:1;transform:scale(1) rotate(45deg);box-shadow:0 0 8px ${d.color};}
                  50%{opacity:0.6;transform:scale(1.25) rotate(45deg);box-shadow:0 0 22px ${d.color};}
                }
                @keyframes gpr-${d.id} {
                  0%{transform:scale(1) rotate(45deg);opacity:0.65;}
                  100%{transform:scale(2.6) rotate(45deg);opacity:0;}
                }
              </style>
              <div style="position:relative;width:22px;height:22px;">
                <div style="position:absolute;inset:0;border:1.5px solid ${d.color};border-radius:2px;transform:rotate(45deg);animation:gpr-${d.id} ${pulse} ease-out infinite;"></div>
                <div style="width:14px;height:14px;background:${d.color};transform:rotate(45deg);margin:4px;box-shadow:0 0 14px ${d.color};animation:gp-${d.id} ${pulse} ease-in-out infinite;border-radius:2px;"></div>
              </div>
              <div style="font-size:9px;font-weight:800;color:${d.color};letter-spacing:0.04em;white-space:nowrap;text-shadow:0 0 8px ${d.color};background:rgba(3,8,20,0.75);padding:1px 5px;border-radius:4px;">${d.tag}</div>
            `;

            // React state callbacks — the tooltip renders as a fixed React overlay (not clipped by globe container)
            wrapper.addEventListener('mouseenter', (e: MouseEvent) => {
              setHoveredHotspot(d);
              setTooltipPos({ x: (e as any).clientX, y: (e as any).clientY });
            });
            wrapper.addEventListener('mousemove', (e: MouseEvent) => {
              setTooltipPos({ x: (e as any).clientX, y: (e as any).clientY });
            });
            wrapper.addEventListener('mouseleave', () => {
              setHoveredHotspot(null);
              setTooltipPos(null);
            });
            wrapper.addEventListener('click', (e) => {
              e.stopPropagation();
              setSelectedHotspot(d);
            });

            // Pre-fetch headline for this hotspot into React state
            ;(async () => {
              try {
                const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(d.newsQuery)}&hl=en-US&gl=US&ceid=US:en`;
                const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
                const res = await fetch(apiUrl);
                if (!res.ok) return;
                const data = await res.json();
                if (data.status === 'ok' && data.items?.length) {
                  const item = data.items[0];
                  const parts = (item.title || '').split(' - ');
                  const source = parts.length > 1 ? parts.pop()!.trim() : '';
                  const title = parts.join(' - ').trim();
                  const pubDate = new Date(item.pubDate);
                  const diffH = Math.floor((Date.now() - pubDate.getTime()) / 3_600_000);
                  const timeStr = diffH < 1 ? 'Just now' : diffH < 24 ? `${diffH}h ago` : `${Math.floor(diffH / 24)}d ago`;
                  setHotspotHeadlines(prev => ({ ...prev, [d.id]: { title, source, timeStr, link: item.link } }));
                }
              } catch(_) {}
            })();

            return wrapper;
          });

        globeRef.current = globe;

        // Resize observer
        const ro = new ResizeObserver(() => {
          if (!destroyed && containerRef.current && globeRef.current) {
            globeRef.current
              .width(containerRef.current.offsetWidth)
              .height(containerRef.current.offsetHeight);
          }
        });
        ro.observe(el);

        setLoading(false);

        // Expose ro for cleanup
        globe._ro = ro;
      } catch (err: any) {
        if (!destroyed) setError(err?.message || 'Failed to load globe');
      }
    })();

    return () => {
      destroyed = true;
      if (globe) {
        globe._ro?.disconnect();
        // Remove stopSpin listeners if they were added
        if (globe._stopSpin) {
          const elRef = containerRef.current;
          if (elRef) {
            elRef.removeEventListener('mousedown', globe._stopSpin);
            elRef.removeEventListener('touchstart', globe._stopSpin);
          }
        }
        globe._destructor?.();
      }
    };
  }, []); // run once

  // ── Fly from legend ────────────────────────────────────────────────────
  const flyToRegion = (name: string) => {
    const next = activeRegion === name ? null : name;
    setActiveRegion(next);
    activeRegionRef.current = next;
    if (next && FLY_TARGETS[next] && globeRef.current) {
      globeRef.current.pointOfView(FLY_TARGETS[next], 1200);
    } else if (!next && globeRef.current) {
      globeRef.current.pointOfView({ lat: 20, lng: 10, altitude: 2.4 }, 1200);
    }
  };

  const resetView = () => {
    setActiveRegion(null);
    activeRegionRef.current = null;
    globeRef.current?.pointOfView({ lat: 20, lng: 10, altitude: 2.4 }, 1200);
  };

  // ── Update globe point markers whenever watchlist changes or globe loads ──
  useEffect(() => {
    if (!globeRef.current || loading) return;
    const stocks = topStocksData as any[];
    const points = watchlistSymbols
      .map(sym => stocks.find((s: any) => s.symbol === sym))
      .filter(Boolean)
      .filter((s: any) => s.lat != null && s.lng != null)
      .map((s: any) => ({
        ...s,
        color: getStockColor(s.sector),
        radius: 0.45,
      }));
    globeRef.current.pointsData(points);
  }, [watchlistSymbols, loading]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100%',
      height: 'calc(100vh - 72px)',
      background: 'radial-gradient(ellipse 120% 100% at 50% 30%, #020D1E 0%, #010710 50%, #000000 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Star field */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {STARS.map(s => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              background: '#ffffff',
              opacity: Number(s.opacity),
              left: `${s.left}%`,
              top: `${s.top}%`,
              animation: `star-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Globe canvas mount point */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />

      {/* Loading */}
      {loading && !error && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(ellipse 120% 100% at 50% 30%, #020D1E 0%, #010710 50%, #000000 100%)',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            border: '2px solid rgba(0,212,255,0.12)',
            borderTopColor: '#00D4FF',
            marginBottom: 18,
            animation: 'globe-spin 0.9s linear infinite',
          }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
            Initializing Globe
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#F43F5E', fontSize: 14, fontWeight: 600,
        }}>
          Globe failed to load: {error}
        </div>
      )}

      {/* Top-left title */}
      {!loading && (
        <div style={{ position: 'absolute', top: 28, left: 32, zIndex: 10, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D4FF', boxShadow: '0 0 10px #00D4FF', animation: 'live-pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 10, color: 'rgba(0,212,255,0.7)', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Global Financial Map
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -0.5, lineHeight: 1.1 }}>
            World Markets
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>
            Drag to rotate · Scroll to zoom · Click a region to focus
          </div>
          {/* Hotspot legend */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, background: '#F43F5E', transform: 'rotate(45deg)', borderRadius: 1, boxShadow: '0 0 8px #F43F5E', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Critical geopolitical event</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, background: '#FB923C', transform: 'rotate(45deg)', borderRadius: 1, boxShadow: '0 0 8px #FB923C', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>High-risk geopolitical event</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#A1A1AA', boxShadow: '0 0 5px #A1A1AA', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Watchlisted company HQ</span>
            </div>
          </div>
        </div>
      )}


      {/* Right legend */}
      {!loading && (
        <div style={{
          position: 'absolute', top: '50%', right: 22,
          transform: 'translateY(-50%)',
          zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: 7,
        }}>
          {FINANCIAL_REGIONS.map(region => {
            const isActive = activeRegion === region.name;
            const { r, g, b } = hexToRgb(region.color);
            return (
              <button
                key={region.name}
                onClick={() => flyToRegion(region.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: isActive ? `rgba(${r},${g},${b},0.16)` : 'rgba(3,8,22,0.80)',
                  border: `1px solid ${isActive ? region.color : 'rgba(255,255,255,0.08)'}`,
                  cursor: 'pointer',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow: isActive ? `0 0 20px rgba(${r},${g},${b},0.3)` : 'none',
                  transition: 'all 0.2s ease',
                  minWidth: 180,
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: region.color,
                  boxShadow: `0 0 8px ${region.color}`,
                }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? region.color : '#ffffff', lineHeight: 1.3 }}>
                    {region.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', marginTop: 1 }}>
                    {region.exchanges}
                  </div>
                </div>
              </button>
            );
          })}

          {activeRegion && (
            <button
              onClick={resetView}
              style={{
                marginTop: 2,
                padding: '6px 14px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.09)',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.38)',
                fontSize: 11, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = '#fff';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.22)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.38)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)';
              }}
            >
              ← Reset View
            </button>
          )}
        </div>
      )}

      {/* Hotspot hover tooltip — fixed overlay, not clipped by globe container */}
      {hoveredHotspot && tooltipPos && (() => {
        const h = hoveredHotspot;
        const hl = hotspotHeadlines[h.id];
        const severityColor = h.severity === 'critical' ? '#F43F5E' : h.severity === 'high' ? '#FB923C' : '#FFB800';
        const severityText = h.severity === 'critical' ? '🔴 CRITICAL' : h.severity === 'high' ? '🟠 HIGH RISK' : '🟡 MEDIUM';
        // Keep tooltip on-screen: flip left if too close to right edge
        const LEFT = Math.min(tooltipPos.x + 18, window.innerWidth - 280);
        const TOP = Math.max(tooltipPos.y - 160, 12);
        return (
          <div style={{
            position: 'fixed',
            left: LEFT, top: TOP,
            width: 260, zIndex: 9999,
            background: 'rgba(5,9,22,0.97)',
            border: `1px solid ${h.color}44`,
            borderRadius: 14, padding: 14,
            boxShadow: `0 8px 40px rgba(0,0,0,0.85), 0 0 24px ${h.color}18`,
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            pointerEvents: 'none',
            transition: 'top 0.05s, left 0.05s',
          }}>
            {/* Name + icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, background: h.color, transform: 'rotate(45deg)', borderRadius: 1, flexShrink: 0, boxShadow: `0 0 10px ${h.color}` }} />
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{h.name}</div>
            </div>
            {/* Severity + region */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', color: severityColor, background: `${severityColor}18`, border: `1px solid ${severityColor}33`, padding: '2px 7px', borderRadius: 100 }}>{severityText}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{h.region}</span>
            </div>
            {/* Live headline */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 9 }}>
              {hl ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>{hl.source}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{hl.timeStr}</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1.45, marginBottom: 6 }}>{hl.title}</div>
                  <div style={{ fontSize: 9, color: h.color, fontWeight: 600 }}>Click for all news →</div>
                </>
              ) : (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>Loading headline…</span>
              )}
            </div>
          </div>
        );
      })()}

      {/* News of the Day — bottom-left persistent widget */}
      {!loading && <NewsOfDay />}

      {/* Bottom hover badge */}
      {!loading && hoveredRegion && (() => {
        const region = FINANCIAL_REGIONS.find(r => r.name === hoveredRegion);
        if (!region) return null;
        const { r, g, b } = hexToRgb(region.color);
        return (
          <div style={{
            position: 'absolute', bottom: 30, left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10, pointerEvents: 'none',
            padding: '9px 22px',
            borderRadius: 100,
            background: `rgba(${r},${g},${b},0.10)`,
            border: `1px solid rgba(${r},${g},${b},0.45)`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 0 28px rgba(${r},${g},${b},0.28)`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: region.color, boxShadow: `0 0 10px ${region.color}` }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: region.color }}>{region.name}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{region.exchanges}</span>
          </div>
        );
      })()}

      {/* News bottom bar */}
      {!loading && activeRegion && !isNewsModalOpen && (() => {
        const region = FINANCIAL_REGIONS.find(r => r.name === activeRegion);
        if (!region) return null;
        const { r, g, b } = hexToRgb(region.color);
        return (
          <div
            onClick={() => setIsNewsModalOpen(true)}
            style={{
              position: 'absolute', bottom: 30, left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 15, cursor: 'pointer',
              padding: '12px 28px',
              borderRadius: 16,
              background: `rgba(${r},${g},${b},0.15)`,
              border: `1px solid ${region.color}`,
              backdropFilter: 'blur(20px)',
              boxShadow: `0 8px 32px rgba(${r},${g},${b},0.3)`,
              display: 'flex', alignItems: 'center', gap: 12,
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = `rgba(${r},${g},${b},0.25)`;
              (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%) translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = `rgba(${r},${g},${b},0.15)`;
              (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%) translateY(0)';
            }}
          >
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: region.color,
              boxShadow: `0 0 12px ${region.color}`,
              animation: 'live-pulse 2s infinite'
            }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
              Most important news from <span style={{ color: region.color }}>{region.name}</span>
            </span>
            <span style={{ fontSize: 18, color: region.color, marginLeft: 4 }}>↑</span>
          </div>
        );
      })()}

      {/* News Modal */}
      {isNewsModalOpen && activeRegion && (() => {
        const region = FINANCIAL_REGIONS.find(r => r.name === activeRegion);
        if (!region) return null;
        const { r, g, b } = hexToRgb(region.color);
        const news = fetchedNews[region.name] || REGION_NEWS[region.name] || [];

        return (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div
              style={{
                position: 'absolute', inset: 0, cursor: 'pointer'
              }}
              onClick={() => setIsNewsModalOpen(false)}
            />
            <div style={{
              position: 'relative', width: '90%', maxWidth: 600, maxHeight: '80vh',
              background: 'rgba(5,10,24,0.95)',
              border: `1px solid rgba(${r},${g},${b},0.4)`,
              borderRadius: 24, padding: 32,
              boxShadow: `0 24px 64px rgba(0,0,0,0.8), 0 0 40px rgba(${r},${g},${b},0.15)`,
              display: 'flex', flexDirection: 'column',
              animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: region.color, boxShadow: `0 0 16px ${region.color}` }} />
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#fff' }}>
                    {region.name} <span style={{ color: region.color }}>Market News</span>
                  </h2>
                </div>
                <button
                  onClick={() => setIsNewsModalOpen(false)}
                  style={{
                    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)',
                    fontSize: 28, cursor: 'pointer', padding: 0, lineHeight: 1,
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {isFetchingNews && (!fetchedNews[region.name]) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 16 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      border: `2px solid rgba(${r},${g},${b},0.2)`,
                      borderTopColor: region.color,
                      animation: 'globe-spin 1s linear infinite',
                    }} />
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: 1 }}>Fetching real-time news...</div>
                  </div>
                ) : news.length > 0 ? news.map((item: any, i: number) => (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 8,
                      padding: 20, borderRadius: 16,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',

                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = `rgba(${r},${g},${b},0.08)`;
                      (e.currentTarget as HTMLElement).style.borderColor = `rgba(${r},${g},${b},0.3)`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>
                        {item.title}
                      </h3>
                      <span style={{
                        padding: '4px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                        background: item.impact === 'high' ? 'rgba(244,63,94,0.2)' : 'rgba(251,146,60,0.2)',
                        color: item.impact === 'high' ? '#F43F5E' : '#FB923C'
                      }}>
                        {item.impact} Impact
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                      {item.summary}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: region.color }}>{item.source}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>•</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.time}</span>
                    </div>
                  </a>
                )) : (
                  <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '20px 0' }}>
                    No recent news found.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Company News Drawer (from globe marker click) */}
      {selectedCompany && (
        <CompanyNewsDrawer
          symbol={selectedCompany.symbol}
          name={selectedCompany.name}
          sector={selectedCompany.sector}
          price={selectedCompany.price}
          change24h={selectedCompany.change24h}
          onClose={() => setSelectedCompany(null)}
        />
      )}

      {/* Geopolitical News Drawer (from hotspot diamond click) */}
      {selectedHotspot && (
        <GeoNewsDrawer
          hotspot={selectedHotspot}
          onClose={() => setSelectedHotspot(null)}
        />
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes star-twinkle {
          from { opacity: 0.08; }
          to   { opacity: 0.75; }
        }
        @keyframes globe-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes live-pulse {
          0%, 100% { box-shadow: 0 0 6px #00D4FF; opacity: 1; }
          50%       { box-shadow: 0 0 14px #00D4FF; opacity: 0.6; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

    </div>
  );
}
