// @ts-nocheck
import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Input, Select } from '@/src/components/ui/core';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors, TOKEN_MINTS, TRADING } from '@/src/lib/constants';
import { useAutomationStore, type MacroIndicator, type ComparisonOperator } from '@/src/store/useAutomationStore';
import { useWalletStore } from '@/src/store/useWalletStore';

const INDICATORS: { value: MacroIndicator; label: string }[] = [
  { value: 'CPI', label: 'US CPI (Inflation)' },
  { value: 'CORE_CPI', label: 'Core CPI' },
  { value: 'FED_FUNDS', label: 'Fed Funds Rate' },
  { value: 'M2', label: 'M2 Money Supply' },
  { value: 'GDP', label: 'GDP Growth' },
  { value: 'UNEMPLOYMENT', label: 'Unemployment Rate' },
];

const OPERATORS: { value: ComparisonOperator; label: string }[] = [
  { value: '>', label: 'Greater than' },
  { value: '<', label: 'Less than' },
  { value: '>=', label: 'Greater or equal' },
  { value: '<=', label: 'Less or equal' },
];

const TOKEN_PAIRS = [
  { input: 'USDC', output: 'SOL', inputMint: TOKEN_MINTS.USDC, outputMint: TOKEN_MINTS.SOL },
  { input: 'USDC', output: 'BONK', inputMint: TOKEN_MINTS.USDC, outputMint: TOKEN_MINTS.BONK },
  { input: 'SOL', output: 'USDC', inputMint: TOKEN_MINTS.SOL, outputMint: TOKEN_MINTS.USDC },
];

interface TriggerFormProps {
  onClose: () => void;
}

