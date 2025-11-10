import React, { createContext, useCallback, useEffect, useState, useRef, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { getPaymaster } from '@/helper/getPaymaster'
import { SimpleAccount } from '@/helper/simpleAccount'
import { useEthersSigner } from '@/hooks/account/useGetSigner'
import { useConfig } from '@/hooks/operation/useConfig'
import { AccountManagerContextProps, AccountData, ProviderProps } from '@/types'
import { generateDeterministicSalt, generateStorageKeys } from '@/utils/security'
import { saveAccounts, loadAccounts, migrateFromLocalStorage } from '@/utils/localforage'

export const AccountManagerContext = createContext<AccountManagerContextProps | undefined>(
  undefined,
)

// Auth method types
type AuthMethod =
  | 'metamask'
  | 'web3auth-google'
  | 'web3auth-facebook'
  | 'web3auth-discord'
  | 'external-wallet'
  | 'unknown'

interface AuthInfo {
  method: AuthMethod
  userId?: string // For social logins
  walletName?: string
}

export const AccountManagerProvider: React.FC<ProviderProps> = ({ children }) => {
  const { rpcUrl, bundlerUrl, entryPoint, accountFactory, chainId } = useConfig()
  const [accounts, setAccounts] = useState<AccountData[]>([])
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [showHiddenAccounts, setShowHiddenAccounts] = useState(false)
  const [migrationCompleted, setMigrationCompleted] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [autoCreationAttempted, setAutoCreationAttempted] = useState(false)

  const signer = useEthersSigner()
  const { isConnected: isWalletConnected, connector } = useAccount()

  // Keep track of authentication state
  const currentSignerAddress = useRef<string | null>(null)
  const currentAuthInfo = useRef<AuthInfo | null>(null)

  // Computed properties for filtered accounts
  const visibleAccounts = useMemo(() => accounts.filter((account) => !account.hidden), [accounts])

  const hiddenAccounts = useMemo(() => accounts.filter((account) => account.hidden), [accounts])

  // Detect authentication method and user info
  const detectAuthInfo = useCallback(async (): Promise<AuthInfo> => {
    if (!connector) {
      return { method: 'unknown' }
    }

    // Web3Auth detection
    if (connector.id === 'web3auth') {
      try {
        // @ts-ignore - Access Web3Auth specific properties
        const web3auth = (connector as any).web3auth
        if (web3auth && web3auth.connectedAdapterName) {
          const adapterName = web3auth.connectedAdapterName.toLowerCase()

          // Get user info for social logins
          const userInfo = await web3auth.getUserInfo?.()
          const userId = userInfo?.verifierId || userInfo?.email || userInfo?.sub

          switch (adapterName) {
            case 'google':
              return {
                method: 'web3auth-google',
                userId,
                walletName: `Google (${userInfo?.email || 'Unknown'})`,
              }
            case 'facebook':
              return {
                method: 'web3auth-facebook',
                userId,
                walletName: `Facebook (${userInfo?.name || 'Unknown'})`,
              }
            case 'discord':
              return {
                method: 'web3auth-discord',
                userId,
                walletName: `Discord (${userInfo?.name || 'Unknown'})`,
              }
            default:
              return {
                method: 'web3auth-google',
                userId,
                walletName: `Web3Auth (${adapterName})`,
              }
          }
        }
      } catch (error) {
        console.warn('Could not detect Web3Auth adapter:', error)
      }
    }

    // MetaMask detection
    if (connector.id === 'metaMask' || connector.name?.toLowerCase().includes('metamask')) {
      return {
        method: 'metamask',
        walletName: 'MetaMask',
      }
    }

    // Other external wallets
    return {
      method: 'external-wallet',
      walletName: connector.name || 'External Wallet',
    }
  }, [connector])

  // Generate auth-specific storage keys
  const getStorageKeys = useCallback(async () => {
    if (!signer) return null

    try {
      const signerAddress = await signer.getAddress()
      const authInfo = await detectAuthInfo()

      // Use extracted utility function
      const keys = generateStorageKeys(signerAddress, authInfo.method, authInfo.userId)

      return {
        ...keys,
        authInfo,
      }
    } catch (error) {
      console.error('Error generating storage keys:', error)
      return null
    }
  }, [signer, detectAuthInfo])

  // Check if authentication context has changed
  const hasAuthChanged = useCallback((newAuthInfo: AuthInfo) => {
    const current = currentAuthInfo.current
    if (!current) return true

    return current.method !== newAuthInfo.method || current.userId !== newAuthInfo.userId
  }, [])

  // Run migration once on startup
  useEffect(() => {
    if (!migrationCompleted) {
      migrateFromLocalStorage()
        .then((result) => {
          if (result.migrated && result.errors.length > 0) {
            console.warn('Migration completed with errors:', result.errors)
          }
        })
        .catch((error) => {
          console.error('Migration failed:', error)
        })
        .finally(() => {
          setMigrationCompleted(true)
        })
    }
  }, [migrationCompleted])

  // Clear state when authentication context changes
  useEffect(() => {
    const handleAuthChange = async () => {
      if (!signer) {
        // No signer = clear everything
        setAccounts([])
        setActiveAccountId(null)
        setHasInitialized(false)
        setAutoCreationAttempted(false)
        currentSignerAddress.current = null
        currentAuthInfo.current = null
        return
      }

      try {
        const signerAddress = await signer.getAddress()
        const authInfo = await detectAuthInfo()

        // Check if either signer or auth method changed
        const signerChanged = signerAddress !== currentSignerAddress.current
        const authChanged = hasAuthChanged(authInfo)

        if (signerChanged || authChanged) {
          // Clear current state
          setAccounts([])
          setActiveAccountId(null)
          setAutoCreationAttempted(false) // Reset auto-creation flag
          setHasInitialized(false)

          // Update tracking variables
          currentSignerAddress.current = signerAddress
          currentAuthInfo.current = authInfo

          // Load accounts for new authentication context
          const storageResult = await getStorageKeys()
          if (storageResult) {
            const { accountsKey, activeAccountKey } = storageResult

            try {
              // Use async localforage functions
              const [storedAccounts, storedActiveAccountId] = await Promise.all([
                loadAccounts(accountsKey),
                loadAccounts(activeAccountKey),
              ])

              if (storedAccounts && Array.isArray(storedAccounts)) {
                // Filter and validate accounts
                const validAccounts = storedAccounts.filter(
                  (acc: any) =>
                    acc &&
                    typeof acc === 'object' &&
                    acc.id &&
                    acc.name &&
                    acc.AAaddress &&
                    typeof acc.salt === 'number',
                )

                setAccounts(validAccounts)

                const activeId = Array.isArray(storedActiveAccountId)
                  ? storedActiveAccountId[0]
                  : storedActiveAccountId

                if (
                  activeId &&
                  typeof activeId === 'string' &&
                  validAccounts.find((acc: AccountData) => acc.id === activeId)
                ) {
                  setActiveAccountId(activeId)
                  // Recreate SimpleAccount instance for the active account
                  setTimeout(async () => {
                    await ensureActiveAccountInstance(activeId, validAccounts)
                  }, 0)
                } else if (validAccounts.length > 0) {
                  setActiveAccountId(validAccounts[0].id)
                  // Recreate SimpleAccount instance for the first account
                  setTimeout(async () => {
                    await ensureActiveAccountInstance(validAccounts[0].id, validAccounts)
                  }, 0)
                }
              }
            } catch (error) {
              console.error('Error loading accounts from storage:', error)
            }
          }

          setHasInitialized(true)
        }
      } catch (error) {
        console.error('Error handling authentication change:', error)
      }
    }

    handleAuthChange()
  }, [signer, detectAuthInfo, hasAuthChanged, getStorageKeys])

  // Save accounts to storage whenever they change (using auth-specific key)
  useEffect(() => {
    const saveAccountsAsync = async () => {
      if (accounts.length > 0 && currentSignerAddress.current && currentAuthInfo.current) {
        const storageResult = await getStorageKeys()
        if (storageResult) {
          try {
            await saveAccounts(storageResult.accountsKey, accounts)
          } catch (error) {
            console.error('Error saving accounts:', error)
          }
        }
      }
    }

    saveAccountsAsync()
  }, [accounts, getStorageKeys])

  // Save active account ID to storage (using auth-specific key)
  useEffect(() => {
    const saveActiveAccountAsync = async () => {
      if (activeAccountId && currentSignerAddress.current && currentAuthInfo.current) {
        const storageResult = await getStorageKeys()
        if (storageResult) {
          try {
            await saveAccounts(storageResult.activeAccountKey, [activeAccountId])
          } catch (error) {
            console.error('Error saving active account:', error)
          }
        }
      }
    }

    saveActiveAccountAsync()
  }, [activeAccountId, getStorageKeys])

  const generateAccountId = useCallback(() => {
    return `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const generateAccountName = useCallback((accountsLength: number) => {
    return `Account ${accountsLength + 1}`
  }, [])

  const generateDeterministicSaltForContext = useCallback(
    async (accountIndex: number) => {
      if (!signer) {
        throw new Error('Signer is not available')
      }

      const signerAddress = await signer.getAddress()
      return generateDeterministicSalt(signerAddress, accountIndex, chainId)
    },
    [signer, chainId],
  )

  const initializeSimpleAccount = useCallback(
    async (salt: number, pm?: 'token' | 'verifying' | 'legacy-token') => {
      if (!signer) {
        throw new Error('Signer is not available')
      }

      const paymaster = pm ? getPaymaster(pm) : undefined

      const simpleAccount = await SimpleAccount.init(signer, rpcUrl, {
        entryPoint: entryPoint,
        overrideBundlerRpc: bundlerUrl,
        factory: accountFactory,
        paymasterMiddleware: paymaster,
        salt: salt,
      })

      const address = await simpleAccount.getSender()
      return {
        simpleAccount,
        address: address as `0x${string}`,
      }
    },
    [signer, rpcUrl, bundlerUrl, entryPoint, accountFactory],
  )

  // Helper function to ensure an account has its SimpleAccount instance
  // Note: SimpleAccount instances are not stored in localforage due to serialization issues
  // They contain functions and complex objects that can't be cloned by IndexedDB
  // Instead, we recreate them as needed using the stored salt value
  const ensureActiveAccountInstance = useCallback(
    async (accountId: string, accountList?: AccountData[]) => {
      if (!signer) return

      const targetAccounts = accountList || accounts
      const account = targetAccounts.find((acc) => acc.id === accountId)
      if (!account || account.simpleAccountInstance) return

      try {
        const { simpleAccount } = await initializeSimpleAccount(account.salt)

        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === accountId ? { ...acc, simpleAccountInstance: simpleAccount } : acc,
          ),
        )
      } catch (error) {
        console.error('Error creating SimpleAccount instance:', error)
      }
    },
    [signer, accounts, initializeSimpleAccount],
  )

  const createAccount = useCallback(
    async (name?: string) => {
      if (!signer) {
        console.error('Signer is not available')
        return
      }

      if (isCreatingAccount) {
        console.warn('Account creation already in progress')
        return
      }

      setIsCreatingAccount(true)
      try {
        // Generate deterministic salt based on account index
        const accountIndex = accounts.length
        const salt = await generateDeterministicSaltForContext(accountIndex)
        const accountId = generateAccountId()

        // Use current accounts length to avoid dependency issues
        setAccounts((currentAccounts) => {
          const accountName = name || generateAccountName(currentAccounts.length)

          // Initialize account in the next tick to avoid blocking UI
          setTimeout(async () => {
            try {
              const { simpleAccount, address } = await initializeSimpleAccount(salt)

              // Check if account with this address already exists
              setAccounts((prev) => {
                const existingAccount = prev.find(
                  (acc) => acc.AAaddress.toLowerCase() === address.toLowerCase(),
                )

                if (existingAccount) {
                  console.warn('Account with this address already exists:', address)
                  return prev
                }

                const newAccount: AccountData = {
                  id: accountId,
                  name: accountName,
                  AAaddress: address,
                  salt: salt,
                  simpleAccountInstance: simpleAccount,
                  createdAt: Date.now(),
                }

                return [...prev, newAccount]
              })
              setActiveAccountId(accountId)
            } catch (error) {
              console.error('Error initializing account:', error)
            } finally {
              setIsCreatingAccount(false)
            }
          }, 0)

          return currentAccounts
        })
      } catch (error) {
        console.error('Error creating account:', error)
        setIsCreatingAccount(false)
      }
    },
    [
      signer,
      generateAccountId,
      generateAccountName,
      initializeSimpleAccount,
      isCreatingAccount,
      accounts.length,
      generateDeterministicSaltForContext,
    ],
  )

  const switchAccount = useCallback(
    (accountId: string) => {
      const account = accounts.find((acc) => acc.id === accountId)
      if (account) {
        setActiveAccountId(accountId)
        // Ensure the switched account has its SimpleAccount instance
        if (!account.simpleAccountInstance) {
          setTimeout(async () => {
            await ensureActiveAccountInstance(accountId)
          }, 0)
        }
      }
    },
    [accounts, ensureActiveAccountInstance],
  )

  const updateAccountName = useCallback((accountId: string, name: string) => {
    setAccounts((prev) => prev.map((acc) => (acc.id === accountId ? { ...acc, name } : acc)))
  }, [])

  const hideAccount = useCallback(
    (accountId: string) => {
      // Find the account to be hidden
      const targetAccount = accounts.find((acc) => acc.id === accountId)
      if (!targetAccount) {
        console.warn('Account not found')
        return
      }

      // Don't allow hiding the first account (consolidation master account)
      const firstAccount = accounts[0]
      if (firstAccount && targetAccount.id === firstAccount.id) {
        console.warn('Cannot hide the master account used for consolidation')
        return
      }

      // Hide the account
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === accountId ? { ...acc, hidden: true } : acc)),
      )

      // If this was the active account, switch to the first visible account
      if (activeAccountId === accountId) {
        const visibleAccountsAfterHiding = accounts.filter(
          (acc) => acc.id !== accountId && !acc.hidden,
        )
        if (visibleAccountsAfterHiding.length > 0) {
          setActiveAccountId(visibleAccountsAfterHiding[0].id)
        } else {
          setActiveAccountId(null)
        }
      }
    },
    [accounts, activeAccountId],
  )

  const unhideAccount = useCallback((accountId: string) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, hidden: false } : acc)),
    )
  }, [])

  const refreshActiveAccount = useCallback(
    async (pm?: 'token' | 'verifying' | 'legacy-token') => {
      if (!activeAccountId || !signer) {
        console.warn('No active account or signer available')
        return
      }

      setLoading(true)
      try {
        const account = accounts.find((acc) => acc.id === activeAccountId)
        if (!account) {
          console.error('Active account not found')
          return
        }

        // Re-initialize the SimpleAccount instance
        const { simpleAccount } = await initializeSimpleAccount(account.salt, pm)

        // Update the account with the new instance
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === activeAccountId ? { ...acc, simpleAccountInstance: simpleAccount } : acc,
          ),
        )
      } catch (error) {
        console.error('Error refreshing active account:', error)
      } finally {
        setLoading(false)
      }
    },
    [activeAccountId, accounts, signer, initializeSimpleAccount],
  )

  // 🔄 ACCOUNT RECOVERY SYSTEM
  const recoverAccountByIndex = useCallback(
    async (accountIndex: number, accountName?: string) => {
      if (!signer) {
        console.error('Signer is not available for recovery')
        return null
      }

      try {
        // Generate the same deterministic salt that would be used for this index
        const salt = await generateDeterministicSaltForContext(accountIndex)

        // Initialize the AA account with the same parameters
        const { simpleAccount, address } = await initializeSimpleAccount(salt)

        // Check if this account already exists in our local storage
        const existingAccount = accounts.find(
          (acc) => acc.AAaddress.toLowerCase() === address.toLowerCase(),
        )

        if (existingAccount) {
          return existingAccount
        }

        // Create new account entry for the recovered account
        const accountId = generateAccountId()
        const recoveredAccount: AccountData = {
          id: accountId,
          name: accountName || `Recovered Account ${accountIndex + 1}`,
          AAaddress: address,
          salt: salt,
          simpleAccountInstance: simpleAccount,
          createdAt: Date.now(),
        }

        // Add to accounts list
        setAccounts((prev) => [...prev, recoveredAccount])
        setActiveAccountId(accountId)

        console.warn(`✅ Successfully recovered account: ${recoveredAccount.name} (${address})`)
        return recoveredAccount
      } catch (error) {
        console.error(`❌ Failed to recover account at index ${accountIndex}:`, error)
        return null
      }
    },
    [
      signer,
      generateDeterministicSaltForContext,
      initializeSimpleAccount,
      accounts,
      generateAccountId,
    ],
  )

  // 🔍 ACCOUNT DISCOVERY SYSTEM
  const discoverAccounts = useCallback(
    async (maxIndex: number = 10) => {
      if (!signer) {
        console.error('Signer is not available for discovery')
        return []
      }

      const discoveredAccounts: Array<{ index: number; address: string; salt: number }> = []

      for (let i = 0; i <= maxIndex; i++) {
        try {
          const salt = await generateDeterministicSaltForContext(i)
          const { address } = await initializeSimpleAccount(salt)

          // TODO: In a real implementation, you'd check if this account has any on-chain activity
          // For now, we'll just generate the addresses to show the deterministic nature
          discoveredAccounts.push({
            index: i,
            address,
            salt,
          })
        } catch (error) {
          console.warn(`Failed to generate account at index ${i}:`, error)
        }
      }

      return discoveredAccounts
    },
    [signer, generateDeterministicSaltForContext, initializeSimpleAccount],
  )

  // 📊 RECOVERY DEBUG SYSTEM
  const getRecoveryInfo = useCallback(async () => {
    if (!signer) return null

    try {
      const signerAddress = await signer.getAddress()
      const authInfo = await detectAuthInfo()

      return {
        signerAddress,
        authMethod: authInfo.method,
        userId: authInfo.userId,
        walletName: authInfo.walletName,
        chainId,
        accountFactory,
        entryPoint,
        currentAccountCount: accounts.length,
        storageKey: (await getStorageKeys())?.accountsKey,
      }
    } catch (error) {
      console.error('Error getting recovery info:', error)
      return null
    }
  }, [signer, detectAuthInfo, chainId, accountFactory, entryPoint, accounts.length, getStorageKeys])

  // 🧪 DEMO RECOVERY FUNCTIONS (for testing/demonstration)
  const demoRecoveryScenario = useCallback(async () => {
    const recoveryInfo = await getRecoveryInfo()
    if (!recoveryInfo) {
      return
    }
    await discoverAccounts(5)
  }, [getRecoveryInfo, discoverAccounts])

  // Create first account if no accounts exist and wallet is connected
  useEffect(() => {
    // Skip auto-creation in test environment to allow explicit test control
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      return
    }

    if (
      hasInitialized &&
      isWalletConnected &&
      signer &&
      visibleAccounts.length === 0 &&
      !isCreatingAccount &&
      migrationCompleted &&
      !autoCreationAttempted
    ) {
      // Add small delay to ensure storage loading is complete
      const timer = setTimeout(() => {
        // Double-check no accounts exist after delay
        if (visibleAccounts.length === 0 && !autoCreationAttempted) {
          setAutoCreationAttempted(true)
          createAccount('Account 1')
        }
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [
    hasInitialized,
    isWalletConnected,
    signer,
    visibleAccounts.length,
    isCreatingAccount,
    createAccount,
    migrationCompleted,
    autoCreationAttempted,
  ])

  const activeAccount = accounts.find((acc) => acc.id === activeAccountId) || null

  return (
    <AccountManagerContext.Provider
      value={{
        accounts,
        visibleAccounts,
        hiddenAccounts,
        activeAccountId,
        activeAccount,
        loading,
        isCreatingAccount,
        showHiddenAccounts,
        setShowHiddenAccounts,
        createAccount,
        switchAccount,
        updateAccountName,
        hideAccount,
        unhideAccount,
        refreshActiveAccount,
        // 🔄 Recovery functions
        recoverAccountByIndex,
        discoverAccounts,
        getRecoveryInfo,
        demoRecoveryScenario,
      }}
    >
      {children}
    </AccountManagerContext.Provider>
  )
}
