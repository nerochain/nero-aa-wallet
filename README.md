# @nerochain-test/nero-wallet

> 🚀 **Drop-in Account Abstraction wallet for React apps** - Get gasless transactions and social login in 5 minutes.

[![npm version](https://badge.fury.io/js/%40nerochain%2Fnero-wallet.svg)](https://badge.fury.io/js/%40nerochain%2Fnero-wallet)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern **ERC-4337 Account Abstraction** wallet library with built-in UI, social authentication, and gasless transactions. Just wrap your app, configure once, and you're done.

## ✨ Features

- 🔐 **ERC-4337 Account Abstraction** - Smart contract wallets with advanced features
- 🎯 **Social Login** - Google, Facebook, Discord, GitHub via Web3Auth
- ⛽ **Gasless Transactions** - Sponsor transactions with Paymaster
- 💳 **Multi-Account** - Create and switch between multiple AA accounts
- 🎨 **Beautiful UI** - Pre-built wallet interface (sidebar or modal)
- ⚡ **5-Minute Setup** - One component, minimal configuration
- 🔧 **TypeScript** - Full type safety and IntelliSense

---

## 🚀 Quick Start (5 Minutes)

### 1. Install

```bash
npm install @nerochain-test/nero-wallet @rainbow-me/rainbowkit @tanstack/react-query viem wagmi
```

<details>
<summary>📦 Using Vite? Click here for required setup</summary>

Install polyfills plugin:

```bash
npm install --save-dev vite-plugin-node-polyfills
```

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
})
```

</details>

### 2. Create Configuration File

Create `src/walletConfig.ts` with this **ready-to-use** configuration:

```typescript
import type { WalletConfig } from '@nerochain-test/nero-wallet'

export const walletConfig: WalletConfig = {
  // Get your Project ID at: https://cloud.walletconnect.com/
  rainbowKitProjectId: '04309ed1007e77d1f119b85205bb779d', // Demo ID - replace with yours!

  walletName: 'My DApp Wallet',
  walletLogo: 'https://nerochain.io/logo.svg',
  iconBackground: '#fff',
  contactAs: 'https://discord.gg/your-discord',
  PrivacyPolicy: 'https://yourdapp.com/privacy',
  ServiceTerms: 'https://yourdapp.com/terms',

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
        paymasterAPIKey: '', // Optional - for sponsored transactions
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
          appName: 'My DApp',
          mode: 'light',
          useLogoLoader: true,
          defaultLanguage: 'en',
          theme: { primary: '#768729' },
          loginMethodsOrder: ['google', 'facebook'],
          uxMode: 'redirect',
          modalZIndex: '2147483647',
        },
        loginConfig: {},
      },
    },
  ],
}
```

### 3. Wrap Your App

Update your `App.tsx`:

```tsx
import { SocialWallet } from '@nerochain-test/nero-wallet'
import '@nerochain-test/nero-wallet/styles.css'
import '@rainbow-me/rainbowkit/styles.css'
import { walletConfig } from './walletConfig'

function App() {
  return (
    <SocialWallet config={walletConfig} mode='sidebar'>
      {/* Your app content here */}
      <YourAppContent />
    </SocialWallet>
  )
}

export default App
```

### 4. That's It! 🎉

Run your app:

```bash
npm run dev
```

You'll see a **wallet connect button** in the top right. Click it to connect with MetaMask or social login!

---

## 💡 What You Get Out of the Box

Once you wrap your app with `<SocialWallet>`:

- ✅ Wallet connect button (MetaMask, WalletConnect, etc.)
- ✅ Full wallet UI (send, receive, history, NFTs)
- ✅ Account Abstraction setup
- ✅ Token & NFT management
- ✅ Transaction history
- ✅ Multi-account support

**Zero additional code needed!** The wallet handles everything.

---

## 🔧 Using Wallet Features in Your App

Want to access wallet data in your components? Use the provided hooks:

### Example: Display Wallet Info

```tsx
import { useAccountManager, useSignature } from '@nerochain-test/nero-wallet'

function WalletInfo() {
  const { aaAccountAddress, accounts } = useAccountManager()
  const { isConnected } = useSignature()

  if (!isConnected) {
    return <div>Please connect your wallet</div>
  }

  return (
    <div>
      <h3>Your AA Account</h3>
      <p>Address: {aaAccountAddress}</p>
      <p>Total Accounts: {accounts.length}</p>
    </div>
  )
}

