import React from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import '@/index.css';
import { WalletConfig } from '@/types';
interface SocialWalletProps {
    config: WalletConfig;
    zIndex?: number;
    children?: React.ReactNode;
    mode?: 'sidebar' | 'button';
}
export declare const SocialWallet: React.FC<SocialWalletProps>;
export { useAAtransfer, useSignature, useSendUserOp, useConfig, useAccountManager, useScreenManager, usePaymasterContext, useTokenContext, useNFTContext, useSendContext, useMultiSender, useTransactionContext, } from '@/hooks';
export type { WalletConfig, ConfigContextProps, SignatureContextProps, TokenContextType, NFTContextType, PaymasterContextType, TransactionContextProps, SendContextProps, SendUserOpContextProps, ScreenManagerContextType, AccountManagerContextProps, } from '@/types';
export type { Token, Activity, Transaction, Screen } from '@/types';
export { createWalletConfig, createMultiChainConfig, NERO_TESTNET_PRESET, NERO_MAINNET_PRESET, } from '@/config/presets';
export type { SimpleWalletConfig } from '@/config/presets';
