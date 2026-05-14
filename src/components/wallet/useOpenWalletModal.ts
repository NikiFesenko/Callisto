// @ts-nocheck
/**
 * useOpenWalletModal — safely opens the wallet adapter modal.
 * 
 * Reads the __modalOpener from the zustand store (set by WalletSyncProvider).
 * The opener is available after the WalletSyncProvider mounts (which happens
 * after SolanaWalletProvider's dynamic imports resolve).
 */
import { useCallback } from 'react';
import { useWalletStore } from '@/src/store/useWalletStore';

export function useOpenWalletModal(): () => void {
  const storeOpener = useWalletStore((s) => s.openWalletModal);

  return useCallback(() => {
    // Check if the WalletSyncProvider has set the modal opener
    const state = useWalletStore.getState();
    if (typeof (state as any).__modalOpener === 'function') {
      // The _setModalOpener was called, so openWalletModal should work
      storeOpener();
    } else {
      // Fallback: try to find the wallet adapter button in the DOM
      const walletBtn = document.querySelector('.wallet-adapter-button-trigger') as HTMLElement;
      if (walletBtn) {
        walletBtn.click();
      } else {
        // Last resort
        storeOpener();
      }
    }
  }, [storeOpener]);
}
