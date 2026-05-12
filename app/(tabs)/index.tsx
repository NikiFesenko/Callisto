// @ts-nocheck
import React, { useMemo } from 'react';
import { ScrollView, Platform, View, StyleSheet } from 'react-native';
import { YStack, Text } from 'tamagui';
import { PageShell } from '@/src/components/ui/PageShell';
import { KPIRow } from '@/src/components/dashboard/KPIRow';
import { ChartCard } from '@/src/components/charts/ChartCard';
import { LineChart, type ChartDataPoint } from '@/src/components/charts/LineChart';
import { MacroOverlay } from '@/src/components/dashboard/MacroOverlay';
import { useFREDSeries } from '@/src/api/fred';
import { usePriceHistory } from '@/src/api/coingecko';
import { FRED_SERIES, Colors } from '@/src/lib/constants';



export default function DashboardScreen() {
  const { data: m2Data, isLoading: m2Loading } = useFREDSeries(FRED_SERIES.M2);
  const { data: cpiData, isLoading: cpiLoading } = useFREDSeries(FRED_SERIES.CPI);
  const { data: fedData, isLoading: fedLoading } = useFREDSeries(FRED_SERIES.FED_FUNDS);
  const { data: btcPrices, isLoading: btcLoading } = usePriceHistory('bitcoin', '365');

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
        {/* Header — hidden on web (brand is in the top nav) */}
        {Platform.OS !== 'web' && (
          <YStack paddingHorizontal="$4" gap="$1">
            <Text fontSize={28} fontWeight="800" color={Colors.textPrimary}>
              Colisto
            </Text>
            <Text fontSize={14} color={Colors.textSecondary}>
              Macro-Driven Automated Trading
            </Text>
          </YStack>
        )}

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
            />
          </ChartCard>
        </YStack>

        {/* Macro Calendar */}
        <YStack paddingHorizontal="$4">
          <MacroOverlay />
        </YStack>
      </YStack>
    </PageShell>
  );
}
