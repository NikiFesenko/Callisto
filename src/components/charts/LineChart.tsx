// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { YStack, XStack, Text, Button } from 'tamagui';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { Colors } from '@/src/lib/constants';
import Svg, { Path, Line, Text as SvgText, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

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

const TIME_RANGES = ['1M', '3M', '6M', '1Y', 'ALL'];

export function LineChart({
  data,
  secondaryData,
  label = 'Value',
  secondaryLabel,
  color = Colors.neonGreen,
  secondaryColor = Colors.indigo,
  height = 220,
  isLoading = false,
  showTimeRanges = true,
  onTimeRangeChange,
  selectedRange = '1Y',
}: LineChartProps) {
  const [activeRange, setActiveRange] = useState(selectedRange);
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 64;
  const chartHeight = height;
  const padding = { top: 20, right: 16, bottom: 30, left: 55 };

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Memoize all expensive calculations
  const { minVal, maxVal, valueRange } = useMemo(() => {
    if (!data || data.length === 0) return { minVal: 0, maxVal: 1, valueRange: 1 };
    let mn = data[0].value;
    let mx = data[0].value;
    for (let i = 1; i < data.length; i++) {
      if (data[i].value < mn) mn = data[i].value;
      if (data[i].value > mx) mx = data[i].value;
    }
    mn *= 0.98;
    mx *= 1.02;
    return { minVal: mn, maxVal: mx, valueRange: mx - mn || 1 };
  }, [data]);

  const yScale = useMemo(() => {
    return (value: number) =>
      padding.top + innerHeight - ((value - minVal) / valueRange) * innerHeight;
  }, [innerHeight, minVal, valueRange, padding.top]);

  const xScale = useMemo(() => {
    return (index: number, length: number) =>
      padding.left + (index / (length - 1)) * innerWidth;
  }, [padding.left, innerWidth]);

  const buildPath = useMemo(() => {
    return (points: ChartDataPoint[]): string =>
      points
        .map((point, i) => {
          const x = xScale(i, points.length);
          const y = yScale(point.value);
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');
  }, [xScale, yScale]);

  const buildAreaPath = useMemo(() => {
    return (points: ChartDataPoint[]): string => {
      const linePath = buildPath(points);
      const lastX = xScale(points.length - 1, points.length);
      const firstX = padding.left;
      const bottomY = padding.top + innerHeight;
      return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    };
  }, [buildPath, xScale, padding.left, padding.top, innerHeight]);

  // Memoize SVG paths
  const primaryPath = useMemo(() => data && data.length > 0 ? buildPath(data) : '', [data, buildPath]);
  const primaryAreaPath = useMemo(() => data && data.length > 0 ? buildAreaPath(data) : '', [data, buildAreaPath]);
  const secondaryPath = useMemo(() => secondaryData && secondaryData.length > 0 ? buildPath(secondaryData) : '', [secondaryData, buildPath]);
  const secondaryAreaPath = useMemo(() => secondaryData && secondaryData.length > 0 ? buildAreaPath(secondaryData) : '', [secondaryData, buildAreaPath]);

  const yLabels = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => {
      const value = minVal + (valueRange / 4) * i;
      return {
        value,
        y: yScale(value),
        label: value >= 10000
          ? `${(value / 1000).toFixed(0)}K`
          : value >= 100
          ? value.toFixed(0)
          : value.toFixed(1),
      };
    }),
    [minVal, valueRange, yScale]
  );

  const xLabels = useMemo(() => {
    if (!data || data.length === 0) return [];
    const step = Math.max(1, Math.floor(data.length / 5));
    return data
      .filter((_, i) => i % step === 0 || i === data.length - 1)
      .map((point) => {
        const index = data.indexOf(point);
        const date = new Date(point.date);
        return {
          x: xScale(index, data.length),
          label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        };
      });
  }, [data, xScale]);

  // End dot position
  const endDot = useMemo(() => {
    if (!data || data.length === 0) return null;
    return {
      cx: xScale(data.length - 1, data.length),
      cy: yScale(data[data.length - 1].value),
    };
  }, [data, xScale, yScale]);

  if (isLoading) {
    return <Skeleton variant="chart" height={height} />;
  }

  if (!data || data.length === 0) {
    return (
      <YStack height={height} alignItems="center" justifyContent="center">
        <Text color={Colors.textMuted}>No data available</Text>
      </YStack>
    );
  }

  const handleTimeRange = (range: string) => {
    setActiveRange(range);
    onTimeRangeChange?.(range);
  };

  return (
    <YStack gap="$2">
      {showTimeRanges && (
        <XStack gap="$1" justifyContent="flex-end" paddingRight="$2">
          {TIME_RANGES.map((range) => (
            <Button
              key={range}
              size="$2"
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius={6}
              backgroundColor={activeRange === range ? Colors.indigo : 'transparent'}
              pressStyle={{ backgroundColor: Colors.bgHover }}
              onPress={() => handleTimeRange(range)}
              accessibilityLabel={`Time range ${range}`}
            >
              <Text
                fontSize={11}
                fontWeight="600"
                color={activeRange === range ? '#FFF' : Colors.textMuted}
              >
                {range}
              </Text>
            </Button>
          ))}
        </XStack>
      )}

      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={secondaryColor} stopOpacity="0.15" />
            <Stop offset="100%" stopColor={secondaryColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {yLabels.map((yl, i) => (
          <Line
            key={i}
            x1={padding.left}
            y1={yl.y}
            x2={chartWidth - padding.right}
            y2={yl.y}
            stroke={Colors.borderSubtle}
            strokeWidth={0.5}
            strokeDasharray="4,4"
          />
        ))}

        {/* Area fills */}
        {primaryAreaPath ? <Path d={primaryAreaPath} fill="url(#areaGradient)" /> : null}
        {secondaryAreaPath ? <Path d={secondaryAreaPath} fill="url(#secondaryGradient)" /> : null}

        {/* Primary line */}
        {primaryPath ? (
          <Path d={primaryPath} fill="none" stroke={color} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
        ) : null}

        {/* Secondary line */}
        {secondaryPath ? (
          <Path d={secondaryPath} fill="none" stroke={secondaryColor} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,3" />
        ) : null}

        {/* End dot */}
        {endDot && (
          <>
            <Circle cx={endDot.cx} cy={endDot.cy} r={4} fill={color} />
            <Circle cx={endDot.cx} cy={endDot.cy} r={8} fill={color} opacity={0.2} />
          </>
        )}

        {/* Y-axis labels */}
        {yLabels.map((yl, i) => (
          <SvgText key={i} x={padding.left - 8} y={yl.y + 4} fontSize={10}
            fill={Colors.textMuted} textAnchor="end" fontFamily="monospace">
            {yl.label}
          </SvgText>
        ))}

        {/* X-axis labels */}
        {xLabels.map((xl, i) => (
          <SvgText key={i} x={xl.x} y={chartHeight - 6} fontSize={10}
            fill={Colors.textMuted} textAnchor="middle" fontFamily="monospace">
            {xl.label}
          </SvgText>
        ))}
      </Svg>

      {/* Legend */}
      {secondaryLabel && (
        <XStack gap="$4" paddingLeft="$4" paddingTop="$1">
          <XStack gap="$1.5" alignItems="center">
            <YStack width={12} height={3} backgroundColor={color} borderRadius={2} />
            <Text fontSize={11} color={Colors.textSecondary}>{label}</Text>
          </XStack>
          <XStack gap="$1.5" alignItems="center">
            <YStack width={12} height={3} backgroundColor={secondaryColor} borderRadius={2} />
            <Text fontSize={11} color={Colors.textSecondary}>{secondaryLabel}</Text>
          </XStack>
        </XStack>
      )}
    </YStack>
  );
}
