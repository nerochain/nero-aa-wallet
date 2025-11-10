import React, { createContext, useContext } from 'react'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { metaMaskWallet, bitgetWallet, gateWallet } from '@rainbow-me/rainbowkit/wallets'
import { defineChain } from 'viem'
import { http, WagmiProvider } from 'wagmi'
import { rainbowWeb3AuthConnector } from '@/config/rainbowWeb3authConnector'
import { ConfigContext } from './ConfigContext'

interface WrapWagmiContextProps {
  entryPoint?: string
  projectId?: string
  zIndex?: number
  children?: React.ReactNode
}

const WrapWagmiContext = createContext<WrapWagmiContextProps | undefined>(undefined)

export const WrapWagmiProvider: React.FC<WrapWagmiContextProps> = ({ children }) => {
  const config = useContext(ConfigContext)

  if (!config) {
    throw new Error('WrapWagmiProvider must be used within a ConfigProvider')
  }

  const {
    projectId,
    chainId,
    chainName,
    networkType,
    rpcUrl,
    explorerUrl,
    tokenName,
    tokenSymbol,
    tokenDecimals,
    walletName,
    walletLogo,
    uiConfig,
    loginConfig,
    clientId,
    walletBackground,
  } = config

  const neroChain = defineChain({
    id: chainId,
    name: chainName,
    network: chainName.toLowerCase(),
    nativeCurrency: {
      decimals: Number(tokenDecimals),
      name: tokenName,
      symbol: tokenSymbol,
    },
    rpcUrls: {
      default: {
        http: [rpcUrl],
      },
      public: {
        http: [rpcUrl],
      },
    },
    blockExplorers: {
      default: {
        name: 'NeroScan',
        url: explorerUrl,
      },
    },
  })

  const NEROWallet = rainbowWeb3AuthConnector({
    chain: neroChain,
    walletConfig: {
      name: walletName,
      networkType: networkType,
      logo: walletLogo,
      walletBackground,
      clientId,
      uiConfig: {
        ...uiConfig,
        uxMode: 'redirect',
        modalZIndex: '2147483647',
      },
      loginConfig,
    },
  })

  const wagmiConfig = getDefaultConfig({
    appName: uiConfig.appName,
    projectId,
    chains: [neroChain],
    transports: {
      [neroChain.id]: http(),
    },
    wallets: [
      {
        groupName: 'Recommended',
        wallets: [
          ...(config?.hasWeb3AuthConfig ? [NEROWallet] : []),
          metaMaskWallet,
          bitgetWallet,
          gateWallet,
        ],
      },
    ],
  })

  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
}

export { WrapWagmiContext }
export type { WrapWagmiContextProps }
