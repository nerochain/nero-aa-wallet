// src/index.tsx
import React from 'react'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '@/App'
import {
  AccountManagerProvider,
  ClientProvider,
  ConfigProvider,
  MultiSendProvider,
  NFTProvider,
  PaymasterProvider,
  ScreenManagerProvider,
  SendProvider,
  SendUserOpProvider,
  SignatureProvider,
  TokenProvider,
  TransactionProvider,
  WrapWagmiProvider,
} from '@/contexts'
import { AccountConsolidationProvider } from '@/contexts/AccountConsolidationContext'
import '@rainbow-me/rainbowkit/styles.css'
import '@/index.css'

// Export types
export type {
  WalletConfig,
  Token,
  ERC20Token,
  ERC721Token,
  NftWithImages,
  TokenData,
  Activity,
  ActionType,
  TransactionState,
  UserOperation,
  UserOperationResultInterface,
  OperationData,
  AccountData,
  AccountManagerContextProps,
  ConfigContextProps,
  SendContextProps,
  TokenContextType,
  NFTContextType,
  SignatureContextProps,
  PaymasterContextType,
  TransactionContextProps,
  AccountConsolidationContextProps,
  Transaction,
  FormattedTransaction,
  CombinedTransaction,
  PaymasterToken,
  PaymasterMode,
} from '@/types'

// Export hooks
export { useAAtransfer } from '@/hooks/operation/useAAtransfer'
export { useSignature } from '@/hooks/account/useSignature'
export { useSendUserOp } from '@/hooks/operation/useSendUserOp'
export { useConfig } from '@/hooks/operation/useConfig'
export { useAccountManager } from '@/hooks/account/useAccountManager'
export { useAccountConsolidation } from '@/hooks/account/useAccountConsolidation'
export { useSimpleAccount } from '@/hooks/account/useSimpleAccount'
export { useScreenManager } from '@/hooks/ui/useScreenManager'
export { useTokenContext } from '@/hooks/contexts/useTokenContext'
export { useNFTContext } from '@/hooks/contexts/useNFTContext'
export { usePaymasterContext } from '@/hooks/contexts/usePaymasterContext'
export { useTransactionContext } from '@/hooks/transaction/useTransactionContext'
export { useTransactions } from '@/hooks/transaction/useTransactions'
export { useClassifiedTokens } from '@/hooks/token/useClassifiedTokens'
export { useUserTokens } from '@/hooks/token/useUserTokens'
export { useNftList } from '@/hooks/nft/useNFTList'

// Main component interface
interface SocialWalletProps {
  config: WalletConfig
  zIndex?: number
  children?: React.ReactNode
  mode?: 'sidebar' | 'button'
}

/**
 * SocialWallet - Main wallet component
 *
 * @param config - Wallet configuration including chain, AA, and Web3Auth settings
 * @param zIndex - Z-index for the wallet UI (default: 9999)
 * @param children - React children to render inside the wallet provider
 * @param mode - Display mode: 'sidebar' or 'button' (default: 'sidebar')
 *
 * @example
 * ```tsx
 * import { SocialWallet } from '@nerochain/nero-wallet'
 * import '@nerochain/nero-wallet/styles.css'
 *
 * const config = {
 *   rainbowKitProjectId: 'your-project-id',
 *   walletName: 'My DApp Wallet',
 *   chains: [...]
 * }
 *
 * function App() {
 *   return (
 *     <SocialWallet config={config} mode="sidebar">
 *       <YourDAppContent />
 *     </SocialWallet>
 *   )
 * }
 * ```
 */
export const SocialWallet: React.FC<SocialWalletProps> = ({
  config,
  zIndex = 9999,
  children,
  mode = 'sidebar',
}) => {
  const queryClient = new QueryClient()

  return (
    <ConfigProvider config={config}>
      <WrapWagmiProvider>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider modalSize='compact'>
            <AccountManagerProvider>
              <SignatureProvider>
                <ScreenManagerProvider>
                  <PaymasterProvider>
                    <TokenProvider>
                      <NFTProvider>
                        <SendProvider>
                          <MultiSendProvider>
                            <ClientProvider>
                              <AccountConsolidationProvider>
                                <SendUserOpProvider>
                                  <TransactionProvider>
                                    {children}
                                    <div style={{ position: 'relative', zIndex: zIndex }}>
                                      <App mode={mode} />
                                    </div>
                                  </TransactionProvider>
                                </SendUserOpProvider>
                              </AccountConsolidationProvider>
                            </ClientProvider>
                          </MultiSendProvider>
                        </SendProvider>
                      </NFTProvider>
                    </TokenProvider>
                  </PaymasterProvider>
                </ScreenManagerProvider>
              </SignatureProvider>
            </AccountManagerProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WrapWagmiProvider>
    </ConfigProvider>
  )
}

// Re-export WalletConfig type for convenience
import type { WalletConfig } from '@/types'
export type { WalletConfig as NeroWalletConfig }
