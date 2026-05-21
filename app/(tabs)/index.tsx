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
import { Colors, FRED_SERIES } from '@/src/lib/constants';
import React, { useMemo, useState } from 'react';
import { Platform } from 'react-native';

export default function DashboardScreen() {
  const [btcRange, setBtcRange] = useState('1Y');
  const [fedRange, setFedRange] = useState('1Y');
  const [cpiRange, setCpiRange] = useState('1Y');

  const { data: m2Data, isLoading: m2Loading } = useFREDSeries(FRED_SERIES.M2, {
    observationStart: rangeToObservationStart(btcRange),
  });
  const { data: cpiData, isLoading: cpiLoading } = useFREDSeries(FRED_SERIES.CPI, {
    observationStart: rangeToObservationStart(cpiRange),
  });
  const { data: fedData, isLoading: fedLoading } = useFREDSeries(FRED_SERIES.FED_FUNDS, {
    observationStart: rangeToObservationStart(fedRange),
  });
  const { data: btcPrices, isLoading: btcLoading } = usePriceHistory('bitcoin', btcRange);

  // Memoize expensive data transforms
  const m2ChartData = useMemo<ChartDataPoint[]>(() =>
    (m2Data?.observations || [])
      .filter((o) => o.value !== '.')
      .map((o) => ({ date: o.date, value: parseFloat(o.value) })),
    [m2Data]
  );

  const cpiChartData = useMemo<ChartDataPoint[]>(() =>
    (cpiData?.observations || [])
      .filter((o) => o.value !== '.')
      .map((o) => ({ date: o.date, value: parseFloat(o.value) })),
    [cpiData]
  );

  const fedChartData = useMemo<ChartDataPoint[]>(() =>
    (fedData?.observations || [])
      .filter((o) => o.value !== '.')
      .map((o) => ({ date: o.date, value: parseFloat(o.value) })),
    [fedData]
  );

  const btcChartData = useMemo<ChartDataPoint[]>(() =>
    (btcPrices || []).map((p) => ({
      date: new Date(p.timestamp).toISOString().split('T')[0],
      value: p.price,
    })),
    [btcPrices]
  );

  // Normalize M2 to BTC range for overlay
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
    return m2ChartData.map(d => ({
      ...d,
      value: btcMin + ((d.value - m2Min) / m2Range) * (btcMax - btcMin),
    }));
  }, [m2ChartData, btcChartData]);

  return (
    <PageShell>
      <YStack gap="$4" paddingVertical="$4">
        {/* Massive Web3 Hero Section */}
        <YStack alignItems="center" paddingTop="$6" paddingBottom="$4" gap="$2" paddingHorizontal="$4">
          <Text fontSize={Platform.OS === 'web' ? 48 : 36} fontWeight="900" color={Colors.textPrimary} textAlign="center" letterSpacing={-1}>
            Intelligent Web3 Automation
          </Text>
          <Text fontSize={18} color={Colors.textSecondary} textAlign="center" style={{ maxWidth: 500 }} marginTop="$2">
            Execute flawless macro-driven strategies on Solana with our institutional-grade engine.
          </Text>
        </YStack>

        <KPIRow />

        {/* M2 vs Bitcoin Chart */}
        <YStack paddingHorizontal="$4">
          <ChartCard
            title="M2 Supply vs Bitcoin"
            subtitle="Correlation between monetary expansion and BTC price"
          >
            <LineChart
              data={btcChartData}
              secondaryData={m2Normalized}
              label="BTC Price"
              secondaryLabel="M2 Supply (normalized)"
              color={Colors.neonGreen}
              secondaryColor={Colors.indigo}
              isLoading={m2Loading || btcLoading}
              selectedRange={btcRange}
              onTimeRangeChange={setBtcRange}
            />
          </ChartCard>
        </YStack>

        {/* Fed Funds Rate */}
        <YStack paddingHorizontal="$4">
          <ChartCard
            title="Federal Funds Rate"
            subtitle="US central bank interest rate target"
          >
            <LineChart
              data={fedChartData}
              label="Fed Funds Rate"
              color={Colors.violet}
              isLoading={fedLoading}
              selectedRange={fedRange}
              onTimeRangeChange={setFedRange}
            />
          </ChartCard>
        </YStack>

        {/* CPI Inflation */}
        <YStack paddingHorizontal="$4">
          <ChartCard
            title="Consumer Price Index"
            subtitle="US inflation tracking"
          >
            <LineChart
              data={cpiChartData}
              label="CPI Index"
              color={Colors.coralRed}
              isLoading={cpiLoading}
              selectedRange={cpiRange}
              onTimeRangeChange={setCpiRange}
            />
          </ChartCard>
        </YStack>

        {/* Macro Calendar */}
        <YStack paddingHorizontal="$4">
          <MacroOverlay />
        </YStack>

        {/* Crypto News Feed */}
        <YStack paddingHorizontal="$4" paddingBottom="$8">
          <NewsRow />
        </YStack>
      </YStack>
    </PageShell>
  );
}
