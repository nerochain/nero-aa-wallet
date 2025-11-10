import { useState, useContext, useCallback } from 'react'
import { ethers } from 'ethers'
import { erc721Abi } from 'viem'
import { ClientContext } from '@/contexts/ClientContext'
import { SignatureContext } from '@/contexts/SignatureContext'
import { useEstimateUserOpFee } from '@/hooks/operation/useEstimateUserOpFee'
import { useEthersSigner } from '@/hooks/account/useGetSigner'
import { OperationData } from '@/types/hooks'
import { useBuilderWithPaymaster } from '@/utils'

const useErc721Transfer = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const signer = useEthersSigner()
  const client = useContext(ClientContext)
  const { simpleAccountInstance, AAaddress } = useContext(SignatureContext)!
  const { estimateUserOpFee } = useEstimateUserOpFee()
  const { initBuilder } = useBuilderWithPaymaster(signer)

  const estimateNftTransferFee = useCallback(
    async (
      contractAddress: string,
      receiverAddress: string,
      tokenId: string,
      usePaymaster: boolean = false,
      paymasterTokenAddress?: string,
      type: number = 0,
    ) => {
      if (!signer || !client || !simpleAccountInstance || !AAaddress) {
        return '0'
      }

      try {
        const operations: OperationData[] = [
          {
            contractAddress: contractAddress,
            abi: erc721Abi,
            function: 'safeTransferFrom(address,address,uint256)',
            params: [AAaddress, receiverAddress, tokenId],
            value: ethers.constants.Zero,
          },
        ]

        return estimateUserOpFee(operations, usePaymaster, paymasterTokenAddress, type)
      } catch (error) {
        console.error('Error estimating NFT transfer fee:', error)
        return '0.0001'
      }
    },
    [signer, client, simpleAccountInstance, AAaddress, estimateUserOpFee],
  )

  const nftTransfer = useCallback(
    async (
      contractAddress: string,
      receiverAddress: string,
      tokenId: string,
      usePaymaster: boolean = false,
      paymasterTokenAddress?: string,
      type: number = 0,
    ) => {
      if (!signer || !client || !simpleAccountInstance || !AAaddress || !initBuilder) {
        return null
      }

      setIsLoading(true)
      setIsSuccess(false)

      try {
        const builder = await initBuilder(usePaymaster, paymasterTokenAddress, type)

        if (!builder) {
          setIsLoading(false)
          return null
        }

        const erc721Interface = new ethers.Contract(contractAddress, erc721Abi, signer)

        const transferCall = {
          to: contractAddress,
          value: ethers.constants.Zero,
          data: erc721Interface.interface.encodeFunctionData(
            'safeTransferFrom(address,address,uint256)',
            [AAaddress, receiverAddress, tokenId],
          ),
        }

        const userOp = await builder.execute(transferCall.to, transferCall.value, transferCall.data)

        const res = await client.sendUserOperation(userOp)
        await res.wait()

        setIsSuccess(true)
        return res
      } catch (e) {
        if (e instanceof Error) {
          return
        }
        throw e
      } finally {
        setIsLoading(false)
      }
    },
    [signer, client, simpleAccountInstance, AAaddress, initBuilder],
  )

  return {
    nftTransfer,
    estimateNftTransferFee,
    isLoading,
    isSuccess,
  }
}

export default useErc721Transfer
