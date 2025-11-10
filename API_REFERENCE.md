# 📚 NERO Wallet API Reference

Complete reference for all hooks and functions. Every example is copy-paste ready.

---

## 🔐 Account Management

### `useAccountManager()`

Manage multiple AA accounts, create new ones, switch between them.

```tsx
import { useAccountManager } from '@nerochain-test/nero-wallet'

function AccountManager() {
  const {
    accounts, // AccountData[] - All created accounts
    activeAccount, // AccountData | null - Currently active account
    aaAccountAddress, // string | null - Current AA account address
    scaAddress, // string | null - Smart contract account address
    eoaAddress, // string | null - EOA (wallet) address
    createAccount, // (name: string) => Promise<void>
    switchAccount, // (accountId: string) => Promise<void>
    deleteAccount, // (accountId: string) => Promise<void>
    updateAccountName, // (accountId: string, name: string) => Promise<void>
    isCreating, // boolean - Account creation in progress
  } = useAccountManager()

  return (
    <div>
      <h3>Accounts: {accounts.length}</h3>
      <button onClick={() => createAccount('New Account')}>Create Account</button>

      {accounts.map((account) => (
        <div key={account.id}>
          <span>{account.name}</span>
          <button onClick={() => switchAccount(account.id)}>Switch</button>
          <button onClick={() => deleteAccount(account.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

**Key Methods:**

- `createAccount(name)` - Create new AA account with a name
- `switchAccount(id)` - Switch to different account
- `deleteAccount(id)` - Remove an account
- `updateAccountName(id, name)` - Rename an account

---

### `useSignature()`

Access connection status, current account info, and signer instance.

```tsx
import { useSignature } from '@nerochain-test/nero-wallet'

function ConnectionStatus() {
  const {
    isConnected, // boolean - Wallet connected
    AAaddress, // string - AA account address
    EOAAddress, // string - EOA address
    simpleAccountInstance, // SimpleAccount | null - Account instance
    authInfo, // AuthInfo | null - Auth details
  } = useSignature()

  if (!isConnected) {
    return <div>Not connected</div>
  }

  return (
    <div>
      <p>Connected: ✅</p>
      <p>AA Address: {AAaddress}</p>
      <p>EOA: {EOAAddress}</p>
    </div>
  )
}
```

**Use Cases:**

- Check if wallet is connected
- Get current account addresses
- Access account instance for advanced operations

---

## 💸 Transfers & Transactions

### `useAAtransfer()`

Send native tokens or ERC20 tokens with optional paymaster support.

```tsx
import { useAAtransfer } from '@nerochain-test/nero-wallet'

function SendTokens() {
  const {
    transferNative, // Send native tokens (NERO)
    transferERC20, // Send ERC20 tokens
    estimateTransferFee, // Estimate gas fee
    isTransferring, // boolean - Transfer in progress
  } = useAAtransfer()

  // Send native token (NERO)
  const sendNative = async () => {
    await transferNative({
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      amount: '0.1', // Amount in NERO
    })
  }

  // Send ERC20 token
  const sendERC20 = async () => {
    await transferERC20({
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      amount: '100',
      tokenAddress: '0x...', // ERC20 contract address
    })
  }

  // Estimate fee before sending
  const checkFee = async () => {
    const fee = await estimateTransferFee(
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // to
      '0.1', // amount
      undefined, // tokenAddress (undefined = native)
      false, // usePaymaster
    )
    console.log('Estimated fee:', fee)
  }

  return (
    <div>
      <button onClick={sendNative} disabled={isTransferring}>
        Send 0.1 NERO
      </button>
      <button onClick={sendERC20} disabled={isTransferring}>
        Send 100 Tokens
      </button>
      <button onClick={checkFee}>Estimate Fee</button>
    </div>
  )
}
```

**Parameters:**

- `to` - Recipient address
- `amount` - Amount to send (as string)
- `tokenAddress` - (Optional) ERC20 contract address

---

### `useSendUserOp()`

Execute custom user operations with low-level control.

```tsx
import { useSendUserOp } from '@nerochain-test/nero-wallet'

