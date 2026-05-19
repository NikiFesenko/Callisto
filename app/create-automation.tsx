// @ts-nocheck
import React, { useState } from 'react';
import { ScrollView, Platform } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { YStack, XStack, Text, Button, Input } from '@/src/components/ui/core';
import { PageShell } from '@/src/components/ui/PageShell';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors, TOKEN_MINTS } from '@/src/lib/constants';
import { useAutomationStore, type MacroIndicator, type ComparisonOperator } from '@/src/store/useAutomationStore';
import { useWalletStore } from '@/src/store/useWalletStore';

const STRATEGIES = [
  { id: 'long', title: 'Long', desc: 'Buy base asset when condition met', icon: '↗️', color: Colors.neonGreen },
  { id: 'short', title: 'Short / Hedge', desc: 'Sell to stablecoin to protect funds', icon: '↘️', color: Colors.coralRed },
];

const MACRO_INDICATORS: { value: MacroIndicator; label: string; desc: string }[] = [
  { value: 'CPI', label: 'US CPI (Inflation)', desc: 'Consumer Price Index YoY' },
  { value: 'FED_FUNDS', label: 'Fed Funds Rate', desc: 'US Central Bank Interest Rate' },
  { value: 'M2', label: 'M2 Money Supply', desc: 'Total money supply in circulation' },
];

const OPERATORS: { value: ComparisonOperator; label: string }[] = [
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '≥' },
  { value: '<=', label: '≤' },
];

const RISK_PROFILES = [
  { id: 'conservative', title: 'Conservative', desc: 'Low slippage, larger grids', slippage: 0.1 },
  { id: 'moderate', title: 'Moderate', desc: 'Balanced execution', slippage: 0.5 },
  { id: 'aggressive', title: 'Aggressive', desc: 'Fast execution, higher slippage', slippage: 1.5 },
];

