import React, { useEffect, useRef, useState } from 'react';
import { Text } from '@/src/components/ui/core';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
}

export function AnimatedCounter({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 2,
  fontSize = 28,
  color = '#E2E8F0',
  fontWeight = '700',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const from = previousValue.current;
    const to = value;
    previousValue.current = value;
    
    if (from === to) return;

    let startTime: number;
    let animationFrameId: number;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      
      setDisplayValue(from + (to - from) * progress);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  const formattedValue = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <Text
      fontFamily="$mono"
      fontSize={fontSize}
      fontWeight={fontWeight as any}
      color={color}
      aria-label={`${prefix}${formattedValue}${suffix}`}
    >
      {prefix}{formattedValue}{suffix}
    </Text>
  );
}