function CustomOperation() {
  const {
    executeUserOp, // Execute a user operation
    isExecuting, // boolean - Operation in progress
    error, // Error | null
  } = useSendUserOp()

  const customOp = async () => {
    const result = await executeUserOp({
      target: '0x...', // Contract address
      data: '0x...', // Encoded function call
      value: 0, // Value in wei
    })
    console.log('Operation result:', result)
  }

  return (
    <button onClick={customOp} disabled={isExecuting}>
      Execute Custom Op
    </button>
  )
}
```

**Use Cases:**

- Call smart contracts
- Batch operations
- Custom AA functionality

---

## 💰 Tokens & Balances

### `useClassifiedTokens()`

Get all tokens with metadata, logos, and balances.

```tsx
import { useClassifiedTokens } from '@nerochain-test/nero-wallet'

function TokenList() {
  const {
    nativeToken, // Native token (NERO) with balance
    erc20Tokens, // ERC20Token[] - All ERC20 tokens
    nfts, // ERC721Token[] - NFTs
    isLoading, // boolean
    error, // Error | null
  } = useClassifiedTokens()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {/* Native Token */}
      {nativeToken && (
        <div>
          <img src={nativeToken.logo} alt={nativeToken.symbol} />
          <span>
            {nativeToken.symbol}: {nativeToken.balance}
          </span>
        </div>
      )}

      {/* ERC20 Tokens */}
      {erc20Tokens.map((token) => (
        <div key={token.contractAddress}>
          <img src={token.logo} alt={token.symbol} />
          <span>
            {token.symbol}: {token.balance}
          </span>
          <span>${token.usdValue}</span>
        </div>
      ))}

      {/* NFTs */}
      {nfts.map((nft) => (
        <div key={`${nft.contractAddress}-${nft.tokenId}`}>
          <img src={nft.logo} alt={nft.name} />
          <span>{nft.name}</span>
        </div>
      ))}
    </div>
  )
}
```

**Returned Data:**

- `nativeToken` - Native chain token with balance
- `erc20Tokens` - All ERC20 tokens with logos and balances
- `nfts` - All NFTs with metadata

---

### `useUserTokens()`

Get raw token balances without metadata.

```tsx
import { useUserTokens } from '@nerochain-test/nero-wallet'

