# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2024-11-12

### Changed

- Updated peer dependencies to support React 19+ (now accepts `>=18.3.1`)
- No longer requires `--legacy-peer-deps` flag for React 19 installations

## [1.0.0] - 2025-11-05

### Added

- Initial release of @nerochain/nero-wallet NPM package
- SocialWallet component for easy integration
- Account Abstraction (ERC-4337) support
- Social authentication via Web3Auth (Google, Facebook, Discord)
- Multi-account management
- Gasless transactions with paymaster support
- Token and NFT management
- Transaction history tracking
- Two display modes: sidebar and button
- Comprehensive TypeScript type definitions
- Full hook-based API for wallet operations
- Multi-chain support
- Deterministic account recovery
- Account consolidation feature

### Hooks Exported

- `useAccountManager` - Multi-account management
- `useSignature` - Account signature and connection status
- `useAAtransfer` - Execute token transfers
- `useSendUserOp` - Send user operations
- `useConfig` - Access wallet configuration
- `useClassifiedTokens` - Get categorized tokens and NFTs
- `useTransactions` - Access transaction history
- `useNFTList` - Get NFT list with metadata
- `useAccountConsolidation` - Consolidate funds across accounts
- `useSimpleAccount` - Access SimpleAccount instance
- `useScreenManager` - Manage wallet UI screens
- `useTokenContext` - Token context operations
- `useNFTContext` - NFT context operations
- `usePaymasterContext` - Paymaster operations
- `useTransactionContext` - Transaction context operations

### Features

- Full ERC-4337 Account Abstraction implementation
- Deterministic account generation using EOA + salt + chain ID
- Secure storage with IndexedDB (localforage)
- Migration from localStorage to IndexedDB
- Account hiding/showing functionality
- Real-time balance tracking
- Custom token and NFT support
- Multi-send functionality
- Transaction simulation and estimation
- Comprehensive error handling
- Security validation and sanitization

### Breaking Changes

None (initial release)

## [Unreleased]

### Planned

- Additional chain support
- Enhanced NFT features
- Advanced transaction batching
- Improved mobile responsiveness
- Additional social login providers
- Hardware wallet integration
