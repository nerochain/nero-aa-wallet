import { WalletConfig } from '@/types';
import { WEB3AUTH_NETWORK_TYPE } from '@web3auth/base';
/**
 * Simplified configuration interface for developers
 */
export interface SimpleWalletConfig {
    /** Paymaster API key for gasless transactions */
    paymasterApiKey: string;
    /** Web3Auth Client ID for social login */
    web3AuthClientId: string;
    /** Network: 'testnet' or 'mainnet' */
    network?: 'testnet' | 'mainnet';
    /** RainbowKit Project ID (optional, uses default if not provided) */
    rainbowKitProjectId?: string;
    /** Google OAuth Client ID (optional) */
    googleClientId?: string;
    /** Facebook OAuth App ID (optional) */
    facebookClientId?: string;
    /** Custom wallet name (optional) */
    walletName?: string;
    /** Custom wallet logo URL (optional) */
    walletLogo?: string;
    /** Contact URL (optional) */
    contactUrl?: string;
    /** Privacy Policy URL (optional) */
    privacyPolicyUrl?: string;
    /** Terms of Service URL (optional) */
    termsOfServiceUrl?: string;
}
/**
 * Default NERO Testnet configuration
 */
export declare const NERO_TESTNET_PRESET: {
    chain: {
        name: string;
        logo: string;
        networkType: WEB3AUTH_NETWORK_TYPE;
        rpc: string;
        chainId: number;
        explorer: string;
        explorerAPI: string;
        nativeToken: {
            decimals: number;
            name: string;
            symbol: string;
        };
    };
    aa: {
        bundler: string;
        paymaster: string;
    };
    aaContracts: {
        entryPoint: string;
        accountFactory: string;
        tokenPaymaster: string;
    };
    web3auth: {
        network: string;
        loginConfig: {
            google: {
                name: string;
                verifier: string;
                typeOfLogin: string;
            };
            facebook: {
                name: string;
                verifier: string;
                typeOfLogin: string;
            };
        };
    };
};
/**
 * Default NERO Mainnet configuration
 */
export declare const NERO_MAINNET_PRESET: {
    chain: {
        name: string;
        logo: string;
        networkType: WEB3AUTH_NETWORK_TYPE;
        rpc: string;
        chainId: number;
        explorer: string;
        explorerAPI: string;
        nativeToken: {
            decimals: number;
            name: string;
            symbol: string;
        };
    };
    aa: {
        bundler: string;
        paymaster: string;
    };
    aaContracts: {
        entryPoint: string;
        accountFactory: string;
        tokenPaymaster: string;
    };
    web3auth: {
        network: string;
        loginConfig: {
            google: {
                name: string;
                verifier: string;
                typeOfLogin: string;
            };
            facebook: {
                name: string;
                verifier: string;
                typeOfLogin: string;
            };
        };
    };
};
/**
 * Creates a complete WalletConfig from simplified configuration
 * @param config Simplified configuration object
 * @returns Complete WalletConfig ready to use with SocialWallet
 */
export declare function createWalletConfig(config: SimpleWalletConfig): WalletConfig;
/**
 * Creates a multi-chain WalletConfig with both testnet and mainnet
 * @param testnetConfig Configuration for testnet
 * @param mainnetConfig Configuration for mainnet
 * @returns Complete WalletConfig with both networks
 */
export declare function createMultiChainConfig(testnetConfig: SimpleWalletConfig, mainnetConfig: SimpleWalletConfig): WalletConfig;