function RawBalances() {
  const {
    userTokens, // Token[] - Raw token data
    refetch, // () => Promise<void> - Refresh balances
    isLoading,
  } = useUserTokens()

  return (
    <div>
      {userTokens.map((token) => (
        <div key={token.address}>
          {token.symbol}: {token.balance}
        </div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  )
}
```

---

## 🖼️ NFT Management

### `useNftList()`

Get user's NFT collection with full metadata.

```tsx
import { useNftList } from '@nerochain-test/nero-wallet'

function NFTGallery() {
  const {
    nfts, // NftWithImages[] - All NFTs with images
    isLoading,
    refetch, // Refresh NFT list
  } = useNftList()

  return (
    <div className='nft-grid'>
      {nfts.map((nft) => (
        <div key={`${nft.contractAddress}-${nft.tokenId}`}>
          <img src={nft.image || nft.cachedFileUrl} alt={nft.name} />
          <h4>{nft.name}</h4>
          <p>{nft.description}</p>
          <a href={nft.externalUrl}>View</a>
        </div>
      ))}
    </div>
  )
}
```

**NFT Data Includes:**

- `image` - Image URL
- `name` - NFT name
- `description` - Description
- `tokenId` - Token ID
- `contractAddress` - Contract address
- `attributes` - Traits/attributes
- `externalUrl` - External link

---

## 📜 Transaction History

### `useTransactions()`

Get transaction history with details.

```tsx
import { useTransactions } from '@nerochain-test/nero-wallet'

function TransactionHistory() {
  const {
    transactions, // Transaction[] - All transactions
    isLoading,
    refetch, // Refresh transaction list
  } = useTransactions()

  return (
    <div>
      <h3>Transaction History</h3>
      <button onClick={refetch}>Refresh</button>

      {transactions.map((tx) => (
        <div key={tx.hash}>
          <p>Hash: {tx.hash.substring(0, 10)}...</p>
          <p>Status: {tx.status}</p>
          <p>Type: {tx.type}</p>
          <p>Amount: {tx.value}</p>
          <p>To: {tx.to}</p>
          <p>Date: {new Date(tx.timestamp).toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}
```

**Transaction Fields:**

- `hash` - Transaction hash
- `status` - 'pending' | 'confirmed' | 'failed'
- `type` - Transaction type
- `value` - Amount transferred
- `to` / `from` - Addresses
- `timestamp` - Unix timestamp

---

### `useTransactionContext()`

Add and manage transactions manually.

```tsx
import { useTransactionContext } from '@nerochain-test/nero-wallet'

function CustomTransactionLogger() {
  const {
    addTransaction, // Add a transaction
    updateTransaction, // Update status
    transactions,
  } = useTransactionContext()

  const logTransaction = async () => {
    await addTransaction({
      hash: '0x...',
      type: 'transfer',
      status: 'pending',
      value: '0.1',
      to: '0x...',
      from: '0x...',
      timestamp: Date.now(),
    })
  }

  return <button onClick={logTransaction}>Log Transaction</button>
}
```

---

## ⚙️ Configuration & Settings

### `useConfig()`

Access wallet configuration and chain details.

```tsx
import { useConfig } from '@nerochain-test/nero-wallet'

function ChainInfo() {
  const {
    chainId, // number - Chain ID (e.g., 689)
    chainName, // string - Chain name
    rpcUrl, // string - RPC endpoint
    explorerUrl, // string - Block explorer
    bundlerUrl, // string - Bundler URL
    paymasterUrl, // string - Paymaster URL
    tokenName, // string - Native token name
    tokenSymbol, // string - Native token symbol
    tokenDecimals, // number - Token decimals
    entryPoint, // string - EntryPoint contract
    accountFactory, // string - Account factory
    walletName, // string - Your wallet name
    currentNetworkIndex, // number - Current chain index
    switchNetwork, // () => void - Switch to next chain
    switchToNetwork, // (index: number) => void - Switch to specific chain
  } = useConfig()

  return (
    <div>
      <h3>Chain: {chainName}</h3>
      <p>Chain ID: {chainId}</p>
      <p>RPC: {rpcUrl}</p>
      <p>Explorer: {explorerUrl}</p>
      <p>Token: {tokenSymbol}</p>
      <button onClick={switchNetwork}>Switch Network</button>
    </div>
  )
}
```

---

## 🎨 UI & Navigation

### `useScreenManager()`

Control the wallet UI programmatically.

```tsx
import { useScreenManager } from '@nerochain-test/nero-wallet'

function WalletControls() {
  const {
    setScreen, // (screen: string) => void - Change screen
    currentScreen, // string - Current screen name
    isOpen, // boolean - Wallet UI open
    toggle, // () => void - Toggle wallet
  } = useScreenManager()

  return (
    <div>
      <button onClick={toggle}>{isOpen ? 'Close' : 'Open'} Wallet</button>
      <button onClick={() => setScreen('home')}>Go Home</button>
      <button onClick={() => setScreen('send')}>Open Send</button>
      <button onClick={() => setScreen('receive')}>Open Receive</button>
    </div>
  )
}
```

**Available Screens:**

- `'home'` - Main wallet screen
- `'send'` - Send tokens
- `'receive'` - Receive screen
- `'tokens'` - Token list
- `'nfts'` - NFT gallery
- `'activity'` - Transaction history
- `'settings'` - Settings

---

## 💳 Paymaster (Gasless Transactions)

### `usePaymasterContext()`

Manage paymaster settings for gasless transactions.

```tsx
import { usePaymasterContext } from '@nerochain-test/nero-wallet'

function PaymasterSettings() {
  const {
    paymasterMode, // 'native' | 'token' | 'none'
    setPaymasterMode, // (mode: PaymasterMode) => void
    selectedToken, // PaymasterToken | null
    setSelectedToken, // (token: PaymasterToken) => void
    availableTokens, // PaymasterToken[] - Supported tokens
  } = usePaymasterContext()

  return (
    <div>
      <h3>Gasless Mode: {paymasterMode}</h3>

      <select onChange={(e) => setPaymasterMode(e.target.value as any)}>
        <option value='none'>No Paymaster</option>
        <option value='native'>Native Token</option>
        <option value='token'>ERC20 Token</option>
      </select>

      {paymasterMode === 'token' && (
        <select
          onChange={(e) => {
            const token = availableTokens.find((t) => t.address === e.target.value)
            if (token) setSelectedToken(token)
          }}
        >
          {availableTokens.map((token) => (
            <option key={token.address} value={token.address}>
              {token.symbol}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
```

---

## 🔄 Account Consolidation

### `useAccountConsolidation()`

Merge multiple accounts into one.

```tsx
import { useAccountConsolidation } from '@nerochain-test/nero-wallet'

function ConsolidateAccounts() {
  const {
    startConsolidation, // (targetAccountId: string) => Promise<void>
    isConsolidating, // boolean
    progress, // number (0-100)
    error, // Error | null
  } = useAccountConsolidation()

  const consolidate = async () => {
    await startConsolidation('target-account-id')
  }

  return (
    <div>
      <button onClick={consolidate} disabled={isConsolidating}>
        Consolidate Accounts
      </button>
      {isConsolidating && <progress value={progress} max={100} />}
    </div>
  )
}
```

---

## 🧩 Context Hooks

### `useTokenContext()`

Direct access to token context.

```tsx
import { useTokenContext } from '@nerochain-test/nero-wallet'

function TokenManager() {
  const {
    tokens, // Token[]
    addCustomToken, // (token: Token) => void
    removeToken, // (address: string) => void
    refreshBalances, // () => Promise<void>
  } = useTokenContext()

  const addToken = () => {
    addCustomToken({
      address: '0x...',
      symbol: 'CUSTOM',
      name: 'Custom Token',
      decimals: 18,
      logo: 'https://...',
    })
  }

  return (
    <div>
      <button onClick={addToken}>Add Custom Token</button>
      <button onClick={refreshBalances}>Refresh Balances</button>
    </div>
  )
}
```

---

### `useNFTContext()`

Direct access to NFT context.

```tsx
import { useNFTContext } from '@nerochain-test/nero-wallet'

function NFTManager() {
  const {
    nfts, // NftWithImages[]
    addCustomNFT, // (nft: NftWithImages) => void
    refreshNFTs, // () => Promise<void>
    isLoading,
  } = useNFTContext()

  return (
    <div>
      <button onClick={refreshNFTs}>Refresh NFTs</button>
      <p>Total NFTs: {nfts.length}</p>
    </div>
  )
}
```

---

## 📦 Advanced Hooks

### `useSimpleAccount()`

Access low-level SimpleAccount instance.

```tsx
import { useSimpleAccount } from '@nerochain-test/nero-wallet'

function AdvancedAccountOps() {
  const {
    simpleAccount, // SimpleAccount instance
    getNonce, // () => Promise<BigNumber>
    getInitCode, // () => Promise<string>
  } = useSimpleAccount()

  const checkNonce = async () => {
    const nonce = await getNonce()
    console.log('Account nonce:', nonce.toString())
  }

  return <button onClick={checkNonce}>Check Nonce</button>
}
```

---

## 🎯 Complete Example: Send Token Form

Here's a complete example combining multiple hooks:

```tsx
import {
  useSignature,
  useAAtransfer,
  useClassifiedTokens,
  usePaymasterContext,
} from '@nerochain-test/nero-wallet'
import { useState } from 'react'

function SendTokenForm() {
  const { isConnected, AAaddress } = useSignature()
  const { transferNative, transferERC20, estimateTransferFee, isTransferring } = useAAtransfer()
  const { erc20Tokens, nativeToken } = useClassifiedTokens()
  const { paymasterMode } = usePaymasterContext()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState<string>('native')
  const [estimatedFee, setEstimatedFee] = useState<string>('0')

  if (!isConnected) {
    return <div>Please connect your wallet first</div>
  }

  const estimateFee = async () => {
    const fee = await estimateTransferFee(
      recipient,
      amount,
      selectedToken === 'native' ? undefined : selectedToken,
      paymasterMode !== 'none',
    )
    setEstimatedFee(fee)
  }

  const handleSend = async () => {
    try {
      if (selectedToken === 'native') {
        await transferNative({ to: recipient, amount })
      } else {
        await transferERC20({
          to: recipient,
          amount,
          tokenAddress: selectedToken,
        })
      }
      alert('Transaction sent!')
      setRecipient('')
      setAmount('')
    } catch (error) {
      console.error('Failed:', error)
      alert('Transaction failed')
    }
  }

  return (
    <div>
      <h2>Send Tokens</h2>
      <p>From: {AAaddress}</p>

      <div>
        <label>Token:</label>
        <select value={selectedToken} onChange={(e) => setSelectedToken(e.target.value)}>
          <option value='native'>{nativeToken?.symbol || 'NERO'}</option>
          {erc20Tokens.map((token) => (
            <option key={token.contractAddress} value={token.contractAddress}>
              {token.symbol} (Balance: {token.balance})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Recipient:</label>
        <input
          type='text'
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder='0x...'
        />
      </div>

      <div>
        <label>Amount:</label>
        <input
          type='text'
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder='0.0'
        />
      </div>

      <div>
        <button onClick={estimateFee}>Estimate Fee</button>
        {estimatedFee !== '0' && <span>Fee: {estimatedFee}</span>}
      </div>

      <button onClick={handleSend} disabled={isTransferring || !recipient || !amount}>
        {isTransferring ? 'Sending...' : 'Send'}
      </button>

      {paymasterMode !== 'none' && <p>✅ Gasless transaction (Paymaster active)</p>}
    </div>
  )
}
```

---

## 📝 TypeScript Types

All hooks return properly typed data. Import types as needed:

```tsx
import type {
  AccountData,
  Token,
  ERC20Token,
  ERC721Token,
  NftWithImages,
  Transaction,
  PaymasterMode,
  PaymasterToken,
} from '@nerochain-test/nero-wallet'
```

---

## ⚠️ Common Patterns

### Check Connection Before Using Hooks

```tsx
function MyComponent() {
  const { isConnected } = useSignature()
  const { transferNative } = useAAtransfer()

  if (!isConnected) {
    return <div>Connect wallet first</div>
  }

  // Safe to use hooks here
  return <button onClick={() => transferNative({...})}>Send</button>
}
```

### Handle Loading States

```tsx
function MyComponent() {
  const { erc20Tokens, isLoading } = useClassifiedTokens()

  if (isLoading) {
    return <div>Loading tokens...</div>
  }

  return <div>{/* Render tokens */}</div>
}
```

### Error Handling

```tsx
function MyComponent() {
  const { transferNative } = useAAtransfer()

  const handleSend = async () => {
    try {
      await transferNative({ to: '0x...', amount: '0.1' })
      alert('Success!')
    } catch (error) {
      console.error('Transaction failed:', error)
      alert('Failed: ' + error.message)
    }
  }

  return <button onClick={handleSend}>Send</button>
}
```

---

## 🚀 Next Steps

- See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for setup instructions
- Check [README.md](./README.md) for quick start
- Join [Discord](https://discord.gg/nerochainofficial) for support

---

**Questions?** Open an issue or ask in Discord! 💬