export default function CreateAutomationScreen() {
  const navigate = useNavigate();
  const { connected } = useWalletStore();
  const { addAutomation } = useAutomationStore();

  // Form State
  const [name, setName] = useState('');
  const [strategy, setStrategy] = useState('long');
  const [indicator, setIndicator] = useState<MacroIndicator>('CPI');
  const [operator, setOperator] = useState<ComparisonOperator>('>');
  const [threshold, setThreshold] = useState('');
  const [amount, setAmount] = useState('');
  const [riskProfile, setRiskProfile] = useState('moderate');

  const isWeb = Platform.OS === 'web';
  const isValid = name.length > 0 && threshold.length > 0 && amount.length > 0;

  const handleLaunch = () => {
    if (!isValid) return;
    
    // Determine input/output tokens based on strategy
    let inputMint, outputMint, inputSymbol, outputSymbol;
    if (strategy === 'long') {
      inputMint = TOKEN_MINTS.USDC;
      outputMint = TOKEN_MINTS.SOL;
      inputSymbol = 'USDC';
      outputSymbol = 'SOL';
    } else {
      inputMint = TOKEN_MINTS.SOL;
      outputMint = TOKEN_MINTS.USDC;
      inputSymbol = 'SOL';
      outputSymbol = 'USDC';
    }

    addAutomation({
      name,
      condition: { indicator, operator, threshold: parseFloat(threshold) },
      action: {
        type: 'swap',
        inputMint, outputMint,
        inputSymbol, outputSymbol,
        amount: parseFloat(amount),
        slippageBps: Math.floor((RISK_PROFILES.find(r => r.id === riskProfile)?.slippage || 0.5) * 100),
      },
      enabled: true,
    });
    
    navigate(-1);
  };

  return (
    <PageShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <YStack gap="$6" paddingHorizontal="$4" paddingTop="$4">
          
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center">
            <XStack gap="$3" alignItems="center">
              <Button size="$3" backgroundColor={Colors.bgSoft} borderRadius={20} onPress={() => navigate(-1)}>
                <Text color={Colors.textPrimary}>← Back</Text>
              </Button>
              <Text fontSize={24} fontWeight="700" color={Colors.textPrimary}>Create Bot</Text>
            </XStack>
          </XStack>

          <XStack flexWrap={isWeb ? 'nowrap' : 'wrap'} gap="$6">
            
            {/* Left Column: Configuration */}
            <YStack flex={2} gap="$6" minWidth={300}>
              
              {/* 1. Name */}
              <GlassCard elevated>
                <YStack gap="$3">
                  <Text fontSize={16} fontWeight="600" color={Colors.textPrimary}>1. Automation Name</Text>
                  <Input 
                    size="$4" 
                    placeholder="e.g., Inflation Hedge Bot" 
                    value={name}
                    onChangeText={setName} 
                    backgroundColor={Colors.bgDeep}
                    color={Colors.textPrimary} 
                    borderColor={Colors.border}
                  />
                </YStack>
              </GlassCard>

              {/* 2. Strategy */}
              <GlassCard elevated>
                <YStack gap="$4">
                  <Text fontSize={16} fontWeight="600" color={Colors.textPrimary}>2. Strategy Direction</Text>
                  <XStack gap="$3" flexWrap="wrap">
                    {STRATEGIES.map((s) => (
                      <Button 
                        key={s.id} 
                        flex={1}
                        minWidth={140}
                        backgroundColor={strategy === s.id ? Colors.bgHover : Colors.bgDeep}
                        borderWidth={2}
                        borderColor={strategy === s.id ? s.color : Colors.border}
                        onPress={() => setStrategy(s.id)}
                        paddingVertical="$3"
                        style={{ height: 'auto', alignItems: 'flex-start' }}
                      >
                        <YStack gap="$1" padding="$2">
                          <Text fontSize={20}>{s.icon}</Text>
                          <Text fontSize={15} fontWeight="700" color={Colors.textPrimary}>{s.title}</Text>
                          <Text fontSize={11} color={Colors.textMuted}>{s.desc}</Text>
                        </YStack>
                      </Button>
                    ))}
                  </XStack>
                  <YStack gap="$2" marginTop="$2">
                    <Text fontSize={14} fontWeight="600" color={Colors.textPrimary}>Allocation Amount</Text>
                    <Input 
                      size="$4" 
                      placeholder={`Amount in ${strategy === 'long' ? 'USDC' : 'SOL'}`}
                      value={amount}
                      onChangeText={setAmount} 
                      keyboardType="decimal-pad"
                      backgroundColor={Colors.bgDeep}
                      color={Colors.textPrimary} 
                      borderColor={Colors.border}
                    />
                  </YStack>
                </YStack>
              </GlassCard>

              {/* 3. Triggers / Filters */}
              <GlassCard elevated>
                <YStack gap="$4">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize={16} fontWeight="600" color={Colors.textPrimary}>3. Macro Triggers (Filters)</Text>
                    <Text fontSize={12} color={Colors.indigo}>+ Add Indicator</Text>
                  </XStack>
                  
                  <YStack gap="$3" backgroundColor={Colors.bgDeep} padding="$3" borderRadius={12} borderWidth={1} borderColor={Colors.borderSubtle}>
                    <Text fontSize={12} fontWeight="600" color={Colors.textMuted}>MAIN CONDITION</Text>
                    
                    <XStack gap="$2" flexWrap="wrap">
                      {MACRO_INDICATORS.map((ind) => (
                        <Button 
                          key={ind.value} 
                          size="$3"
                          backgroundColor={indicator === ind.value ? Colors.indigo : Colors.bgSoft}
                          borderWidth={1} 
                          borderColor={indicator === ind.value ? Colors.indigo : Colors.border}
                          onPress={() => setIndicator(ind.value)}
                        >
                          <Text color={indicator === ind.value ? '#FFF' : Colors.textPrimary} fontSize={12}>{ind.label}</Text>
                        </Button>
                      ))}
                    </XStack>

                    <XStack gap="$2" alignItems="center" marginTop="$2">
                      <XStack gap="$2">
                        {OPERATORS.map((op) => (
                          <Button 
                            key={op.value} 
                            size="$3"
                            backgroundColor={operator === op.value ? Colors.bgHover : Colors.bgSoft}
                            borderWidth={1} 
                            borderColor={operator === op.value ? Colors.indigo : Colors.border}
                            onPress={() => setOperator(op.value)}
                          >
                            <Text color={operator === op.value ? Colors.indigo : Colors.textPrimary} fontWeight="700">{op.label}</Text>
                          </Button>
                        ))}
                      </XStack>
                      <Input 
                        flex={1}
                        size="$3" 
                        placeholder="Value (e.g., 3.0)" 
                        value={threshold}
                        onChangeText={setThreshold} 
                        keyboardType="decimal-pad"
                        backgroundColor={Colors.bgBase}
                        color={Colors.textPrimary} 
                        borderColor={Colors.border}
                      />
                    </XStack>
                  </YStack>
                </YStack>
              </GlassCard>

              {/* 4. Risk Profile */}
              <GlassCard elevated>
                <YStack gap="$4">
                  <Text fontSize={16} fontWeight="600" color={Colors.textPrimary}>4. Execution Template</Text>
                  <XStack gap="$3" flexWrap="wrap">
                    {RISK_PROFILES.map((r) => (
                      <Button 
                        key={r.id} 
                        flex={1}
                        minWidth={100}
                        backgroundColor={riskProfile === r.id ? Colors.bgHover : Colors.bgDeep}
                        borderWidth={1}
                        borderColor={riskProfile === r.id ? Colors.neonGreen : Colors.border}
                        onPress={() => setRiskProfile(r.id)}
                        paddingVertical="$3"
                        style={{ height: 'auto', alignItems: 'flex-start' }}
                      >
                        <YStack gap="$1" padding="$1">
                          <Text fontSize={14} fontWeight="700" color={riskProfile === r.id ? Colors.neonGreen : Colors.textPrimary}>{r.title}</Text>
                          <Text fontSize={11} color={Colors.textMuted}>{r.desc}</Text>
                        </YStack>
                      </Button>
                    ))}
                  </XStack>
                </YStack>
              </GlassCard>
            </YStack>

            {/* Right Column: Sticky Summary */}
            <YStack flex={1} minWidth={280} gap="$4">
              <GlassCard elevated glow="indigo" style={{ position: isWeb ? 'sticky' : 'relative', top: 20 }}>
                <YStack gap="$4">
                  <Text fontSize={18} fontWeight="700" color={Colors.textPrimary}>Bot Summary</Text>
                  
                  <YStack gap="$2" paddingBottom="$4" borderBottomWidth={1} borderBottomColor={Colors.borderSubtle}>
                    <Text fontSize={12} color={Colors.textMuted}>NAME</Text>
                    <Text fontSize={15} fontWeight="600" color={Colors.textPrimary}>
                      {name || 'Unnamed Bot'}
                    </Text>
                  </YStack>

                  <YStack gap="$2" paddingBottom="$4" borderBottomWidth={1} borderBottomColor={Colors.borderSubtle}>
                    <Text fontSize={12} color={Colors.textMuted}>ACTION</Text>
                    <XStack gap="$2" alignItems="center">
                      <Text fontSize={18}>{strategy === 'long' ? '↗️' : '↘️'}</Text>
                      <Text fontSize={14} fontWeight="600" color={strategy === 'long' ? Colors.neonGreen : Colors.coralRed}>
                        {strategy === 'long' ? 'Long Market' : 'Short / Hedge'}
                      </Text>
                    </XStack>
                    {amount ? (
                      <Text fontSize={13} color={Colors.textSecondary}>
                        Swap {amount} {strategy === 'long' ? 'USDC → SOL' : 'SOL → USDC'}
                      </Text>
                    ) : (
                      <Text fontSize={13} color={Colors.textMuted}>Enter allocation amount</Text>
                    )}
                  </YStack>

                  <YStack gap="$2" paddingBottom="$4" borderBottomWidth={1} borderBottomColor={Colors.borderSubtle}>
                    <Text fontSize={12} color={Colors.textMuted}>CONDITION</Text>
                    <Text fontSize={13} fontFamily="$mono" color={Colors.indigo}>
                      IF {MACRO_INDICATORS.find(i => i.value === indicator)?.label} {operator} {threshold || '...'}
                    </Text>
                  </YStack>

                  <YStack gap="$2" paddingBottom="$4">
                    <Text fontSize={12} color={Colors.textMuted}>EXECUTION</Text>
                    <Text fontSize={13} color={Colors.textSecondary}>
                      {RISK_PROFILES.find(r => r.id === riskProfile)?.title} Mode 
                      (Max Slippage: {RISK_PROFILES.find(r => r.id === riskProfile)?.slippage}%)
                    </Text>
                  </YStack>

                  {!connected ? (
                     <YStack backgroundColor="rgba(255, 77, 106, 0.1)" padding="$3" borderRadius={8} borderWidth={1} borderColor={Colors.coralRedDim}>
                       <Text fontSize={12} color={Colors.coralRed} textAlign="center" fontWeight="600">
                         Wallet Connection Required
                       </Text>
                     </YStack>
                  ) : (
                    <Button 
                      size="$4" 
                      backgroundColor={isValid ? Colors.neonGreenDim : Colors.bgSoft}
                      disabled={!isValid}
                      opacity={isValid ? 1 : 0.5}
                      onPress={handleLaunch}
                      pressStyle={{ scale: 0.98 }}
                    >
                      <Text color={isValid ? '#FFF' : Colors.textMuted} fontWeight="700" fontSize={16}>
                        🚀 Launch Bot
                      </Text>
                    </Button>
                  )}

                </YStack>
              </GlassCard>
            </YStack>

          </XStack>
        </YStack>
      </ScrollView>
    </PageShell>
  );
}