export function TriggerForm({ onClose }: TriggerFormProps) {
  const { connected } = useWalletStore();
  const { addAutomation } = useAutomationStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [indicator, setIndicator] = useState<MacroIndicator>('CPI');
  const [operator, setOperator] = useState<ComparisonOperator>('>');
  const [threshold, setThreshold] = useState('');
  const [pairIndex, setPairIndex] = useState(0);
  const [amount, setAmount] = useState('');

  const pair = TOKEN_PAIRS[pairIndex];

  const handleSubmit = () => {
    if (!name || !threshold || !amount) return;
    addAutomation({
      name,
      condition: { indicator, operator, threshold: parseFloat(threshold) },
      action: {
        type: 'swap', inputMint: pair.inputMint, outputMint: pair.outputMint,
        inputSymbol: pair.input, outputSymbol: pair.output,
        amount: parseFloat(amount), slippageBps: TRADING.DEFAULT_SLIPPAGE_BPS,
      },
      enabled: true,
    });
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <YStack gap="$3">
            <Text fontSize={16} fontWeight="600" color={Colors.textPrimary}>Name your automation</Text>
            <Input size="$4" placeholder="e.g., CPI Inflation Hedge" value={name}
              onChangeText={setName} backgroundColor={Colors.bgDeep}
              color={Colors.textPrimary} borderColor={Colors.border}
              placeholderTextColor={Colors.textMuted} accessibilityLabel="Automation name" />
            <Text fontSize={16} fontWeight="600" color={Colors.textPrimary}>Select Macro Indicator</Text>
            <YStack gap="$2">
              {INDICATORS.map((ind) => (
                <Button key={ind.value} size="$4"
                  backgroundColor={indicator === ind.value ? Colors.indigo : Colors.bgDeep}
                  borderWidth={1} borderColor={indicator === ind.value ? Colors.indigo : Colors.border}
                  pressStyle={{ backgroundColor: Colors.bgHover }}
                  onPress={() => setIndicator(ind.value)} accessibilityLabel={ind.label}>
                  <Text color={indicator === ind.value ? '#FFF' : Colors.textPrimary} fontWeight="500">{ind.label}</Text>
                </Button>
              ))}
            </YStack>
          </YStack>
        );
      case 1:
        return (
          <YStack gap="$3">
            <Text fontSize={16} fontWeight="600" color={Colors.textPrimary}>Set Condition</Text>
            <Text fontSize={13} color={Colors.textSecondary}>
              When {INDICATORS.find(i => i.value === indicator)?.label}...
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              {OPERATORS.map((op) => (
                <Button key={op.value} size="$3" flex={1} minWidth={120}
                  backgroundColor={operator === op.value ? Colors.indigo : Colors.bgDeep}
                  borderWidth={1} borderColor={operator === op.value ? Colors.indigo : Colors.border}
                  onPress={() => setOperator(op.value)} accessibilityLabel={op.label}>
                  <Text color={operator === op.value ? '#FFF' : Colors.textPrimary} fontSize={13}>{op.label} ({op.value})</Text>
                </Button>
              ))}
            </XStack>
            <Input size="$4" placeholder="Threshold value (e.g., 3.0)" value={threshold}
              onChangeText={setThreshold} keyboardType="decimal-pad"
              backgroundColor={Colors.bgDeep} color={Colors.textPrimary}
              borderColor={Colors.border} placeholderTextColor={Colors.textMuted}
              accessibilityLabel="Threshold value" />
          </YStack>
        );
      case 2:
        return (
          <YStack gap="$3">
            <Text fontSize={16} fontWeight="600" color={Colors.textPrimary}>Define Swap Action</Text>
            <YStack gap="$2">
              {TOKEN_PAIRS.map((p, i) => (
                <Button key={i} size="$4"
                  backgroundColor={pairIndex === i ? Colors.indigo : Colors.bgDeep}
                  borderWidth={1} borderColor={pairIndex === i ? Colors.indigo : Colors.border}
                  onPress={() => setPairIndex(i)} accessibilityLabel={`Swap ${p.input} to ${p.output}`}>
                  <Text color={pairIndex === i ? '#FFF' : Colors.textPrimary} fontWeight="500">
                    {p.input} → {p.output}
                  </Text>
                </Button>
              ))}
            </YStack>
            <Input size="$4" placeholder={`Amount in ${pair.input}`} value={amount}
              onChangeText={setAmount} keyboardType="decimal-pad"
              backgroundColor={Colors.bgDeep} color={Colors.textPrimary}
              borderColor={Colors.border} placeholderTextColor={Colors.textMuted}
              accessibilityLabel="Swap amount" />
            <GlassCard padding="$2">
              <Text fontSize={11} color={Colors.textMuted}>
                Max slippage: {TRADING.MAX_SLIPPAGE_BPS / 100}% (hardcoded for protection)
              </Text>
            </GlassCard>
          </YStack>
        );
      case 3:
        return (
          <YStack gap="$3">
            <Text fontSize={16} fontWeight="600" color={Colors.textPrimary}>Review & Activate</Text>
            <GlassCard glow="indigo">
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="600" color={Colors.textPrimary}>{name}</Text>
                <YStack backgroundColor={Colors.bgDeep} padding="$2.5" borderRadius={10} gap="$1">
                  <Text fontSize={13} fontFamily="$mono" color={Colors.indigo}>
                    IF {INDICATORS.find(i => i.value === indicator)?.label} {operator} {threshold}
                  </Text>
                  <Text fontSize={13} fontFamily="$mono" color={Colors.neonGreen}>
                    THEN Swap {amount} {pair.input} → {pair.output}
                  </Text>
                </YStack>
              </YStack>
            </GlassCard>
            {!connected && (
              <GlassCard padding="$2" glow="red">
                <Text fontSize={12} color={Colors.coralRed} textAlign="center">
                  ⚠️ Connect your wallet to enable execution
                </Text>
              </GlassCard>
            )}
          </YStack>
        );
    }
  };

  const canProceed = step === 0 ? !!name : step === 1 ? !!threshold : step === 2 ? !!amount : true;

  return (
    <GlassCard elevated>
      <YStack gap="$4">
        {/* Progress */}
        <XStack gap="$2">
          {[0, 1, 2, 3].map((s) => (
            <YStack key={s} flex={1} height={3} borderRadius={2}
              backgroundColor={s <= step ? Colors.indigo : Colors.bgElevated} />
          ))}
        </XStack>

        {renderStep()}

        {/* Navigation */}
        <XStack gap="$3" justifyContent="space-between">
          <Button size="$3" backgroundColor="transparent" borderWidth={1}
            borderColor={Colors.border} onPress={step > 0 ? () => setStep(step - 1) : onClose}
            accessibilityLabel={step > 0 ? 'Back' : 'Cancel'}>
            <Text color={Colors.textPrimary}>{step > 0 ? 'Back' : 'Cancel'}</Text>
          </Button>
          {step < 3 ? (
            <Button size="$3" backgroundColor={Colors.indigo} disabled={!canProceed}
              opacity={canProceed ? 1 : 0.5} onPress={() => setStep(step + 1)}
              accessibilityLabel="Next step">
              <Text color="#FFF" fontWeight="600">Next</Text>
            </Button>
          ) : (
            <Button size="$3" backgroundColor={Colors.neonGreenDim} onPress={handleSubmit}
              pressStyle={{ scale: 0.98 }} accessibilityLabel="Activate automation">
              <Text color="#FFF" fontWeight="700">🚀 Activate</Text>
            </Button>
          )}
        </XStack>
      </YStack>
    </GlassCard>
  );
}
