import React, { createContext, useCallback, useState, useMemo, useContext, useEffect } from 'react'
import { ethers } from 'ethers'
import { erc20Abi } from 'viem'
import { usePublicClient } from 'wagmi'
import { ConsolidationPreviewModal } from '@/components/features/AccountSelector/ConsolidationPreviewModal'
import { ConsolidationProgressModal } from '@/components/features/AccountSelector/ConsolidationProgressModal'
import { ClientContext } from '@/contexts'
import { SimpleAccount } from '@/helper/simpleAccount'
import { useAccountManager } from '@/hooks/account/useAccountManager'
import { useConfig } from '@/hooks/operation/useConfig'
import { useClassifiedTokens } from '@/hooks/token/useClassifiedTokens'
import { useEthersSigner } from '@/hooks/account/useGetSigner'
import {
  AccountConsolidationContextProps,
  AccountTokenBalances,
  ConsolidationPlan,
  ConsolidationProgress,
  TokenBalance,
  ProviderProps,
  AccountData,
} from '@/types'

export const AccountConsolidationContext = createContext<
  AccountConsolidationContextProps | undefined
>(undefined)

const MIN_GAS_RESERVE = ethers.utils.parseEther('0.001') // Reserve 0.001 ETH for gas per account

export const AccountConsolidationProvider: React.FC<ProviderProps> = ({ children }) => {
  const { accounts } = useAccountManager()
  const { rpcUrl, bundlerUrl, entryPoint, accountFactory } = useConfig()
  const { tokensWithLogos } = useClassifiedTokens()
  const publicClient = usePublicClient()
  const client = useContext(ClientContext)
  const signer = useEthersSigner()

  const [isScanning, setIsScanning] = useState(false)
  const [isConsolidating, setIsConsolidating] = useState(false)
  const [consolidationPlan, setConsolidationPlan] = useState<ConsolidationPlan | null>(null)
  const [consolidationProgress, setConsolidationProgress] = useState<ConsolidationProgress[]>([])

  // Add modal state to context to prevent unmounting issues
  const [showConsolidationModal, setShowConsolidationModal] = useState<
    'none' | 'preview' | 'progress'
  >('none')

  const canConsolidate = useMemo(() => {
    return accounts.length > 1 && !isScanning && !isConsolidating
  }, [accounts.length, isScanning, isConsolidating])

  // Protected modal state management
  const openPreviewModal = useCallback(() => {
    setShowConsolidationModal('preview')
  }, [])

  const openProgressModal = useCallback(() => {
    setShowConsolidationModal('progress')
  }, [])

  const closeConsolidationModals = useCallback(() => {
    // Don't allow closing progress modal during active consolidation
    if (showConsolidationModal === 'progress' && isConsolidating) {
      return false
    }

    setShowConsolidationModal('none')
    return true
  }, [isConsolidating, showConsolidationModal])

  // Auto-open progress modal when consolidation starts
  useEffect(() => {
    if (isConsolidating && showConsolidationModal !== 'progress') {
      setShowConsolidationModal('progress')
    }
  }, [isConsolidating, showConsolidationModal])

  // Initialize simpleAccountInstance for accounts WITHOUT paymaster
  const initializeAccountInstance = useCallback(
    async (account: AccountData): Promise<AccountData> => {
      if (!signer) {
        return account
      }

      try {
        // Initialize without any paymaster middleware for direct gas payment
        const simpleAccount = await SimpleAccount.init(signer, rpcUrl, {
          entryPoint: entryPoint,
          overrideBundlerRpc: bundlerUrl,
          factory: accountFactory,
          salt: account.salt,
          // No paymasterMiddleware = direct gas payment from account's ETH
        })

        return {
          ...account,
          simpleAccountInstance: simpleAccount,
        }
      } catch (error) {
        console.error(`Error initializing simpleAccountInstance for ${account.name}:`, error)
        return account
      }
    },
    [signer, rpcUrl, bundlerUrl, entryPoint, accountFactory],
  )

  const fetchTokenBalance = useCallback(
    async (tokenAddress: string, accountAddress: string) => {
      if (!publicClient) return '0'

      try {
        const result = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [accountAddress as `0x${string}`],
        })
        return result.toString()
      } catch (error) {
        console.error(`Error fetching token balance for ${tokenAddress}:`, error)
        return '0'
      }
    },
    [publicClient],
  )

  const fetchNativeBalance = useCallback(
    async (accountAddress: string) => {
      if (!publicClient) return '0'

      try {
        const balance = await publicClient.getBalance({
          address: accountAddress as `0x${string}`,
        })
        return balance.toString()
      } catch (error) {
        console.error(`Error fetching native balance for ${accountAddress}:`, error)
        return '0'
      }
    },
    [publicClient],
  )

  // AA transfer function using SimpleAccount.execute (no paymaster)
  const executeTransferFromAccount = useCallback(
    async (fromAccount: AccountData, toAddress: string, amount: string, tokenAddress?: string) => {
      if (!client || !fromAccount.simpleAccountInstance) {
        throw new Error('Required dependencies not available')
      }

      // Additional validation
      if (!toAddress || toAddress === ethers.constants.AddressZero) {
        throw new Error('Invalid destination address')
      }

      if (!amount || amount === '0') {
        throw new Error('Invalid transfer amount')
      }

      const isNativeTransfer = !tokenAddress || tokenAddress === ethers.constants.AddressZero

      try {
        let userOp

        if (isNativeTransfer) {
          // Native token transfer using AA - amount is already in Wei
          const parsedAmount = ethers.BigNumber.from(amount)

          // Additional validation for native transfers
          if (parsedAmount.lte(0)) {
            throw new Error('Transfer amount must be greater than 0')
          }

          userOp = fromAccount.simpleAccountInstance.execute(toAddress, parsedAmount, '0x')
        } else {
          // ERC20 token transfer using AA - amount is already in token's smallest unit
          const parsedAmount = ethers.BigNumber.from(amount)

          // Additional validation for ERC20 transfers
          if (parsedAmount.lte(0)) {
            throw new Error('Transfer amount must be greater than 0')
          }

          if (!tokenAddress) {
            throw new Error('Token address is required for ERC20 transfer')
          }

          const erc20Interface = new ethers.utils.Interface(erc20Abi)
          const transferData = erc20Interface.encodeFunctionData('transfer', [
            toAddress,
            parsedAmount,
          ])
          userOp = fromAccount.simpleAccountInstance.execute(tokenAddress, '0', transferData)
        }

        // Validate userOp was created
        if (!userOp) {
          throw new Error('Failed to create user operation')
        }

        // Send the user operation (will pay gas from account's own ETH)
        const res = await client.sendUserOperation(userOp)

        if (!res || !res.userOpHash) {
          throw new Error('Failed to send user operation - no transaction hash received')
        }

        await res.wait()

        // Safety check for simpleAccountInstance.checkUserOp
        let userOpResult = false
        if (
          fromAccount.simpleAccountInstance &&
          typeof fromAccount.simpleAccountInstance.checkUserOp === 'function'
        ) {
          try {
            userOpResult = await fromAccount.simpleAccountInstance.checkUserOp(res.userOpHash)
          } catch (error) {
            console.warn('Error checking UserOp result:', error)
            userOpResult = false
          }
        } else {
          console.warn(
            'simpleAccountInstance.checkUserOp is not available, assuming transaction success',
          )
          userOpResult = true
        }

        return { hash: res.userOpHash, receipt: userOpResult }
      } catch (error) {
        console.warn('Error in executeTransferFromAccount:', error)

        // Provide more user-friendly error messages
        if (error instanceof Error) {
          if (error.message.includes('insufficient funds')) {
            throw new Error('Insufficient funds for this transfer')
          }
          if (error.message.includes('nonce')) {
            throw new Error('Transaction nonce error. Please try again.')
          }
          if (error.message.includes('gas')) {
            throw new Error('Gas estimation failed. Account may have insufficient ETH for gas.')
          }
        }

        throw error
      }
    },
    [client],
  )

  const scanAccountBalances = useCallback(async () => {
    if (accounts.length <= 1) return

    setIsScanning(true)
    try {
      const accountBalances: AccountTokenBalances[] = []
      const [masterAccount, ...otherAccounts] = accounts

      // Scan balances for all accounts except the first one
      for (const account of otherAccounts) {
        const tokenBalances: TokenBalance[] = []

        // Get native token balance
        const nativeBalance = await fetchNativeBalance(account.AAaddress)

        // Get ERC20 token balances for all available tokens
        for (const token of tokensWithLogos) {
          try {
            const balance = await fetchTokenBalance(token.contractAddress, account.AAaddress)

            if (balance !== '0' && ethers.BigNumber.from(balance).gt(0)) {
              tokenBalances.push({
                token: {
                  balance: balance,
                  contractAddress: token.contractAddress,
                  decimals: token.decimals,
                  name: token.name,
                  symbol: token.symbol,
                  type: 'ERC-20',
                  isNative: false,
                  logo: token.logo || '',
                },
                balance,
                formattedBalance: ethers.utils.formatUnits(balance, parseInt(token.decimals)),
              })
            }
          } catch (error) {
            console.warn(`Error fetching ${token.symbol} balance for ${account.name}:`, error)
          }
        }

        accountBalances.push({
          accountId: account.id,
          accountName: account.name,
          AAaddress: account.AAaddress,
          nativeBalance,
          tokenBalances,
        })
      }

      // Create consolidation plan
      const totalTransfers = accountBalances.reduce((total, account) => {
        const hasNativeBalance = ethers.BigNumber.from(account.nativeBalance).gt(MIN_GAS_RESERVE)
        return total + (hasNativeBalance ? 1 : 0) + account.tokenBalances.length
      }, 0)

      const warnings: string[] = []
      if (totalTransfers === 0) {
        warnings.push('No significant balances found to consolidate')
      }

      // Add warning about gas reserves
      if (
        accountBalances.some(
          (acc) =>
            ethers.BigNumber.from(acc.nativeBalance).gt(0) &&
            ethers.BigNumber.from(acc.nativeBalance).lte(MIN_GAS_RESERVE),
        )
      ) {
        warnings.push('Some accounts have native tokens but insufficient gas for transfers')
      }

      const plan: ConsolidationPlan = {
        fromAccounts: accountBalances.filter(
          (account) =>
            ethers.BigNumber.from(account.nativeBalance).gt(MIN_GAS_RESERVE) ||
            account.tokenBalances.length > 0,
        ),
        toAccount: masterAccount,
        totalTransfers,
        estimatedGasNeeded: ethers.utils.formatEther(MIN_GAS_RESERVE.mul(totalTransfers)),
        canExecute: totalTransfers > 0,
        warnings,
      }

      setConsolidationPlan(plan)
    } catch (error) {
      console.error('Error scanning account balances:', error)
    } finally {
      setIsScanning(false)
    }
  }, [accounts, tokensWithLogos, fetchNativeBalance, fetchTokenBalance])

  const executeConsolidation = useCallback(async () => {
    if (!consolidationPlan) {
      throw new Error('No consolidation plan available. Please scan balances first.')
    }

    if (!consolidationPlan.canExecute) {
      throw new Error(`Cannot execute consolidation: ${consolidationPlan.warnings.join(', ')}`)
    }

    if (isConsolidating) {
      return
    }

    setIsConsolidating(true)

    try {
      // Validate required dependencies first
      if (!signer) {
        throw new Error('Wallet signer not available. Please reconnect your wallet.')
      }

      if (!client) {
        throw new Error('Blockchain client not available. Please check your connection.')
      }

      if (accounts.length === 0) {
        throw new Error('No accounts available for consolidation.')
      }

      // Initialize SimpleAccount instances without paymaster for all accounts
      const initializedAccounts = await Promise.all(
        accounts.map(async (account) => {
          try {
            const result = await initializeAccountInstance(account)
            return result
          } catch (error) {
            console.warn(`Failed to initialize account ${account.name}:`, error)
            return account // Return original account if initialization fails
          }
        }),
      )

      const progressMap = new Map<string, ConsolidationProgress>()

      // Initialize progress tracking for all accounts
      for (const account of consolidationPlan.fromAccounts) {
        const transfers = []

        // Add native token transfer if balance is significant
        if (ethers.BigNumber.from(account.nativeBalance).gt(MIN_GAS_RESERVE)) {
          transfers.push({
            tokenSymbol: 'ETH',
            status: 'pending' as const,
          })
        }

        // Add ERC20 token transfers
        for (const tokenBalance of account.tokenBalances) {
          transfers.push({
            tokenSymbol: tokenBalance.token.symbol,
            status: 'pending' as const,
          })
        }

        progressMap.set(account.accountId, {
          accountId: account.accountId,
          accountName: account.accountName,
          transfers,
        })
      }

      setConsolidationProgress(Array.from(progressMap.values()))

      // Execute transfers for all accounts automatically
      for (const accountBalance of consolidationPlan.fromAccounts) {
        const progress = progressMap.get(accountBalance.accountId)!
        const fromAccount = initializedAccounts.find((acc) => acc.id === accountBalance.accountId)!

        // Skip if account doesn't have simpleAccountInstance
        if (!fromAccount.simpleAccountInstance) {
          // Mark all transfers as failed
          for (let i = 0; i < progress.transfers.length; i++) {
            progress.transfers[i] = {
              ...progress.transfers[i],
              status: 'failed',
              error: 'Account instance not available',
            }
          }
          setConsolidationProgress(Array.from(progressMap.values()))
          continue
        }

        // Transfer ERC20 tokens first
        for (let i = 0; i < accountBalance.tokenBalances.length; i++) {
          const tokenBalance = accountBalance.tokenBalances[i]
          const transferIndex =
            i + (ethers.BigNumber.from(accountBalance.nativeBalance).gt(MIN_GAS_RESERVE) ? 1 : 0)

          // Update progress to processing
          progress.transfers[transferIndex] = {
            ...progress.transfers[transferIndex],
            status: 'processing',
          }
          setConsolidationProgress(Array.from(progressMap.values()))

          try {
            // Additional validation before transfer
            if (!tokenBalance.token.contractAddress) {
              throw new Error('Token contract address is missing')
            }

            if (!ethers.BigNumber.from(tokenBalance.balance).gt(0)) {
              throw new Error('Token balance is zero or invalid')
            }

            // Execute ERC20 transfer using AA without paymaster
            const result = await executeTransferFromAccount(
              fromAccount,
              consolidationPlan.toAccount.AAaddress,
              tokenBalance.balance,
              tokenBalance.token.contractAddress,
            )

            // Update progress to completed
            progress.transfers[transferIndex] = {
              ...progress.transfers[transferIndex],
              status: 'completed',
              txHash: result?.hash,
            }
          } catch (error) {
            console.warn(`ERC20 transfer failed for ${tokenBalance.token.symbol}:`, error)
            // Update progress to failed
            progress.transfers[transferIndex] = {
              ...progress.transfers[transferIndex],
              status: 'failed',
              error: error instanceof Error ? error.message : 'Transfer failed',
            }
          }
          setConsolidationProgress(Array.from(progressMap.values()))
        }

        // Transfer native tokens last (after reserving gas)
        if (ethers.BigNumber.from(accountBalance.nativeBalance).gt(MIN_GAS_RESERVE)) {
          // Update progress to processing
          progress.transfers[0] = {
            ...progress.transfers[0],
            status: 'processing',
          }
          setConsolidationProgress(Array.from(progressMap.values()))

          try {
            const transferAmount = ethers.BigNumber.from(accountBalance.nativeBalance).sub(
              MIN_GAS_RESERVE,
            )

            // Ensure we have a positive transfer amount
            if (transferAmount.lte(0)) {
              throw new Error('Insufficient balance after gas reserve')
            }

            // Additional validation
            if (!consolidationPlan.toAccount.AAaddress) {
              throw new Error('Destination account address is missing')
            }

            const result = await executeTransferFromAccount(
              fromAccount,
              consolidationPlan.toAccount.AAaddress,
              transferAmount.toString(),
              ethers.constants.AddressZero, // Native token
            )

            // Update progress to completed
            progress.transfers[0] = {
              ...progress.transfers[0],
              status: 'completed',
              txHash: result?.hash,
            }
          } catch (error) {
            console.warn('Native transfer failed:', error)
            // Update progress to failed
            progress.transfers[0] = {
              ...progress.transfers[0],
              status: 'failed',
              error: error instanceof Error ? error.message : 'Transfer failed',
            }
          }
          setConsolidationProgress(Array.from(progressMap.values()))
        }
      }
    } catch (error) {
      console.warn('Error executing consolidation:', error)
      // Re-throw the error so it can be caught by the UI
      throw error
    } finally {
      setIsConsolidating(false)
    }
  }, [
    consolidationPlan,
    accounts,
    executeTransferFromAccount,
    initializeAccountInstance,
    signer,
    client,
    isConsolidating,
  ])

  const clearConsolidation = useCallback(() => {
    setConsolidationPlan(null)
    setConsolidationProgress([])
    setShowConsolidationModal('none')
  }, [])

  return (
    <AccountConsolidationContext.Provider
      value={{
        isScanning,
        isConsolidating,
        consolidationPlan,
        consolidationProgress,
        scanAccountBalances,
        executeConsolidation,
        clearConsolidation,
        canConsolidate,
        // Modal state management
        showConsolidationModal,
        openPreviewModal,
        openProgressModal,
        closeConsolidationModals,
      }}
    >
      {children}
      {showConsolidationModal === 'preview' && consolidationPlan && (
        <ConsolidationPreviewModal
          plan={consolidationPlan}
          onConfirm={openProgressModal}
          onCancel={closeConsolidationModals}
        />
      )}

      {showConsolidationModal === 'progress' && (
        <ConsolidationProgressModal onClose={closeConsolidationModals} />
      )}
    </AccountConsolidationContext.Provider>
  )
}
