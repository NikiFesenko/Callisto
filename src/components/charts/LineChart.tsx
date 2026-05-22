// @ts-nocheck
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Colors } from '@/src/lib/constants';
import type { ChartDataPoint } from './LineChart';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';

const TIME_RANGES = ['1M', '3M', '6M', '1Y', 'ALL'] as const;
type TimeRange = typeof TIME_RANGES[number];

interface LineChartProps {
  data: ChartDataPoint[];
  secondaryData?: ChartDataPoint[];
  label?: string;
  secondaryLabel?: string;
  color?: string;
  secondaryColor?: string;
  height?: number;
  isLoading?: boolean;
  showTimeRanges?: boolean;
  onTimeRangeChange?: (range: string) => void;
  selectedRange?: string;
}

function getRangeVisibleFrom(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case '1M': return new Date(now.setMonth(now.getMonth() - 1));
    case '3M': return new Date(now.setMonth(now.getMonth() - 3));
    case '6M': return new Date(now.setMonth(now.getMonth() - 6));
    case '1Y': return new Date(now.setFullYear(now.getFullYear() - 1));
    case 'ALL': return new Date('2010-01-01');
  }
}

function toLineData(points: ChartDataPoint[]) {
  const seen = new Set();
  const arr = [];
  for(const p of points) {
    if (p.value != null && !isNaN(p.value) && !seen.has(p.date)) {
      seen.add(p.date);
      arr.push({ time: p.date as any, value: p.value });
    }
  }
  return arr.sort((a, b) => a.time.localeCompare(b.time));
}

