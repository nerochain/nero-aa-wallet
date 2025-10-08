import { WalletConfig } from '@/types'
import { WEB3AUTH_NETWORK_TYPE } from '@web3auth/base'
import NEROLogoSquareIcon from '@/assets/NERO-Logo-square.svg'

/**
 * Simplified configuration interface for developers
 */
export interface SimpleWalletConfig {
  /** Paymaster API key for gasless transactions */
  paymasterApiKey: string
  /** Web3Auth Client ID for social login */
  web3AuthClientId: string
  /** Network: 'testnet' or 'mainnet' */
  network?: 'testnet' | 'mainnet'
  /** RainbowKit Project ID (optional, uses default if not provided) */
  rainbowKitProjectId?: string
  /** Google OAuth Client ID (optional) */
  googleClientId?: string
  /** Facebook OAuth App ID (optional) */
  facebookClientId?: string
  /** Custom wallet name (optional) */
  walletName?: string
  /** Custom wallet logo URL (optional) */
  walletLogo?: string
  /** Contact URL (optional) */
  contactUrl?: string
  /** Privacy Policy URL (optional) */
  privacyPolicyUrl?: string
  /** Terms of Service URL (optional) */
  termsOfServiceUrl?: string
}

/**
 * Default NERO Testnet configuration
 */
export const NERO_TESTNET_PRESET = {
  chain: {
    name: 'NERO Testnet',
    logo: NEROLogoSquareIcon,
    networkType: 'sapphire_devnet' as WEB3AUTH_NETWORK_TYPE,
    rpc: 'https://rpc-testnet.nerochain.io',
    chainId: 689,
    explorer: 'https://testnet.neroscan.io',
    explorerAPI: 'https://api-testnet.neroscan.io',
    nativeToken: {
      decimals: 18,
      name: 'NERO',
      symbol: 'NERO',
    },
  },
  aa: {
    bundler: 'https://bundler-testnet.nerochain.io',
    paymaster: 'https://paymaster-testnet.nerochain.io',
  },
  aaContracts: {
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    accountFactory: '0x9406Cc6185a346906296840746125a0E44976454',
    tokenPaymaster: '0x5a6680dFd4a77FEea0A7be291147768EaA2414ad',
  },
  web3auth: {
    network: 'testnet',
    loginConfig: {
      google: {
        name: 'google',
        verifier: 'nerotest-aa',
        typeOfLogin: 'google',
      },
      facebook: {
        name: 'facebook',
        verifier: 'nerotest-aa',
        typeOfLogin: 'facebook',
      },
    },
  },
}

/**
 * Default NERO Mainnet configuration
 */
export const NERO_MAINNET_PRESET = {
  chain: {
    name: 'NERO Mainnet',
    logo: NEROLogoSquareIcon,
    networkType: 'mainnet' as WEB3AUTH_NETWORK_TYPE,
    rpc: 'https://rpc.nerochain.io',
    chainId: 1689,
    explorer: 'https://neroscan.io',
    explorerAPI: 'https://api.neroscan.io',
    nativeToken: {
      decimals: 18,
      name: 'NERO',
      symbol: 'NERO',
    },
  },
  aa: {
    bundler: 'https://bundler-mainnet.nerochain.io',
    paymaster: 'https://paymaster-mainnet.nerochain.io',
  },
  aaContracts: {
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    accountFactory: '0x9406Cc6185a346906296840746125a0E44976454',
    tokenPaymaster: '0xC42E90D29D478ccFeCC28d3B838824E57e51F284',
  },
  web3auth: {
    network: 'mainnet',
    loginConfig: {
      google: {
        name: 'google',
        verifier: 'NeroTest-Google-Maintest',
        typeOfLogin: 'google',
      },
      facebook: {
        name: 'facebook',
        verifier: 'NeroTest-Facebook-Maintest',
        typeOfLogin: 'facebook',
      },
    },
  },
}

/**
 * Creates a complete WalletConfig from simplified configuration
 * @param config Simplified configuration object
 * @returns Complete WalletConfig ready to use with SocialWallet
 */
