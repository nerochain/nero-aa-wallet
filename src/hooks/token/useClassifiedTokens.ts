import { useState, useEffect, useMemo } from 'react'
import { NeroToEthAddressMap } from '@/config/NeroToEthAddressMap'
import { useSignature } from '@/hooks/account/useSignature'
import { useTokenContracts } from './useTokenContracts'
import { useCustomERC20Tokens } from './useCustomTokens'
import { ERC20Token, ERC721Token } from '@/types'
import { processTokenData, processNFTData } from '@/utils'

export const useClassifiedTokens = () => {
  const [tokensWithLogos, setTokensWithLogos] = useState<ERC20Token[]>([])
  const [nfts, setNfts] = useState<ERC721Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { AAaddress } = useSignature()
  const { erc20Tokens } = useCustomERC20Tokens()

  const allTokenAddresses = useMemo(
    () =>
      Array.from(
        new Set([
          ...Object.values(NeroToEthAddressMap).map((token) => token.address.toLowerCase()),
          ...erc20Tokens.map((t) => t.contractAddress.toLowerCase()),
        ]),
      ),
    [erc20Tokens],
  )

  const { data: tokenData, isLoading: isTokenDataLoading } = useTokenContracts(
    AAaddress,
    allTokenAddresses,
  )

  useEffect(() => {
    if (!tokenData || isTokenDataLoading) return

    const processAllData = async () => {
      try {
        const processedTokens = await processTokenData(tokenData, allTokenAddresses)
        const tokensWithIcons = processedTokens.map((token) => {
          const matchingToken = Object.values(NeroToEthAddressMap).find(
            (t) => t.address.toLowerCase() === token.contractAddress.toLowerCase(),
          )
          return {
            ...token,
            logo: matchingToken?.icon || token.logo,
          }
        })
        setTokensWithLogos(tokensWithIcons)

        const processedNFTs = await processNFTData(tokenData, allTokenAddresses)
        setNfts(processedNFTs)
      } finally {
        setIsLoading(false)
      }
    }

    processAllData()
  }, [tokenData, isTokenDataLoading, allTokenAddresses])

  return {
    tokensWithLogos,
    nfts,
    isLoading: isLoading || isTokenDataLoading,
    AAaddress,
  }
}