// Use inside <SocialWallet>
function App() {
  return (
    <SocialWallet config={walletConfig} mode='sidebar'>
      <WalletInfo />
    </SocialWallet>
  )
}
```

### Example: Send Transaction

```tsx
import { useAAtransfer, useSignature } from '@nerochain-test/nero-wallet'

function SendButton() {
  const { transferNative, isLoading } = useAAtransfer()
  const { isConnected } = useSignature()

  const handleSend = async () => {
    try {
      await transferNative({
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount: '0.01', // Amount in NERO
      })
      alert('Transaction sent!')
    } catch (error) {
      console.error('Failed:', error)
    }
  }

  if (!isConnected) return null

  return (
    <button onClick={handleSend} disabled={isLoading}>
      {isLoading ? 'Sending...' : 'Send 0.01 NERO'}
    </button>
  )
}
```

### Example: Display Token Balances

```tsx
import { useClassifiedTokens } from '@nerochain-test/nero-wallet'

function TokenList() {
  const { nativeToken, erc20Tokens, isLoading } = useClassifiedTokens()

  if (isLoading) return <div>Loading tokens...</div>

  return (
    <div>
      <h3>Your Tokens</h3>

      {/* Native token (NERO) */}
      {nativeToken && (
        <div>
          <strong>{nativeToken.symbol}:</strong> {nativeToken.balance}
        </div>
      )}

      {/* ERC20 tokens */}
      {erc20Tokens.map((token) => (
        <div key={token.address}>
          <strong>{token.symbol}:</strong> {token.balance}
        </div>
      ))}
    </div>
  )
}
```

---

## 🎨 Display Modes

### Sidebar Mode (Recommended)

Wallet slides in from the right side:

```tsx
<SocialWallet config={walletConfig} mode='sidebar'>
  <YourApp />
</SocialWallet>
```

### Modal Mode

Wallet opens as a centered popup:

```tsx
<SocialWallet config={walletConfig} mode='modal'>
  <YourApp />
</SocialWallet>
```

---

## 📚 Available Hooks

All hooks must be used **inside** the `<SocialWallet>` component.

### Account & Authentication

- `useAccountManager()` - Access accounts, create new ones, switch between them
- `useSignature()` - Check connection status, get signer
- `useGetSigner()` - Get ethers.js signer instance

### Tokens & NFTs

- `useClassifiedTokens()` - Get all tokens (native + ERC20) with metadata
- `useUserTokens()` - Raw token balances
- `useNftList()` - Get user's NFT collection

### Transactions

- `useAAtransfer()` - Send tokens (native or ERC20)
- `useSendUserOp()` - Execute custom user operations
- `useTransactions()` - Get transaction history
- `useEstimateUserOpFee()` - Estimate gas fees

### Configuration

- `useConfig()` - Access wallet configuration (chainId, RPC, etc.)

### Multi-Send

- `useMultiSender()` - Send tokens to multiple addresses at once

---

## ⚙️ Configuration Reference

### Required Fields

These fields are **required** and cannot be empty:

```typescript
{
  rainbowKitProjectId: string      // Get at https://cloud.walletconnect.com/
  walletName: string                // Your dApp name
  walletLogo: string                // Logo URL
  chains: [{
    chain: {
      name: string                  // Chain name
      networkType: string           // 'sapphire_devnet' | 'sapphire_mainnet'
      rpc: string                   // RPC URL
      chainId: number               // Chain ID
      nativeToken: {
        name: string                // Token name
        symbol: string              // Token symbol
        decimals: number            // Token decimals
      }
    }
  }]
}
```

### Optional Fields

These can be empty or omitted:

```typescript
{
  iconBackground: string            // Background color for wallet icon
  contactAs: string                 // Support URL
  PrivacyPolicy: string             // Privacy policy URL
  ServiceTerms: string              // Terms of service URL
  web3auth: {
    clientId: string                // Leave empty to use MetaMask only
    ...
  }
}
```

---

## 🔑 Environment Variables

Create a `.env` file in your project:

```bash
# Required for wallet functionality
VITE_RAINBOWKIT_PROJECT_ID=your_project_id

# Optional - for social login
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id

