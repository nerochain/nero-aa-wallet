import { useState, useRef, useCallback, useEffect } from 'react'
import { useSupportedTokens } from './useSupportedTokens'
import { usePaymasterContext } from '@/hooks/contexts/usePaymasterContext'
import { useConfig } from '@/hooks/operation/useConfig'
import { PaymasterToken, PAYMASTER_MODE } from '@/types/Paymaster'

export const usePaymasterUI = () => {
  const [screen, setScreen] = useState<'selection' | 'tokens'>('selection')
  const [isFlipped, setIsFlipped] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { chainId } = useConfig()

  const {
    getSupportedTokens,
    isLoading,
    error,
    supportedTokens: apiSupportedTokens,
    sponsorshipInfo,
  } = useSupportedTokens()

  const [combinedTokens, setCombinedTokens] = useState<PaymasterToken[]>([])

  const {
    selectedToken,
    setSelectedToken,
    setSupportedTokens,
    setPaymaster,
    setIsPaymentSelected,
    setSelectedMode,
    setTokenPayment,
    selectedMode,
    paymaster,
  } = usePaymasterContext()

  const isSponsoredSelected =
    selectedMode?.value === PAYMASTER_MODE.FREE_GAS && paymaster && !selectedToken

  useEffect(() => {
    const nativeToken: PaymasterToken = {
      token: '0x',
      symbol: 'NERO',
      price: '0',
      type: 'native',
    }

    const combined = [nativeToken, ...apiSupportedTokens]
    setCombinedTokens(combined)
    setSupportedTokens(combined)
  }, [apiSupportedTokens, setSupportedTokens, chainId])

  const fetchTokens = useCallback(async () => {
    if (isRetrying) {
      setIsRetrying(false)
    }

    try {
      const result = await getSupportedTokens()
      if (result && result.tokens) {
        // We don't set supportedTokens directly here anymore
        // as it's handled by the useEffect above
      }
      setLocalError(null)
    } catch (error: any) {
      console.error('Error fetching supported tokens:', error)
      let errorMessage = error?.message || 'Failed to load payment options'
      if (error?.data?.Reason) {
        errorMessage = error.data.Reason
      } else if (typeof error === 'string' && error.includes('body=')) {
        try {
          const bodyMatch = error.match(/body="(.+?)"/) || error.match(/body=(.+?),/)
          if (bodyMatch && bodyMatch[1]) {
            const parsedBody = JSON.parse(bodyMatch[1].replace(/\\"/g, '"'))
            if (parsedBody?.error?.data?.Reason) {
              errorMessage = parsedBody.error.data.Reason
            }
          }
        } catch (e) {
          // If parsing fails, use the original error message
        }
      }

      setLocalError(errorMessage)
    }
  }, [getSupportedTokens, isRetrying])

  const handleRetry = () => {
    setIsRetrying(true)
  }

  const handleTokenClick = (token: PaymasterToken) => {
    if (selectedToken === token.token) {
      setSelectedToken(null)
      setPaymaster(false)
      setSelectedMode({ value: PAYMASTER_MODE.FREE_GAS })
      setIsPaymentSelected(false)
    } else {
      if (token.type === 'native') {
        // ネイティブトークンの場合は、paymasterを使用しない
        setSelectedToken(token.token)
        setPaymaster(false)
        setSelectedMode({ value: PAYMASTER_MODE.NATIVE })
        setIsPaymentSelected(true)
      } else {
        setTokenPayment(token.token, PAYMASTER_MODE.PRE_FUND)
        setIsPaymentSelected(true)
      }
    }
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -100, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 100, behavior: 'smooth' })
    }
  }

  const handleSelectPaymentType = (type: 'sponsored' | 'token') => {
    if (type === 'sponsored' && sponsorshipInfo.freeGas) {
      setSelectedToken(null)
      setPaymaster(true)
      setSelectedMode({ value: PAYMASTER_MODE.FREE_GAS })
      setIsPaymentSelected(true)
    } else if (type === 'token' && combinedTokens.length > 0) {
      setScreen('tokens')
    }
  }

  const handleBackToSelection = () => {
    setScreen('selection')
    setSelectedToken(null)
    setPaymaster(false)
    setSelectedMode({ value: PAYMASTER_MODE.FREE_GAS })
    setIsPaymentSelected(false)
  }

  const getUserFriendlyErrorMessage = (errorMsg: string | null) => {
    if (!errorMsg) return 'Unknown error occurred'

    if (
      errorMsg.includes('NeroPaymaster: insufficient balance') ||
      errorMsg.includes('insufficient balance')
    ) {
      return 'Paymaster service has insufficient balance.'
    }

    if (errorMsg.includes('AA33 reverted')) {
      return 'Transaction was rejected by the paymaster. Please try again later.'
    }

    return errorMsg
  }

  return {
    screen,
    isFlipped,
    setIsFlipped,
    localError,
    isLoading,
    error,
    supportedTokens: combinedTokens,
    sponsorshipInfo,
    selectedToken,
    isSponsoredSelected,
    scrollContainerRef,
    fetchTokens,
    handleRetry,
    handleTokenClick,
    scrollLeft,
    scrollRight,
    handleSelectPaymentType,
    handleBackToSelection,
    getUserFriendlyErrorMessage,
  }
}