export function createWalletConfig(config: SimpleWalletConfig): WalletConfig {
  const network = config.network || 'testnet'
  const preset = network === 'mainnet' ? NERO_MAINNET_PRESET : NERO_TESTNET_PRESET

  return {
    rainbowKitProjectId: config.rainbowKitProjectId || '04309ed1007e77d1f119b85205bb779d',
    walletName: config.walletName || 'NERO wallet',
    walletLogo: config.walletLogo || NEROLogoSquareIcon,
    iconBackground: '#fff',
    contactAs: config.contactUrl || 'https://discord.com/invite/nerochainofficial',
    PrivacyPolicy:
      config.privacyPolicyUrl || 'https://www.app.testnet.nerochain.io/privacy',
    ServiceTerms: config.termsOfServiceUrl || 'https://docs.nerochain.io/',
    chains: [
      {
        chain: preset.chain,
        aa: {
          ...preset.aa,
          paymasterAPIKey: config.paymasterApiKey,
        },
        aaContracts: preset.aaContracts,
        web3auth: {
          clientId: config.web3AuthClientId,
          network: preset.web3auth.network,
          uiConfig: {
            appName: 'NERO',
            mode: 'light',
            useLogoLoader: true,
            defaultLanguage: 'en',
            theme: {
              primary: '#768729',
            },
            loginMethodsOrder: ['google', 'facebook', 'discord'],
            uxMode: 'redirect',
            modalZIndex: '2147483647',
          },
          loginConfig: {
            google: {
              ...preset.web3auth.loginConfig.google,
              clientId: config.googleClientId || '',
            },
            facebook: {
              ...preset.web3auth.loginConfig.facebook,
              clientId: config.facebookClientId || '',
            },
          },
        },
      },
    ],
  }
}

/**
 * Creates a multi-chain WalletConfig with both testnet and mainnet
 * @param testnetConfig Configuration for testnet
 * @param mainnetConfig Configuration for mainnet
 * @returns Complete WalletConfig with both networks
 */
export function createMultiChainConfig(
  testnetConfig: SimpleWalletConfig,
  mainnetConfig: SimpleWalletConfig,
): WalletConfig {
  const testnetPreset = NERO_TESTNET_PRESET
  const mainnetPreset = NERO_MAINNET_PRESET

  return {
    rainbowKitProjectId:
      testnetConfig.rainbowKitProjectId || '04309ed1007e77d1f119b85205bb779d',
    walletName: testnetConfig.walletName || 'NERO wallet',
    walletLogo: testnetConfig.walletLogo || NEROLogoSquareIcon,
    iconBackground: '#fff',
    contactAs:
      testnetConfig.contactUrl || 'https://discord.com/invite/nerochainofficial',
    PrivacyPolicy:
      testnetConfig.privacyPolicyUrl || 'https://www.app.testnet.nerochain.io/privacy',
    ServiceTerms: testnetConfig.termsOfServiceUrl || 'https://docs.nerochain.io/',
    chains: [
      {
        chain: testnetPreset.chain,
        aa: {
          ...testnetPreset.aa,
          paymasterAPIKey: testnetConfig.paymasterApiKey,
        },
        aaContracts: testnetPreset.aaContracts,
        web3auth: {
          clientId: testnetConfig.web3AuthClientId,
          network: testnetPreset.web3auth.network,
          uiConfig: {
            appName: 'NERO',
            mode: 'light',
            useLogoLoader: true,
            defaultLanguage: 'en',
            theme: {
              primary: '#768729',
            },
            loginMethodsOrder: ['google', 'facebook', 'discord'],
            uxMode: 'redirect',
            modalZIndex: '2147483647',
          },
          loginConfig: {
            google: {
              ...testnetPreset.web3auth.loginConfig.google,
              clientId: testnetConfig.googleClientId || '',
            },
            facebook: {
              ...testnetPreset.web3auth.loginConfig.facebook,
              clientId: testnetConfig.facebookClientId || '',
            },
          },
        },
      },
      {
        chain: mainnetPreset.chain,
        aa: {
          ...mainnetPreset.aa,
          paymasterAPIKey: mainnetConfig.paymasterApiKey,
        },
        aaContracts: mainnetPreset.aaContracts,
        web3auth: {
          clientId: mainnetConfig.web3AuthClientId,
          network: mainnetPreset.web3auth.network,
          uiConfig: {
            appName: 'NERO',
            mode: 'light',
            useLogoLoader: true,
            defaultLanguage: 'en',
            theme: {
              primary: '#768729',
            },
            loginMethodsOrder: ['google', 'facebook', 'discord'],
            uxMode: 'redirect',
            modalZIndex: '2147483647',
          },
          loginConfig: {
            google: {
              ...mainnetPreset.web3auth.loginConfig.google,
              clientId: mainnetConfig.googleClientId || '',
            },
            facebook: {
              ...mainnetPreset.web3auth.loginConfig.facebook,
              clientId: mainnetConfig.facebookClientId || '',
            },
          },
        },
      },
    ],
  }
}
