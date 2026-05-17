// @ts-nocheck
/**
 * useOpenWalletModal — opens the wallet selection modal.
 *
 * The modal opener is registered in the store by WalletSelectModal
 * (which renders inside the WalletProvider tree).
 */
import { useCallback } from 'react';
import { useWalletStore } from '@/src/store/useWalletStore';

export function useOpenWalletModal(): () => void {
  const openWalletModal = useWalletStore((s) => s.openWalletModal);

  return useCallback(() => {
    openWalletModal();
  }, [openWalletModal]);
}
