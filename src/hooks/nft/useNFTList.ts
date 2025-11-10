import { useEffect, useState, useCallback, useMemo } from 'react'
import { ethers } from 'ethers'
import getNftImgNameFromUri from '@/helper/getNftImgNameFromUri'
import { useConfig } from '@/hooks/operation/useConfig'
import { useCustomERC721Tokens } from '@/hooks/token/useCustomTokens'
import { CloudflareNftMetadata, NftWithImages } from '@/types'

const fetchSingleNft = async (uri: string): Promise<CloudflareNftMetadata | null> => {
  if (!uri) return null
  try {
    const { name, imageUrl } = await getNftImgNameFromUri(uri)
    return { name, image: imageUrl }
  } catch (error) {
    return null
  }
}

export function useNftList() {
  const { erc721Tokens } = useCustomERC721Tokens()
  const [nftWithImages, setNftWithImages] = useState<NftWithImages[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { rpcUrl } = useConfig()

  const provider = useMemo(() => {
    if (typeof rpcUrl !== 'string') return null
    return new ethers.providers.JsonRpcProvider(rpcUrl)
  }, [rpcUrl])

  const fetchTokenUris = useCallback(async () => {
    if (erc721Tokens.length === 0 || !provider) {
      setError('No imported NFTs or unable to connect to provider.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const results = await Promise.all(
        erc721Tokens.map(async (nft: NftWithImages) => {
          const contract = new ethers.Contract(
            nft.contractAddress,
            ['function tokenURI(uint256) view returns (string)'],
            provider,
          )

          const nftDataResults = await Promise.all(
            nft.tokenData.map(async (tokenData) => {
              try {
                const tokenURI = await contract.tokenURI(tokenData.tokenId)
                const cloudflareNftData = await fetchSingleNft(tokenURI)
                return cloudflareNftData
                  ? {
                      ...tokenData,
                      ...cloudflareNftData,
                    }
                  : tokenData
              } catch (error) {
                return tokenData
              }
            }),
          )

          return {
            ...nft,
            tokenData: nftDataResults,
          }
        }),
      )

      setNftWithImages(results)
    } catch (err) {
      setError('Failed to fetch NFT data. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }, [erc721Tokens, provider])

  useEffect(() => {
    fetchTokenUris()
  }, [fetchTokenUris])

  const refetch = useCallback(() => {
    fetchTokenUris()
  }, [fetchTokenUris])

  return {
    nftWithImages,
    isLoading,
    error,
    refetch,
  }
}
