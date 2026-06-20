// @ts-nocheck
import { usePriceHistory } from '@/src/api/coingecko';
import { useFREDSeries, rangeToObservationStart } from '@/src/api/fred';
import { ChartCard } from '@/src/components/charts/ChartCard';
import { LineChart, type ChartDataPoint } from '@/src/components/charts/LineChart';
import { KPIRow } from '@/src/components/dashboard/KPIRow';
import { MacroOverlay } from '@/src/components/dashboard/MacroOverlay';
import { NewsRow } from '@/src/components/dashboard/NewsRow';
import { Text, YStack } from '@/src/components/ui/core';
import { PageShell } from '@/src/components/ui/PageShell';
import { FRED_SERIES } from '@/src/lib/constants';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 14px',
      borderRadius: 100,
      background: 'var(--bg-badge)',
      border: '1px solid var(--border-default)',
      fontSize: 12,
    }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || 'var(--text-primary)', fontFamily: 'Space Mono, monospace' }}>{value}</span>
    </div>
  );
}

export default function DashboardScreen() {
  const [btcRange, setBtcRange] = useState('1Y');
  const [fedRange, setFedRange] = useState('1Y');
  const [cpiRange, setCpiRange] = useState('1Y');

  const { data: m2Data,  isLoading: m2Loading  } = useFREDSeries(FRED_SERIES.M2,        { observationStart: rangeToObservationStart(btcRange) });
  const { data: cpiData, isLoading: cpiLoading } = useFREDSeries(FRED_SERIES.CPI,       { observationStart: rangeToObservationStart(cpiRange) });
  const { data: fedData, isLoading: fedLoading } = useFREDSeries(FRED_SERIES.FED_FUNDS, { observationStart: rangeToObservationStart(fedRange) });
  const { data: btcPrices, isLoading: btcLoading } = usePriceHistory('bitcoin', btcRange);

  const m2ChartData = useMemo<ChartDataPoint[]>(() =>
    (m2Data?.observations || []).filter(o => o.value !== '.').map(o => ({ date: o.date, value: parseFloat(o.value) })),
    [m2Data]);

  const cpiChartData = useMemo<ChartDataPoint[]>(() =>
    (cpiData?.observations || []).filter(o => o.value !== '.').map(o => ({ date: o.date, value: parseFloat(o.value) })),
    [cpiData]);

  const fedChartData = useMemo<ChartDataPoint[]>(() =>
    (fedData?.observations || []).filter(o => o.value !== '.').map(o => ({ date: o.date, value: parseFloat(o.value) })),
    [fedData]);

  const btcChartData = useMemo<ChartDataPoint[]>(() =>
    (btcPrices || []).map(p => ({ date: new Date(p.timestamp).toISOString().split('T')[0], value: p.price })),
    [btcPrices]);

  const m2Normalized = useMemo<ChartDataPoint[]>(() => {
    if (m2ChartData.length === 0 || btcChartData.length === 0) return [];
    let m2Min = m2ChartData[0].value, m2Max = m2ChartData[0].value;
    for (let i = 1; i < m2ChartData.length; i++) {
      if (m2ChartData[i].value < m2Min) m2Min = m2ChartData[i].value;
      if (m2ChartData[i].value > m2Max) m2Max = m2ChartData[i].value;
    }
    let btcMin = btcChartData[0].value, btcMax = btcChartData[0].value;
    for (let i = 1; i < btcChartData.length; i++) {
      if (btcChartData[i].value < btcMin) btcMin = btcChartData[i].value;
      if (btcChartData[i].value > btcMax) btcMax = btcChartData[i].value;
    }
    const m2Range = m2Max - m2Min || 1;
    return m2ChartData.map(d => ({ ...d, value: btcMin + ((d.value - m2Min) / m2Range) * (btcMax - btcMin) }));
  }, [m2ChartData, btcChartData]);

  return (
    <PageShell>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="dashboard-hero" style={{
        padding: '64px 32px 48px',
        textAlign: 'center',
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.12) 0%, transparent 70%)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.4,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 100, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', marginBottom: 24 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)' }} className="live-dot" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-purple-bright)', letterSpacing: '0.05em' }}>
              Macro Intelligence · Live
            </span>
          </div>

          <h1 style={{ fontSize: 52, fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, margin: '0 0 16px', color: 'var(--text-primary)' }}>
            Intelligent{' '}
            <span className="gradient-text">Web3 Automation</span>
          </h1>

          <p style={{ fontSize: 17, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Execute flawless macro-driven strategies on Solana with our institutional-grade engine.
          </p>

          <div className="cta-row" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/automations" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ height: 44, padding: '0 24px', borderRadius: 10, fontSize: 14 }}>
                ⚡ Create Automation
              </button>
            </Link>
            <Link to="/markets" style={{ textDecoration: 'none' }}>
              <button className="btn-secondary" style={{ height: 44, padding: '0 24px', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
                🌐 View Markets
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="dashboard-content" style={{ padding: '0 28px 40px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {/* KPI strip */}
        <div style={{ marginTop: 28, marginBottom: 32 }}>
          <KPIRow />
        </div>

        {/* Charts grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ChartCard title="M2 Supply vs Bitcoin" subtitle="Correlation between monetary expansion and BTC price">
            <LineChart
              data={btcChartData} secondaryData={m2Normalized}
              label="BTC Price" secondaryLabel="M2 Supply (normalized)"
              color="#00FFA3" secondaryColor="#6366F1"
              isLoading={m2Loading || btcLoading}
              selectedRange={btcRange} onTimeRangeChange={setBtcRange}
            />
          </ChartCard>

          <div className="charts-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <ChartCard title="Federal Funds Rate" subtitle="US central bank interest rate target">
              <LineChart
                data={fedChartData} label="Fed Funds Rate"
                color="#A78BFA"
                isLoading={fedLoading} selectedRange={fedRange} onTimeRangeChange={setFedRange}
              />
            </ChartCard>
            <ChartCard title="Consumer Price Index" subtitle="US inflation tracking">
              <LineChart
                data={cpiChartData} label="CPI Index"
                color="#F43F5E"
                isLoading={cpiLoading} selectedRange={cpiRange} onTimeRangeChange={setCpiRange}
              />
            </ChartCard>
          </div>

          <MacroOverlay />
          <NewsRow />
        </div>
      </div>
    </PageShell>
  );
}
