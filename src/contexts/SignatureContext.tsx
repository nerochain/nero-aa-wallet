import React, { createContext, useCallback, useState } from 'react'
import { useAccount } from 'wagmi'
import { useAccountManager } from '@/hooks/account/useAccountManager'
import { SignatureContextProps, ProviderProps } from '@/types'

export const SignatureContext = createContext<SignatureContextProps | undefined>(undefined)

export const SignatureProvider: React.FC<ProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const { isConnected: isWalletConnected } = useAccount()
  const { activeAccount, refreshActiveAccount, isCreatingAccount } = useAccountManager()

  const AAaddress = activeAccount?.AAaddress || '0x'
  const simpleAccountInstance = activeAccount?.simpleAccountInstance
  const isConnected = AAaddress !== '0x' && isWalletConnected

  const signMessage = useCallback(
    async (pm?: 'token' | 'verifying' | 'legacy-token') => {
      if (isCreatingAccount) {
        console.warn('Account creation in progress, skipping signature request')
        return
      }

      setLoading(true)
      try {
        await refreshActiveAccount(pm)
      } catch (error) {
        console.error('Error refreshing account:', error)
      } finally {
        setLoading(false)
      }
    },
    [refreshActiveAccount, isCreatingAccount],
  )

  const resetSignature = useCallback(() => {
    setLoading(false)
    // Note: Account reset is now handled by AccountManager
  }, [])

  const getPaymasterMiddleware = useCallback(() => {
    // This will be handled by the account manager when refreshing accounts
    return undefined
  }, [])

  return (
    <SignatureContext.Provider
      value={{
        loading: loading || isCreatingAccount,
        AAaddress,
        isConnected,
        simpleAccountInstance,
        signMessage,
        resetSignature,
        getPaymasterMiddleware,
      }}
    >
      {children}
    </SignatureContext.Provider>
  )
}
