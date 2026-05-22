// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';

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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MarketsScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const activeRegionRef = useRef<string | null>(null);
  const hoveredRegionRef = useRef<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

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

        globe.pointOfView({ lat: 20, lng: 10, altitude: 2.4 }, 0);

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
      `}</style>
    </div>
  );
}
