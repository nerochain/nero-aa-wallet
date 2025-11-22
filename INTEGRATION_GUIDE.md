# 🚀 NERO Wallet Integration Guide

Complete guide for integrating the NERO Account Abstraction Wallet into your React application.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Section 1: New Project Integration](#section-1-new-project-integration)
- [Section 2: Existing Project Integration](#section-2-existing-project-integration)
- [Configuration Guide](#configuration-guide)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** version 18.0 or higher
- **npm** or **yarn** package manager
- **RainbowKit Project ID** - Get one at https://cloud.walletconnect.com/
- **Web3Auth Client ID** (Optional) - Get one at https://dashboard.web3auth.io/
- **Paymaster API Key** (Optional) - For gasless transactions

---

## Section 1: New Project Integration

Starting from scratch? Follow these steps to create a new React project with NERO Wallet integration.

### Step 1: Create a New React Project

#### Option A: Using Vite (Recommended)

```bash
# Create a new Vite + React + TypeScript project
npm create vite@latest my-nero-dapp -- --template react-ts

# Navigate to the project
cd my-nero-dapp
```

#### Option B: Using Create React App

```bash
# Create a new React app with TypeScript
npx create-react-app my-nero-dapp --template typescript

# Navigate to the project
cd my-nero-dapp
```

### Step 2: Install NERO Wallet and Dependencies

**Base installation (MetaMask + other wallet connectors):**

```bash
# Install the NERO Wallet package
npm install @nerochain-test/nero-wallet

# Install required peer dependencies
npm install react react-dom @rainbow-me/rainbowkit @tanstack/react-query viem wagmi
```

**Optional: Add social login (Google, Facebook, Discord):**

```bash
npm install @web3auth/modal @web3auth/auth-adapter @web3auth/base @web3auth/ethereum-provider @web3auth/web3auth-wagmi-connector
```

> 💡 **Just install and forget!** The wallet automatically detects and initializes Web3Auth. No additional code or imports needed. MetaMask works without these packages.

### Step 3: Configure Vite (If Using Vite)

Update your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(), // Required for crypto and buffer polyfills
  ],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['js-big-decimal'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
```

Install the required Vite plugin:

```bash
npm install --save-dev vite-plugin-node-polyfills
```

### Step 4: Create Wallet Configuration

Create a new file `src/walletConfig.ts`:

```typescript
import type { WalletConfig } from '@nerochain-test/nero-wallet'

export const walletConfig: WalletConfig = {
  // RainbowKit configuration
  rainbowKitProjectId: 'YOUR_RAINBOWKIT_PROJECT_ID', // Get from https://cloud.walletconnect.com/

  // Wallet branding
  walletName: 'My DApp Wallet',
  walletLogo: 'https://your-domain.com/logo.svg',
  iconBackground: '#ffffff',

  // Support links
  contactAs: 'https://discord.gg/your-discord',
  PrivacyPolicy: 'https://your-domain.com/privacy',
  ServiceTerms: 'https://your-domain.com/terms',

  // Chain configuration
  chains: [
    {
      // Chain details
      chain: {
        name: 'NERO Testnet',
        logo: 'https://nerochain.io/logo.svg',
        networkType: 'sapphire_devnet',
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

      // Account Abstraction configuration
      aa: {
        bundler: 'https://bundler-testnet.nerochain.io',
        paymaster: 'https://paymaster-testnet.nerochain.io',
        paymasterAPIKey: 'YOUR_PAYMASTER_API_KEY', // Optional
      },

      // AA Contract addresses
      aaContracts: {
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
        accountFactory: '0x9406Cc6185a346906296840746125a0E44976454',
        tokenPaymaster: '0x5a6680dFd4a77FEea0A7be291147768EaA2414ad',
      },

      // Web3Auth configuration (Optional for social login)
      web3auth: {
        // IMPORTANT: If you don't have a Web3Auth Client ID yet, use an empty string
        // The wallet will work with MetaMask only until you configure Web3Auth
        clientId: '', // Leave empty or get from https://dashboard.web3auth.io/
        network: 'testnet', // 'mainnet' | 'testnet' | 'cyan'
        uiConfig: {
          appName: 'My DApp',
          mode: 'light', // 'light' | 'dark'
          useLogoLoader: true,
          defaultLanguage: 'en',
          theme: {
            primary: '#768729',
          },
          loginMethodsOrder: ['google', 'facebook', 'discord', 'github'],
          uxMode: 'redirect', // 'popup' | 'redirect'
          modalZIndex: '2147483647',
        },
        loginConfig: {},
      },
    },
  ],
}
```

### Step 5: Set Up Your Main App Component

Update `src/App.tsx`:

```typescript
import { SocialWallet } from '@nerochain-test/nero-wallet'
import '@nerochain-test/nero-wallet/styles.css'
import '@rainbow-me/rainbowkit/styles.css'

// 🚨 CRITICAL for social login: Import Web3Auth CSS so modal appears
import '@web3auth/base/dist/esm/index.css'

import { walletConfig } from './walletConfig'

function App() {
  return (
    <SocialWallet config={walletConfig} mode="sidebar">
      {/* Your app content goes here */}
      <div style={{ padding: '40px' }}>
        <h1>Welcome to My DApp</h1>
        <p>Connect your wallet using the button in the top right corner!</p>
      </div>
    </SocialWallet>
  )
}

export default App
```

### Step 6: Start Your Development Server

```bash
npm run dev
```

Open your browser to `http://localhost:5173` (Vite) or `http://localhost:3000` (CRA).

### Step 7: Test the Integration

1. Click the wallet connect button in the top right
2. Connect using MetaMask or social login
3. Create an Account Abstraction account
4. Start using the wallet features!

**🎉 Congratulations!** You've successfully integrated NERO Wallet into your new project!

---

## Section 2: Existing Project Integration

Already have a React project? Follow these steps to add NERO Wallet to it.

### Step 1: Install NERO Wallet

**Base installation (MetaMask + other wallet connectors):**

```bash
# Install the package
npm install @nerochain-test/nero-wallet

# Install peer dependencies (if not already installed)
npm install @rainbow-me/rainbowkit @tanstack/react-query viem wagmi
```

**Optional: Add social login (Google, Facebook, Discord):**

```bash
npm install @web3auth/modal @web3auth/auth-adapter @web3auth/base @web3auth/ethereum-provider @web3auth/web3auth-wagmi-connector
```

> 💡 **Just install and forget!** The wallet automatically detects and initializes Web3Auth. No additional code or imports needed. MetaMask works without these packages.

### Step 2: Check Your Build Configuration

#### For Vite Projects

Ensure your `vite.config.ts` includes the necessary polyfills:

```bash
npm install --save-dev vite-plugin-node-polyfills
```

Update your `vite.config.ts`:

```typescript
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(), // Add this
  ],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['js-big-decimal'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
```

#### For Create React App Projects

CRA projects need some additional configuration. Install CRACO:

```bash
npm install @craco/craco
```

Create `craco.config.js` in your project root:

```javascript
const webpack = require('webpack')

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add node polyfills
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        buffer: require.resolve('buffer/'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        process: require.resolve('process/browser'),
      }

      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
      )

      return webpackConfig
    },
  },
}
```

Install polyfill dependencies:

```bash
npm install buffer crypto-browserify stream-browserify process
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test"
  }
}
```

#### For Next.js Projects

Update your `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      process: require.resolve('process/browser'),
    }
    return config
  },
}

module.exports = nextConfig
```

### Step 3: Create Wallet Configuration

Create a configuration file (e.g., `src/config/walletConfig.ts`):

```typescript
import type { WalletConfig } from '@nerochain-test/nero-wallet'

export const walletConfig: WalletConfig = {
  // IMPORTANT: RainbowKit Project ID is REQUIRED
  rainbowKitProjectId:
    process.env.REACT_APP_RAINBOWKIT_PROJECT_ID || '04309ed1007e77d1f119b85205bb779d',
  walletName: 'My Existing DApp',
  walletLogo: 'https://via.placeholder.com/150', // Use a real URL or placeholder
  iconBackground: '#ffffff',
  contactAs: 'https://your-support-url.com',
  PrivacyPolicy: 'https://your-domain.com/privacy',
  ServiceTerms: 'https://your-domain.com/terms',
  chains: [
    {
      chain: {
        name: 'NERO Testnet',
        logo: 'https://nerochain.io/logo.svg',
        networkType: 'sapphire_devnet',
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
        paymasterAPIKey: process.env.REACT_APP_PAYMASTER_API_KEY || '',
      },
      aaContracts: {
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
        accountFactory: '0x9406Cc6185a346906296840746125a0E44976454',
        tokenPaymaster: '0x5a6680dFd4a77FEea0A7be291147768EaA2414ad',
      },
      web3auth: {
        clientId: process.env.REACT_APP_WEB3AUTH_CLIENT_ID || '',
        network: 'testnet',
        uiConfig: {
          appName: 'My DApp',
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
        loginConfig: {},
      },
    },
  ],
}
```

### Step 4: Wrap Your App with SocialWallet

Update your main app component (e.g., `src/App.tsx` or `src/App.jsx`):

```typescript
import { SocialWallet } from '@nerochain-test/nero-wallet'
import '@nerochain-test/nero-wallet/styles.css'
import '@rainbow-me/rainbowkit/styles.css'

// 🚨 CRITICAL for social login: Import Web3Auth CSS so modal appears
import '@web3auth/base/dist/esm/index.css'

import { walletConfig } from './config/walletConfig'

// Your existing components
import YourExistingContent from './components/YourExistingContent'

function App() {
  return (
    <SocialWallet config={walletConfig} mode="sidebar">
      {/* Your existing app content */}
      <YourExistingContent />
    </SocialWallet>
  )
}

export default App
```

### Step 5: Create Environment Variables

Create a `.env` file in your project root:

```bash
# RainbowKit (Required)
REACT_APP_RAINBOWKIT_PROJECT_ID=your_project_id_here

# Web3Auth (Optional - for social login)
REACT_APP_WEB3AUTH_CLIENT_ID=your_client_id_here

# Paymaster (Optional - for gasless transactions)
REACT_APP_PAYMASTER_API_KEY=your_api_key_here
```

**Important:** Add `.env` to your `.gitignore`:

```bash
echo ".env" >> .gitignore
```

### Step 6: Update Your Styles (Optional)

If you want to customize the wallet appearance, add to your global CSS:

```css
/* Override NERO Wallet styles */
:root {
  --nero-wallet-primary: #your-brand-color;
  --nero-wallet-background: #ffffff;
  --nero-wallet-text: #000000;
}
```

### Step 7: Test the Integration

```bash
npm start
```

Visit your app and verify:

1. ✅ Wallet connect button appears
2. ✅ Can connect wallet
3. ✅ Can create AA account
4. ✅ All features work correctly
5. ✅ Your existing functionality still works

**🎉 Integration complete!** Your existing app now has NERO Wallet functionality!

---

## Configuration Guide

### Wallet Modes

The wallet supports two display modes:

```typescript
// Sidebar mode (default) - Wallet slides in from the right
<SocialWallet config={walletConfig} mode="sidebar">
  <YourApp />
</SocialWallet>

// Modal mode - Wallet opens as a centered modal
<SocialWallet config={walletConfig} mode="modal">
  <YourApp />
</SocialWallet>
```

### Environment-Specific Configuration

#### Development Configuration

```typescript
export const walletConfig: WalletConfig = {
  chains: [
    {
      chain: {
        name: 'NERO Testnet',
        networkType: 'sapphire_devnet',
        rpc: 'https://rpc-testnet.nerochain.io',
        chainId: 689,
        // ... other testnet config
      },
      // ...
    },
  ],
}
```

#### Production Configuration

```typescript
export const walletConfig: WalletConfig = {
  chains: [
    {
      chain: {
        name: 'NERO Mainnet',
        networkType: 'sapphire_mainnet',
        rpc: 'https://rpc.nerochain.io',
        chainId: 690, // Replace with actual mainnet chain ID
        explorer: 'https://neroscan.io',
        explorerAPI: 'https://api.neroscan.io',
        // ... other mainnet config
      },
      aa: {
        bundler: 'https://bundler.nerochain.io',
        paymaster: 'https://paymaster.nerochain.io',
        paymasterAPIKey: process.env.REACT_APP_PAYMASTER_API_KEY,
      },
      // ...
    },
  ],
}
```

### Multi-Chain Support

You can configure multiple chains:

```typescript
export const walletConfig: WalletConfig = {
  // ... other config
  chains: [
    {
      // NERO Testnet
      chain: {
        name: 'NERO Testnet',
        chainId: 689,
        // ... testnet config
      },
      // ...
    },
    {
      // NERO Mainnet
      chain: {
        name: 'NERO Mainnet',
        chainId: 690,
        // ... mainnet config
      },
      // ...
    },
  ],
}
```

---

## Usage Examples

### Example 1: Accessing Wallet Hooks

Create a component that uses wallet data:

```typescript
import { useAccountManager, useSignature } from '@nerochain-test/nero-wallet'

function WalletInfo() {
  const { eoaAddress, scaAddress, aaAccountAddress } = useAccountManager()
  const { isConnected } = useSignature()

  if (!isConnected) {
    return <div>Please connect your wallet</div>
  }

  return (
    <div>
      <h3>Wallet Information</h3>
      <p>EOA Address: {eoaAddress}</p>
      <p>SCA Address: {scaAddress}</p>
      <p>AA Account: {aaAccountAddress}</p>
    </div>
  )
}

// Use inside SocialWallet
function App() {
  return (
    <SocialWallet config={walletConfig} mode="sidebar">
      <WalletInfo />
    </SocialWallet>
  )
}
```

### Example 2: Custom Send Transaction Button

```typescript
import { useAccountManager } from '@nerochain-test/nero-wallet'
import { useState } from 'react'

function CustomSendButton() {
  const { aaAccountAddress } = useAccountManager()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')

  const handleSend = async () => {
    if (!aaAccountAddress) {
      alert('Please create an AA account first')
      return
    }

    // Your send logic here
    console.log(`Sending ${amount} to ${recipient}`)
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        type="text"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleSend}>Send Transaction</button>
    </div>
  )
}
```

### Example 3: Token Balance Display

```typescript
import { useClassifiedTokens, useSignature } from '@nerochain-test/nero-wallet'

function TokenBalances() {
  const { isConnected } = useSignature()
  const { nativeToken, erc20Tokens } = useClassifiedTokens()

  if (!isConnected) return null

  return (
    <div>
      <h3>Your Balances</h3>

      {/* Native token */}
      {nativeToken && (
        <div>
          <strong>{nativeToken.symbol}</strong>: {nativeToken.balance}
        </div>
      )}

      {/* ERC20 tokens */}
      {erc20Tokens.map((token) => (
        <div key={token.address}>
          <strong>{token.symbol}</strong>: {token.balance}
        </div>
      ))}
    </div>
  )
}
```

### Example 4: NFT Gallery

```typescript
import { useNftList } from '@nerochain-test/nero-wallet'

function NFTGallery() {
  const { nfts, isLoading } = useNftList()

  if (isLoading) return <div>Loading NFTs...</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
      {nfts.map((nft) => (
        <div key={`${nft.contractAddress}-${nft.tokenId}`}>
          <img src={nft.image} alt={nft.name} style={{ width: '100%' }} />
          <h4>{nft.name}</h4>
          <p>{nft.description}</p>
        </div>
      ))}
    </div>
  )
}
```

### Example 5: Transaction History

```typescript
import { useTransactions } from '@nerochain-test/nero-wallet'

function TransactionHistory() {
  const { transactions, isLoading } = useTransactions()

  if (isLoading) return <div>Loading transactions...</div>

  return (
    <div>
      <h3>Recent Transactions</h3>
      {transactions.map((tx) => (
        <div key={tx.hash} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
          <div>
            <strong>Hash:</strong> {tx.hash.substring(0, 10)}...
          </div>
          <div>
            <strong>Type:</strong> {tx.type}
          </div>
          <div>
            <strong>Status:</strong> {tx.status}
          </div>
          <div>
            <strong>Date:</strong> {new Date(tx.timestamp).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## Available Hooks

The NERO Wallet provides several React hooks for accessing wallet functionality:

### Account Hooks

- `useAccountManager()` - Access account addresses and management functions
- `useSignature()` - Check connection status and signing capabilities
- `useSimpleAccount()` - Access simple account operations
- `useGetSigner()` - Get the ethers.js signer instance

### Token Hooks

- `useClassifiedTokens()` - Get categorized tokens (native, ERC20, etc.)
- `useUserTokens()` - Get user's token balances
- `useSupportedTokens()` - Get list of supported tokens
- `useCustomTokens()` - Manage custom token imports

### NFT Hooks

- `useNftList()` - Get user's NFT collection
- `useErc721Transfer()` - Transfer NFT functionality

### Transaction Hooks

- `useTransactions()` - Get transaction history
- `useTransaction()` - Track specific transaction
- `useAAtransfer()` - AA transfer functionality

### Operation Hooks

- `useSendUserOp()` - Send user operations
- `useEstimateUserOpFee()` - Estimate operation fees
- `useMultiSender()` - Multi-send functionality
- `useConfig()` - Access wallet configuration

### UI Hooks

- `useScreenManager()` - Control wallet screen navigation

---

## Troubleshooting

### Common Issues

#### Issue 1: "Cannot read properties of undefined (reading 'bind')" or "end-of-stream" errors

**Cause:** Missing Node.js polyfills for blockchain dependencies (ethers.js).

**Solution:** This is **REQUIRED** for Vite projects. Install node polyfills:

```bash
npm install --save-dev vite-plugin-node-polyfills
```

Update `vite.config.ts`:

```typescript
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
})
```

#### Issue 2: "Module not found: Can't resolve 'buffer'"

**Solution:** Install node polyfills (same as Issue 1):

```bash
npm install --save-dev vite-plugin-node-polyfills
```

Update `vite.config.ts` as shown above.

#### Issue 3: "process is not defined"

**Solution:** Add to your Vite config:

```typescript
define: {
  'process.env': {},
  global: 'globalThis',
}
```

#### Issue 3: Hooks not working / "Cannot read properties of undefined"

**Solution:** Make sure you're using hooks inside the `<SocialWallet>` component:

```typescript
// ❌ Wrong - hooks outside SocialWallet
function App() {
  const { isConnected } = useSignature() // This will fail!
  return <SocialWallet config={walletConfig}>...</SocialWallet>
}

// ✅ Correct - hooks inside SocialWallet
function WalletContent() {
  const { isConnected } = useSignature() // This works!
  return <div>Connected: {isConnected}</div>
}

function App() {
  return (
    <SocialWallet config={walletConfig}>
      <WalletContent />
    </SocialWallet>
  )
}
```

#### Issue 4: Styles not loading

**Solution:** Make sure you've imported both CSS files:

```typescript
import '@nerochain-test/nero-wallet/styles.css'
import '@rainbow-me/rainbowkit/styles.css'
```

#### Issue 5: RainbowKit connection issues

**Solution:** Verify your RainbowKit Project ID is correct:

1. Go to https://cloud.walletconnect.com/
2. Create or select your project
3. Copy the Project ID
4. Update your wallet config or `.env` file

#### Issue 6: Web3Auth modal doesn't appear (stuck on "Opening NERO wallet...")

**Cause:** Missing Web3Auth CSS import.

**Solution:** Add this import to your `App.tsx`:

```typescript
import '@web3auth/base/dist/esm/index.css'
```

Full example:

```typescript
import { SocialWallet } from '@nerochain-test/nero-wallet'
import '@nerochain-test/nero-wallet/styles.css'
import '@rainbow-me/rainbowkit/styles.css'
import '@web3auth/base/dist/esm/index.css' // Add this!
```

#### Issue 7: Web3Auth not working

**Solution:** Check your Web3Auth configuration:

1. Verify Client ID is correct
2. Add your app URL to allowed origins in Web3Auth dashboard
3. Ensure redirect URLs are configured

#### Issue 7: Build errors with Next.js

**Solution:** Add webpack configuration and make components client-side only:

```typescript
'use client' // Add this at the top of your component file

import { SocialWallet } from '@nerochain-test/nero-wallet'
// ...
```

#### Issue 8: "Cannot find module '@nerochain-test/nero-wallet'"

**Solution:** Reinstall the package:

```bash
rm -rf node_modules package-lock.json
npm install
```

#### Issue 9: "Cannot read properties of undefined (reading 'name')"

This error occurs during RainbowKit initialization. It usually means your configuration is incomplete.

**Solution 1: Check Required Fields**

Make sure your `walletConfig` has ALL required fields:

```typescript
export const walletConfig: WalletConfig = {
  // REQUIRED: RainbowKit Project ID (never leave empty!)
  rainbowKitProjectId: 'YOUR_PROJECT_ID_HERE', // Get from https://cloud.walletconnect.com/

  // REQUIRED: Wallet branding
  walletName: 'My DApp Wallet', // Cannot be empty
  walletLogo: 'https://via.placeholder.com/150', // Use placeholder if you don't have a logo yet
  iconBackground: '#ffffff',

  // REQUIRED: Support links (use placeholders if needed)
  contactAs: 'https://discord.gg/your-discord',
  PrivacyPolicy: 'https://your-domain.com/privacy',
  ServiceTerms: 'https://your-domain.com/terms',

  // REQUIRED: At least one chain configuration
  chains: [
    {
      chain: {
        name: 'NERO Testnet', // Cannot be empty
        logo: 'https://nerochain.io/logo.svg',
        networkType: 'sapphire_devnet', // Cannot be empty
        rpc: 'https://rpc-testnet.nerochain.io', // Cannot be empty
        chainId: 689, // Must be a number
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
        paymasterAPIKey: '', // Can be empty
      },
      aaContracts: {
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
        accountFactory: '0x9406Cc6185a346906296840746125a0E44976454',
        tokenPaymaster: '0x5a6680dFd4a77FEea0A7be291147768EaA2414ad',
      },
      web3auth: {
        clientId: '', // CAN be empty (will use MetaMask only)
        network: 'testnet',
        uiConfig: {
          appName: 'My DApp',
          mode: 'light',
          useLogoLoader: true,
          defaultLanguage: 'en',
          theme: {
            primary: '#768729',
          },
          loginMethodsOrder: ['google'],
          uxMode: 'redirect',
          modalZIndex: '2147483647',
        },
        loginConfig: {},
      },
    },
  ],
}
```

**Solution 2: Use the Quick Start Template**

Copy and paste this working configuration:

```typescript
import type { WalletConfig } from '@nerochain-test/nero-wallet'

export const walletConfig: WalletConfig = {
  rainbowKitProjectId: '04309ed1007e77d1f119b85205bb779d', // Demo ID - replace with yours!
  walletName: 'Demo Wallet',
  walletLogo: 'https://nerochain.io/logo.svg',
  iconBackground: '#fff',
  contactAs: 'https://discord.gg/nerochainofficial',
  PrivacyPolicy: 'https://nerochain.io/privacy',
  ServiceTerms: 'https://nerochain.io/terms',
  chains: [
    {
      chain: {
        name: 'NERO Testnet',
        logo: 'https://nerochain.io/logo.svg',
        networkType: 'sapphire_devnet',
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
        paymasterAPIKey: '',
      },
      aaContracts: {
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
        accountFactory: '0x9406Cc6185a346906296840746125a0E44976454',
        tokenPaymaster: '0x5a6680dFd4a77FEea0A7be291147768EaA2414ad',
      },
      web3auth: {
        clientId: '', // Leave empty to use MetaMask only
        network: 'testnet',
        uiConfig: {
          appName: 'Demo Wallet',
          mode: 'light',
          useLogoLoader: true,
          defaultLanguage: 'en',
          theme: {
            primary: '#768729',
          },
          loginMethodsOrder: ['google'],
          uxMode: 'redirect',
          modalZIndex: '2147483647',
        },
        loginConfig: {},
      },
    },
  ],
}
```

**Solution 3: Clear Vite Cache**

```bash
rm -rf node_modules/.vite
npm run dev
```

### Getting Help

If you encounter issues not covered here:

1. **Check the documentation** - https://docs.nerochain.io
2. **GitHub Issues** - https://github.com/nerochain/nero-aa-wallet/issues
3. **Discord Community** - https://discord.gg/nerochainofficial
4. **Email Support** - support@nerochain.io

---

## Best Practices

### 1. Environment Variables

Always use environment variables for sensitive data:

```typescript
// ✅ Good
rainbowKitProjectId: process.env.REACT_APP_RAINBOWKIT_PROJECT_ID

// ❌ Bad
rainbowKitProjectId: 'your-actual-project-id-here'
```

### 2. Error Handling

Always handle errors in your components:

```typescript
function MyComponent() {
  const { aaAccountAddress } = useAccountManager()

  if (!aaAccountAddress) {
    return <div>Please create an AA account first</div>
  }

  // Your component logic
}
```

### 3. Loading States

Show loading states for better UX:

```typescript
function TokenList() {
  const { erc20Tokens, isLoading } = useClassifiedTokens()

  if (isLoading) {
    return <div>Loading tokens...</div>
  }

  return <div>{/* Render tokens */}</div>
}
```

### 4. TypeScript Types

Import and use TypeScript types:

```typescript
import type { WalletConfig, Token, NftWithImages } from '@nerochain-test/nero-wallet'

const config: WalletConfig = {
  // Your config
}
```

### 5. Conditional Rendering

Only render wallet-dependent content when connected:

```typescript
function App() {
  return (
    <SocialWallet config={walletConfig} mode="sidebar">
      <PublicContent />
      <WalletDependentContent />
    </SocialWallet>
  )
}

function WalletDependentContent() {
  const { isConnected } = useSignature()

  if (!isConnected) {
    return <div>Connect your wallet to continue</div>
  }

  return <div>{/* Wallet features */}</div>
}
```

---

## Next Steps

Now that you have NERO Wallet integrated:

1. **Customize the UI** - Match your brand colors and style
2. **Add custom features** - Build on top of the wallet hooks
3. **Test thoroughly** - Test all features before going to production
4. **Deploy** - Deploy your app with confidence
5. **Monitor** - Watch for errors and user feedback

## Resources

- **Documentation:** https://docs.nerochain.io
- **GitHub:** https://github.com/nerochain/nero-aa-wallet
- **Discord:** https://discord.gg/nerochainofficial
- **NPM Package:** https://www.npmjs.com/package/@nerochain-test/nero-wallet
- **RainbowKit Docs:** https://www.rainbowkit.com/docs/introduction
- **Web3Auth Docs:** https://web3auth.io/docs

---

**Happy Building! 🚀**

For questions or support, join our Discord community or open an issue on GitHub.
