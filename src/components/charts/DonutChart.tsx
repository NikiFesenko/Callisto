// @ts-nocheck
import React from 'react';
import { Dimensions } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import Svg, { Path, Circle, Text as SvgText, G } from 'react-native-svg';
import { Colors } from '@/src/lib/constants';
import { formatUSD } from '@/src/lib/formatters';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  symbol: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  totalValue: number;
  size?: number;
}

const DONUT_COLORS = [
  Colors.neonGreen,
  Colors.indigo,
  Colors.violet,
  '#F59E0B',
  Colors.coralRed,
  '#06B6D4',
  '#EC4899',
];

export function DonutChart({
  segments,
  totalValue,
  size = 220,
}: DonutChartProps) {
  const center = size / 2;
  const radius = size / 2 - 20;
  const strokeWidth = 28;
  const innerRadius = radius - strokeWidth;

  if (segments.length === 0) {
    return (
      <YStack alignItems="center" justifyContent="center" height={size}>
        <Text color={Colors.textMuted}>No assets</Text>
      </YStack>
    );
  }

  // Calculate angles
  let startAngle = -90; // Start from top
  const arcs = segments.map((seg, i) => {
    const percentage = totalValue > 0 ? (seg.value / totalValue) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const arc = {
      ...seg,
      percentage,
      startAngle,
      endAngle: startAngle + angle,
      color: seg.color || DONUT_COLORS[i % DONUT_COLORS.length],
    };
    startAngle += angle;
    return arc;
  });

  // SVG arc path generator
  function describeArc(
    cx: number,
    cy: number,
    r: number,
    startAngleDeg: number,
    endAngleDeg: number
  ): string {
    const startRad = (startAngleDeg * Math.PI) / 180;
    const endRad = (endAngleDeg * Math.PI) / 180;
    const startX = cx + r * Math.cos(startRad);
    const startY = cy + r * Math.sin(startRad);
    const endX = cx + r * Math.cos(endRad);
    const endY = cy + r * Math.sin(endRad);
    const largeArcFlag = endAngleDeg - startAngleDeg > 180 ? 1 : 0;
    return `M ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  }

  return (
    <YStack alignItems="center" gap="$3">
      <YStack position="relative" width={size} height={size} alignItems="center" justifyContent="center">
        <Svg width={size} height={size}>
          {/* Background ring */}
          <Circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2}
            fill="none"
            stroke={Colors.bgElevated}
            strokeWidth={strokeWidth}
          />

          {/* Arcs */}
          {arcs.map((arc, i) => (
            <Path
              key={i}
              d={describeArc(center, center, radius - strokeWidth / 2, arc.startAngle, arc.endAngle - 0.5)}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          ))}
        </Svg>

        {/* Center text */}
        <YStack position="absolute" alignItems="center" justifyContent="center">
          <Text fontSize={12} color={Colors.textMuted} fontWeight="500">
            Net Worth
          </Text>
          <Text fontSize={24} fontWeight="700" fontFamily="$mono" color={Colors.textPrimary}>
            {formatUSD(totalValue, true)}
          </Text>
        </YStack>
      </YStack>

      {/* Legend */}
      <XStack flexWrap="wrap" gap="$3" justifyContent="center" paddingHorizontal="$2">
        {arcs.map((arc, i) => (
          <XStack key={i} alignItems="center" gap="$1.5">
            <YStack width={8} height={8} borderRadius={4} backgroundColor={arc.color} />
            <Text fontSize={12} color={Colors.textSecondary}>
              {arc.symbol}
            </Text>
            <Text fontSize={12} fontFamily="$mono" color={Colors.textPrimary}>
              {arc.percentage.toFixed(1)}%
            </Text>
          </XStack>
        ))}
      </XStack>
    </YStack>
  );
}