export function LineChart({
  data,
  secondaryData,
  label = 'Value',
  secondaryLabel,
  color = Colors.neonGreen,
  secondaryColor = Colors.indigo,
  height = 260,
  isLoading = false,
  showTimeRanges = true,
  onTimeRangeChange,
  selectedRange = '1Y',
}: WebLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const primarySeriesRef = useRef<any>(null);
  const secondarySeriesRef = useRef<any>(null);
  const [activeRange, setActiveRange] = useState<TimeRange>(selectedRange as TimeRange);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; price: string; date: string; secondary?: string }>({
    visible: false, x: 0, y: 0, price: '', date: '',
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: 'var(--text-secondary)' in document.documentElement.style
          ? getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
          : '#7D8BA6',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(124,58,237,0.5)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#7C3AED' },
        horzLine: { color: 'rgba(124,58,237,0.5)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#7C3AED' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.07)',
        textColor: '#4B5568',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.07)',
        timeVisible: true, secondsVisible: false,
        rightOffset: 5, fixLeftEdge: false, fixRightEdge: false,
      },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    });

    chartRef.current = chart;

    const primarySeries = chart.addAreaSeries({
      lineColor: color,
      topColor: `${color}30`,
      bottomColor: `${color}00`,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: color,
      crosshairMarkerBackgroundColor: '#0C111D',
      priceLineVisible: false,
      lastValueVisible: true,
    });
    primarySeriesRef.current = primarySeries;

    if (data && data.length > 0) {
      try { primarySeries.setData(toLineData(data)); } catch (e) { console.error('Error setting primary data', e); }
    }

    if (secondaryLabel) {
      const secondarySeries = chart.addLineSeries({
        color: secondaryColor,
        lineWidth: 1.5,
        lineStyle: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      secondarySeriesRef.current = secondarySeries;
      if (secondaryData && secondaryData.length > 0) {
        try { secondarySeries.setData(toLineData(secondaryData)); } catch (e) { console.error('Error setting secondary data', e); }
      }
    }

    chart.subscribeCrosshairMove((param: any) => {
      if (!param || !param.time || !containerRef.current) {
        setTooltip(t => ({ ...t, visible: false }));
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      const primaryValue = param.seriesData?.get(primarySeries);
      const secondaryValue = secondarySeriesRef.current ? param.seriesData?.get(secondarySeriesRef.current) : null;

      if (primaryValue == null) {
        setTooltip(t => ({ ...t, visible: false }));
        return;
      }

      const val = typeof primaryValue === 'object' ? primaryValue.value : primaryValue;
      const secVal = secondaryValue != null ? (typeof secondaryValue === 'object' ? secondaryValue.value : secondaryValue) : null;

      const price = val >= 10000
        ? `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        : val >= 100
        ? val.toFixed(2)
        : val.toFixed(4);

      const dateStr = typeof param.time === 'object'
        ? `${param.time.year}-${String(param.time.month).padStart(2,'0')}-${String(param.time.day).padStart(2,'0')}`
        : String(param.time);
      const dateFormatted = new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      setTooltip({
        visible: true,
        x: Math.min(param.point?.x ?? 0, rect.width - 160),
        y: Math.max(param.point?.y ?? 0, 8),
        price,
        date: dateFormatted,
        secondary: secVal != null ? secVal.toFixed(2) : undefined,
      });
    });

    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry && chart) {
        chart.resize(entry.contentRect.width, height);
      }
    });
    ro.observe(containerRef.current);

    applyRange(activeRange, chart);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!primarySeriesRef.current || !data || data.length === 0) return;
    try {
      primarySeriesRef.current.setData(toLineData(data));
      if (chartRef.current) applyRange(activeRange, chartRef.current);
    } catch (e) { console.error('Error updating primary data', e); }
  }, [data]);

  useEffect(() => {
    if (!secondarySeriesRef.current || !secondaryData || secondaryData.length === 0) return;
    try {
      secondarySeriesRef.current.setData(toLineData(secondaryData));
    } catch (e) { console.error('Error updating secondary data', e); }
  }, [secondaryData]);

  function applyRange(range: TimeRange, chart: any) {
    if (!chart) return;
    try {
      if (range === 'ALL') {
        chart.timeScale().fitContent();
      } else {
        const from = getRangeVisibleFrom(range);
        const now = new Date();
        chart.timeScale().setVisibleRange({
          from: Math.floor(from.getTime() / 1000) as any,
          to: Math.floor(now.getTime() / 1000) as any,
        });
      }
    } catch (e) { console.error('Error applying range', e); }
  }

  const handleTimeRange = useCallback((range: TimeRange) => {
    setActiveRange(range);
    onTimeRangeChange?.(range);
    if (chartRef.current) applyRange(range, chartRef.current);
  }, [onTimeRangeChange]);

  const btnBase: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: 6,
    border: 'none',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  };

  if (isLoading) {
    return (
      <div style={{ height, borderRadius: 12, background: 'var(--bg-card)', position: 'relative', overflow: 'hidden' }}>
        <div className="shimmer-overlay" style={{ position: 'absolute', inset: 0 }} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {showTimeRanges && (
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', paddingRight: 4 }}>
          {TIME_RANGES.map(range => (
            <button
              key={range}
              className={activeRange === range ? 'filter-tab-active' : 'filter-tab-inactive'}
              style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              onClick={() => handleTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      )}

      <div style={{ position: 'relative', width: '100%' }}>
        <div ref={containerRef} style={{ width: '100%', height, borderRadius: 8, overflow: 'hidden' }} />

        {tooltip.visible && (
          <div style={{
            position: 'absolute',
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            borderRadius: 10,
            padding: '8px 12px',
            pointerEvents: 'none',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: 'var(--shadow-elevated)',
            zIndex: 10,
            minWidth: 140,
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{tooltip.date}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'Space Mono, monospace' }}>{tooltip.price}</div>
            {tooltip.secondary && secondaryLabel && (
              <div style={{ fontSize: 11, color: secondaryColor, marginTop: 4 }}>
                {secondaryLabel}: {tooltip.secondary}
              </div>
            )}
          </div>
        )}
      </div>

      {secondaryLabel && (
        <div style={{ display: 'flex', gap: 16, paddingLeft: 8, paddingTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 3, background: color, borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: Colors.textSecondary }}>{label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 3, background: secondaryColor, borderRadius: 2, opacity: 0.7 }} />
            <span style={{ fontSize: 11, color: Colors.textSecondary }}>{secondaryLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}
