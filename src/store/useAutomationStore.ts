import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MacroIndicator = 'CPI' | 'CORE_CPI' | 'FED_FUNDS' | 'M2' | 'GDP' | 'UNEMPLOYMENT';
export type ComparisonOperator = '>' | '<' | '>=' | '<=' | '==';
export type AutomationStatus = 'idle' | 'monitoring' | 'triggered' | 'executed' | 'failed';

export interface AutomationCondition {
  indicator: MacroIndicator;
  operator: ComparisonOperator;
  threshold: number;
}

export interface AutomationAction {
  type: 'swap';
  inputMint: string;
  outputMint: string;
  inputSymbol: string;
  outputSymbol: string;
  amount: number; // in input token's smallest unit
  slippageBps: number; // hardcoded max 100 bps
}

export interface Automation {
  id: string;
  walletAddress?: string;
  name: string;
  condition: AutomationCondition;
  action: AutomationAction;
  enabled: boolean;
  createdAt: string;
  lastTriggered: string | null;
  lastExecutedTxId: string | null;
  status: AutomationStatus;
}

interface AutomationState {
  automations: Automation[];
  addAutomation: (automation: Omit<Automation, 'id' | 'createdAt' | 'lastTriggered' | 'lastExecutedTxId' | 'status'>) => void;
  removeAutomation: (id: string) => void;
  toggleAutomation: (id: string) => void;
  updateStatus: (id: string, status: AutomationStatus, txId?: string) => void;
}

export const useAutomationStore = create<AutomationState>()(
  persist(
    (set) => ({
      automations: [],

      addAutomation: (automation) =>
        set((state) => ({
          automations: [
            ...state.automations,
            {
              ...automation,
              id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              lastTriggered: null,
              lastExecutedTxId: null,
              status: 'monitoring' as AutomationStatus,
            },
          ],
        })),

      removeAutomation: (id) =>
        set((state) => ({
          automations: state.automations.filter((a) => a.id !== id),
        })),

      toggleAutomation: (id) =>
        set((state) => ({
          automations: state.automations.map((a) =>
            a.id === id
              ? {
                  ...a,
                  enabled: !a.enabled,
                  status: (!a.enabled ? 'monitoring' : 'idle') as AutomationStatus,
                }
              : a
          ),
        })),

      updateStatus: (id, status, txId) =>
        set((state) => ({
          automations: state.automations.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  lastTriggered: status === 'triggered' || status === 'executed' ? new Date().toISOString() : a.lastTriggered,
                  lastExecutedTxId: txId || a.lastExecutedTxId,
                }
              : a
          ),
        })),
    }),
    {
      name: 'colisto-automations',
      storage: createJSONStorage(() => {
        // Use AsyncStorage for React Native, fallback to localStorage for web
        try {
          return AsyncStorage;
        } catch {
          return localStorage as any;
        }
      }),
    }
  )
);
