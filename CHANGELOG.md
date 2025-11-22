# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.11] - 2024-11-21

### Fixed

- **Final solution**: Ethers bundled with package + enhanced Vite config required
- Polyfills injected via Rollup intro (for bundle integrity)
- Users configure Vite with proper Node.js polyfills

### Required Vite Configuration

```typescript
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
})
```

### Why This Approach?

Vite's dependency pre-bundler analyzes modules before execution. The bundle's intro polyfills run too late for pre-bundling. Users must configure Vite to provide polyfills during the optimization phase.

## [1.0.10] - 2024-11-12

### Fixed

- **Critical**: Fixed ethers default import issue completely
- Added proper CommonJS interop handling for ethers
- Changed ethers import to `import * as ethers` (namespace import)
- Resolves "No matching export for import 'default'" error definitively

## [1.0.9] - 2024-11-12

### Fixed

- Attempted fix for ethers import interop (partial solution)

## [1.0.8] - 2024-11-12

### Changed - BREAKING

- **Ethers.js now a peer dependency** - Must be installed by users
- No more polyfill headaches - ethers runs in user's environment with their polyfills
- Much cleaner and more reliable solution

### Installation

```bash
npm install @nerochain/nero-wallet @rainbow-me/rainbowkit @tanstack/react-query viem wagmi ethers@5.7.2
```

### Why This Change?

- ✅ No more Node.js polyfill issues
- ✅ Ethers handled by user's build system
- ✅ Cleaner, more standard approach
- ✅ Better compatibility with all bundlers

## [1.0.7] - 2024-11-12

### Fixed

- Attempted polyfill auto-injection (didn't work reliably)

## [1.0.6] - 2024-11-12

### Fixed

- **Critical**: Added try-catch around Web3Auth adapter configuration
- Better error messages for version mismatch issues
- Explicitly document required Web3Auth package versions

### Important - Exact Versions Required

Web3Auth packages MUST use these exact versions:

```bash
npm install @web3auth/modal@9.1.0 @web3auth/auth-adapter@9.0.2 @web3auth/base@9.0.2 @web3auth/ethereum-provider@9.0.2 @web3auth/web3auth-wagmi-connector@7.0.0
```

Version mismatches will cause `configureAdapter is not a function` errors.

## [1.0.5] - 2024-11-12

### Fixed

- **Critical**: Fixed dynamic require breaking builds in user projects
- Reverted to static import for Web3Auth connector (cleaner, more reliable)
- Web3Auth modal initialization via `initModal()` call

## [1.0.4] - 2024-11-12

### Fixed

- **Critical**: Added `web3AuthInstance.initModal()` call to initialize modal properly
- Web3Auth connector improvements

## [1.0.3] - 2024-11-12

### Fixed

- **BREAKING**: Moved Web3Auth packages to peer dependencies (optional)
- Web3Auth modal now renders correctly when installed via NPM
- Social login (Google, Facebook, Discord) now works properly

### Changed

- Web3Auth packages are now externalized instead of bundled
- Users must install Web3Auth packages if using social login features
- MetaMask login works without Web3Auth packages (no breaking change)

### Installation Update

If using social login, add Web3Auth packages:

```bash
npm install @web3auth/modal @web3auth/auth-adapter @web3auth/base @web3auth/ethereum-provider @web3auth/web3auth-wagmi-connector
```

**Note:** No code changes needed! The wallet automatically detects and initializes Web3Auth.

### ⚠️ Important: Vite Users

Node.js polyfills are **REQUIRED** for Vite projects:

```bash
npm install --save-dev vite-plugin-node-polyfills
```

Add to `vite.config.ts`:

```typescript
import { nodePolyfills } from 'vite-plugin-node-polyfills'
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  define: { 'process.env': {}, global: 'globalThis' },
})
```

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
