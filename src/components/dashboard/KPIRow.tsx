// @ts-nocheck
import React from 'react';
import { XStack, YStack } from '@/src/components/ui/core';
import { KPICard } from './KPICard';
import { useLatestFREDValue } from '@/src/api/fred';
import { useMarketData } from '@/src/api/coingecko';
import { FRED_SERIES } from '@/src/lib/constants';

export function KPIRow() {
  const cpi = useLatestFREDValue(FRED_SERIES.CPI);
  const fedFunds = useLatestFREDValue(FRED_SERIES.FED_FUNDS);
  const m2 = useLatestFREDValue(FRED_SERIES.M2);
  const unemployment = useLatestFREDValue(FRED_SERIES.UNEMPLOYMENT);
  const { data: marketData } = useMarketData();

  const btcData = marketData?.find((c) => c.id === 'bitcoin');
  const solData = marketData?.find((c) => c.id === 'solana');

  return (
    <YStack gap="$3">
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div style={{ display: 'flex', padding: '4px 16px', gap: 12 }}>
          <KPICard
            title="US CPI Index"
            value={cpi.currentValue}
            change={cpi.change ?? null}
            decimals={1}
            isLoading={cpi.isLoading}
          />
          <KPICard
            title="Fed Funds Rate"
            value={fedFunds.currentValue}
            change={fedFunds.change ?? null}
            suffix="%"
            decimals={2}
            isLoading={fedFunds.isLoading}
          />
          <KPICard
            title="M2 Supply"
            value={m2.currentValue}
            change={m2.change ?? null}
            prefix="$"
            suffix="B"
            decimals={0}
            isLoading={m2.isLoading}
          />
          <KPICard
            title="Unemployment"
            value={unemployment.currentValue}
            change={unemployment.change ?? null}
            suffix="%"
            decimals={1}
            isLoading={unemployment.isLoading}
          />
          {btcData && (
            <KPICard
              title="Bitcoin"
              value={btcData.current_price}
              change={btcData.price_change_percentage_24h}
              prefix="$"
              decimals={0}
            />
          )}
          {solData && (
            <KPICard
              title="Solana"
              value={solData.current_price}
              change={solData.price_change_percentage_24h}
              prefix="$"
              decimals={2}
            />
          )}
        </div>
      </div>
    </YStack>
  );
}
