import { create } from 'zustand';
import { savePreferences } from '../api/walletProfile';

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
  amount: number;
  slippageBps: number;
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
  _walletAddress: string | null;

  addAutomation: (automation: Omit<Automation, 'id' | 'createdAt' | 'lastTriggered' | 'lastExecutedTxId' | 'status'>) => void;
  removeAutomation: (id: string) => void;
  toggleAutomation: (id: string) => void;
  updateStatus: (id: string, status: AutomationStatus, txId?: string) => void;

  /** Called by useWalletStore when a wallet connects — hydrates from DB */
  hydrateFromWallet: (address: string, automations: Automation[]) => void;
  /** Called on wallet disconnect — clear all automations */
  clearForWallet: () => void;
}

let _autoSyncTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedSyncAutomations(address: string, automations: Automation[], delay = 800) {
  if (_autoSyncTimer) clearTimeout(_autoSyncTimer);
  _autoSyncTimer = setTimeout(() => {
    savePreferences(address, { automations } as any).catch((err) =>
      console.warn('[AutomationStore] sync failed:', err)
    );
  }, delay);
}

export const useAutomationStore = create<AutomationState>()((set, get) => ({
  automations: [],
  _walletAddress: null,

  addAutomation: (automation) =>
    set((state) => {
      const next: Automation[] = [
        ...state.automations,
        {
          ...automation,
          id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          lastTriggered: null,
          lastExecutedTxId: null,
          status: 'monitoring' as AutomationStatus,
        },
      ];
      if (state._walletAddress) debouncedSyncAutomations(state._walletAddress, next);
      return { automations: next };
    }),

  removeAutomation: (id) =>
    set((state) => {
      const next = state.automations.filter((a) => a.id !== id);
      if (state._walletAddress) debouncedSyncAutomations(state._walletAddress, next);
      return { automations: next };
    }),

  toggleAutomation: (id) =>
    set((state) => {
      const next = state.automations.map((a) =>
        a.id === id
          ? {
              ...a,
              enabled: !a.enabled,
              status: (!a.enabled ? 'monitoring' : 'idle') as AutomationStatus,
            }
          : a
      );
      if (state._walletAddress) debouncedSyncAutomations(state._walletAddress, next);
      return { automations: next };
    }),

  updateStatus: (id, status, txId) =>
    set((state) => ({
      automations: state.automations.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              lastTriggered:
                status === 'triggered' || status === 'executed'
                  ? new Date().toISOString()
                  : a.lastTriggered,
              lastExecutedTxId: txId || a.lastExecutedTxId,
            }
          : a
      ),
    })),

  hydrateFromWallet: (address, automations) => {
    set({ _walletAddress: address, automations });
  },

  clearForWallet: () => {
    if (_autoSyncTimer) clearTimeout(_autoSyncTimer);
    set({ automations: [], _walletAddress: null });
  },
}));
