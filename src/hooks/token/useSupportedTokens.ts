import { useContext, useState, useCallback, useRef } from 'react'
import { ClientContext } from '@/contexts/ClientContext'
import { useEthersSigner } from '@/hooks/account/useGetSigner'
import { PaymasterToken, SponsorshipInfo } from '@/types'
import { useBuilderWithPaymaster } from '@/utils'

// Cache interface for supported tokens
interface SupportedTokensCache {
  data: {
    tokens: PaymasterToken[]
    sponsorship: SponsorshipInfo
    native?: any
  }
  timestamp: number
}

// 1 minute cache duration
const CACHE_DURATION = 60 * 1000

export const useSupportedTokens = () => {
  const client = useContext(ClientContext)
  const signer = useEthersSigner()
  const { initBuilder } = useBuilderWithPaymaster(signer)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supportedTokens, setSupportedTokens] = useState<PaymasterToken[]>([])
  const [sponsorshipInfo, setSponsorshipInfo] = useState<SponsorshipInfo>({
    balance: '0',
    freeGas: false,
  })
  const fetchPromiseRef = useRef<Promise<any> | null>(null)
  const hasDataRef = useRef(false)
  const hasErrorRef = useRef(false)
  const retryCountRef = useRef(0)
  const cacheRef = useRef<SupportedTokensCache | null>(null)
  const MAX_RETRIES = 2

  const getSupportedTokens = useCallback(async () => {
    if (!client) {
      throw new Error('Client is not available')
    }

    // Check cache first
    const now = Date.now()
    if (cacheRef.current && now - cacheRef.current.timestamp < CACHE_DURATION) {
      return cacheRef.current.data
    }

    if (hasDataRef.current && supportedTokens.length > 0 && !cacheRef.current) {
      return { tokens: supportedTokens, sponsorship: sponsorshipInfo }
    }

    if (hasErrorRef.current && retryCountRef.current >= MAX_RETRIES) {
      throw new Error(error || 'Failed to load payment options after multiple attempts')
    }

    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current
    }

    if (!hasDataRef.current) {
      setIsLoading(true)
    }
    setIsError(false)
    setError(null)

    fetchPromiseRef.current = (async () => {
      try {
        // Create isolated builder initialization promises with error boundaries
        const createIsolatedBuilder = async (
          usePaymaster: boolean,
          paymasterTokenAddress: string | undefined,
          type: number,
          purpose: string,
        ) => {
          const builder = await initBuilder(usePaymaster, paymasterTokenAddress, type)
          if (!builder) {
            throw new Error(`Failed to initialize ${purpose} builder`)
          }
          return builder
        }

        // Initialize builders in parallel with isolation
        const [builderWithFreeGas, builderWithToken] = await Promise.all([
          createIsolatedBuilder(true, undefined, 0, 'free gas'),
          createIsolatedBuilder(true, undefined, 2, 'token'),
        ])

        // Create isolated API call functions with independent error handling
        const callSupportedTokensAPI = async (builder: any) => {
          return await client.getSupportedTokens(builder)
        }

        // Execute API calls in parallel with error isolation
        const [freeGasResult, tokenResult] = await Promise.allSettled([
          callSupportedTokensAPI(builderWithFreeGas),
          callSupportedTokensAPI(builderWithToken),
        ])

        // Process results with fallbacks
        const freeGasSupported =
          freeGasResult.status === 'fulfilled' ? freeGasResult.value.freeGas || false : false

        if (tokenResult.status === 'rejected') {
          throw new Error(`Token API call failed: ${tokenResult.reason}`)
        }

        const tokenResponse = tokenResult.value
        const allTokens = tokenResponse.tokens || []

        // Filter out TST token (test token)
        const tokens = allTokens.filter((token: PaymasterToken) => token.symbol !== 'TST')

        const sponsorship = {
          balance: tokenResponse.native?.price?.toString() || '0',
          freeGas: freeGasSupported,
        }

        // Update state
        setSupportedTokens(tokens)
        setSponsorshipInfo(sponsorship)
        setIsSuccess(true)
        hasDataRef.current = true
        hasErrorRef.current = false
        retryCountRef.current = 0

        // Cache the result
        const result = {
          tokens,
          sponsorship,
          native: tokenResponse.native,
        }
        cacheRef.current = {
          data: result,
          timestamp: now,
        }

        // Cleanup: Clear any temporary builder references to prevent memory leaks
        // and potential interference with main simpleAccountInstance
        try {
          // Force garbage collection hint for temporary builders
          if (builderWithFreeGas) {
            // Clear any internal state that might interfere
            builderWithFreeGas.resetOp?.()
          }
          if (builderWithToken) {
            builderWithToken.resetOp?.()
          }
        } catch (cleanupError) {
          // Cleanup errors are non-critical
        }

        return result
      } catch (error: any) {
        console.error('Error fetching supported tokens:', error)
        setIsError(true)
        hasErrorRef.current = true
        retryCountRef.current++

        let errorMessage = 'Failed to load payment options'
        if (error?.message) {
          errorMessage = error.message
        } else if (error?.data?.Reason) {
          errorMessage = error.data.Reason
        }

        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setIsLoading(false)
        fetchPromiseRef.current = null
      }
    })()

    return fetchPromiseRef.current
  }, [client, initBuilder, supportedTokens, sponsorshipInfo, error])

  return {
    getSupportedTokens,
    supportedTokens,
    sponsorshipInfo,
    isLoading,
    isSuccess,
    isError,
    error,
  }
}