# Optional - for gasless transactions
VITE_PAYMASTER_API_KEY=your_paymaster_key
```

Then use in your config:

```typescript
rainbowKitProjectId: import.meta.env.VITE_RAINBOWKIT_PROJECT_ID
```

---

## 🎯 Framework Compatibility

| Framework         | Status | Notes                              |
| ----------------- | ------ | ---------------------------------- |
| Vite + React      | ✅     | Requires node polyfills plugin     |
| Create React App  | ✅     | May need CRACO for polyfills       |
| Next.js 13+ (App) | ✅     | Use `'use client'` directive       |
| Next.js (Pages)   | ✅     | Works out of the box               |
| Remix             | ⚠️     | Not tested, likely needs polyfills |

---

## 🐛 Common Issues & Solutions

### Error: "Cannot read properties of undefined (reading 'name')"

**Cause:** Missing required configuration fields.

**Fix:** Make sure `rainbowKitProjectId` is set and all required chain fields are filled.

```typescript
// ❌ Bad
rainbowKitProjectId: '' // Empty!

// ✅ Good
rainbowKitProjectId: '04309ed1007e77d1f119b85205bb779d'
```

### Error: "Module not found: Can't resolve 'buffer'"

**Cause:** Missing node polyfills (common in Vite).

**Fix:** Install and configure `vite-plugin-node-polyfills`:

```bash
npm install --save-dev vite-plugin-node-polyfills
```

See [Quick Start](#-quick-start-5-minutes) for full Vite setup.

### Hooks Not Working / Undefined Errors

**Cause:** Using hooks outside `<SocialWallet>`.

**Fix:** Only use hooks inside components rendered within `<SocialWallet>`:

```tsx
// ❌ Wrong
function App() {
  const { isConnected } = useSignature() // Outside SocialWallet!
  return <SocialWallet>...</SocialWallet>
}

// ✅ Correct
function MyComponent() {
  const { isConnected } = useSignature() // Inside SocialWallet
  return <div>...</div>
}

function App() {
  return (
    <SocialWallet config={walletConfig}>
      <MyComponent />
    </SocialWallet>
  )
}
```

### CSS Not Loading

**Fix:** Import both stylesheets in your main file:

```tsx
import '@nerochain-test/nero-wallet/styles.css'
import '@rainbow-me/rainbowkit/styles.css'
```

---

## 📖 Full Documentation

- 📘 **[Integration Guide](./INTEGRATION_GUIDE.md)** - Complete setup guide with examples
- 📚 **[API Reference](./API_REFERENCE.md)** - Every hook and function documented
- 📖 **[Online Docs](https://docs.nerochain.io)** - Full documentation website
- 🎓 **[Examples](./examples/)** - Sample projects
- 💬 **[Discord](https://discord.gg/nerochainofficial)** - Get help
- 🐛 **[Issues](https://github.com/nerochain/nero-aa-wallet/issues)** - Report bugs

---

## 🚦 Getting Your API Keys

### RainbowKit Project ID (Required)

1. Go to https://cloud.walletconnect.com/
2. Sign up / log in
3. Create a new project
4. Copy the Project ID
5. Use in your `walletConfig`

### Web3Auth Client ID (Optional - for social login)

1. Go to https://dashboard.web3auth.io/
2. Sign up / log in
3. Create a new project
4. Copy the Client ID
5. Add to `web3auth.clientId` in config

**Note:** You can use the wallet without Web3Auth - it will work with MetaMask and other browser wallets.

---

## 💼 TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  WalletConfig,
  Token,
  ERC20Token,
  NftWithImages,
  AccountData,
  TransactionDetail,
} from '@nerochain-test/nero-wallet'
```

---

## 🤝 Support & Community

- 💬 **[Discord](https://discord.gg/nerochainofficial)** - Join our community
- 🐛 **[GitHub Issues](https://github.com/nerochain/nero-aa-wallet/issues)** - Report bugs
- 📧 **Email:** support@nerochain.io

---

## 📄 License

MIT © NERO Chain

---

## 🌟 Star Us on GitHub!

If you find this package useful, please ⭐️ [star our repository](https://github.com/nerochain/nero-aa-wallet)!

---

**Ready to build?** Follow the [Quick Start](#-quick-start-5-minutes) and you'll have a working AA wallet in 5 minutes! 🚀
