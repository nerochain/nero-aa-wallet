import React, { createContext, useState, useEffect } from 'react'
import { useBalance } from 'wagmi'
import { useSignature } from '@/hooks/account/useSignature'
import { SendContextProps, Token, ProviderProps } from '@/types'
import { isValidAddress, formatAndRoundBalance, createNeroToken } from '@/utils'

const SendContext = createContext<SendContextProps | undefined>(undefined)

export const SendProvider: React.FC<ProviderProps> = ({ children }) => {
  const [recipientAddress, setRecipientAddress] = useState('')
  const { AAaddress } = useSignature()
  const { data: neroBalance } = useBalance({ address: AAaddress })
  const [selectedToken, setSelectedToken] = useState<Token>(() =>
    createNeroToken(neroBalance, true),
  )
  const [balance, setBalance] = useState('')
  const [paymaster, setPaymaster] = useState(false)
  const [isTransferEnabled, setIsTransferEnabled] = useState(false)
  const [lastSentToken, setLastSentToken] = useState<Token | null>(null)

  const clearRecipientAddress = () => {
    setRecipientAddress('')
  }

  const clearSelectedToken = () => {
    setSelectedToken(createNeroToken(neroBalance, true))
  }

  const clearBalance = () => {
    setBalance('')
  }

  useEffect(() => {
    if (neroBalance?.value) {
      const roundedBalance = formatAndRoundBalance(neroBalance.value, 18)
      setSelectedToken((prev) => ({
        ...prev,
        balance: roundedBalance,
      }))
    }
  }, [neroBalance])

  useEffect(() => {
    setIsTransferEnabled(
      !!recipientAddress && isValidAddress(recipientAddress) && !!selectedToken && !!balance,
    )
  }, [recipientAddress, selectedToken, balance])

  useEffect(() => {
    if (lastSentToken) {
      setSelectedToken({
        ...lastSentToken,
        balance: formatAndRoundBalance(lastSentToken.balance, lastSentToken.decimals),
      })
      setBalance(formatAndRoundBalance(lastSentToken.balance, lastSentToken.decimals))
      setLastSentToken(null)
    }
  }, [lastSentToken])

  return (
    <SendContext.Provider
      value={{
        recipientAddress,
        setRecipientAddress,
        clearRecipientAddress,
        selectedToken,
        setSelectedToken,
        clearSelectedToken,
        balance,
        setBalance,
        clearBalance,
        paymaster,
        setPaymaster,
        isTransferEnabled,
        setIsTransferEnabled,
        lastSentToken,
        setLastSentToken: (token: Token | null) => {
          if (token) {
            setLastSentToken({
              ...token,
              balance: token.balance,
            })
          } else {
            setLastSentToken(null)
          }
        },
      }}
    >
      {children}
    </SendContext.Provider>
  )
}

export { SendContext }
export type { SendContextProps }
