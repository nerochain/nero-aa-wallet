import { useContext, useCallback } from 'react'
import { ethers } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { erc20Abi } from 'viem'
import MultiSendABI from '@/abis/MultiSend/MultiSend.json'
import { ClientContext } from '@/contexts/ClientContext'
import { SignatureContext } from '@/contexts/SignatureContext'
import { useEstimateUserOpFee } from './useEstimateUserOpFee'
import { useEthersSigner } from '@/hooks/account/useGetSigner'
import { useConfig } from './useConfig'
import { useTransaction } from '@/hooks/utils/useTransaction'
import { useSignature } from '@/hooks/account/useSignature'
import { OperationData, SendData } from '@/types/hooks'
import { PAYMASTER_MODE } from '@/types/Paymaster'
import { useBuilderWithPaymaster } from '@/utils'

const MULTI_SEND_ADDRESS = '0x2E7F7ED64c4d7537ab773DDB0942fa0D72D9C624'
const NATIVE_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

export const useMultiSender = () => {
  const signer = useEthersSigner()
  const client = useContext(ClientContext)
  const { simpleAccountInstance } = useContext(SignatureContext)!
  const { AAaddress } = useSignature()
  const { tokenPaymaster } = useConfig()
  const { initBuilder } = useBuilderWithPaymaster(signer)
  const { estimateUserOpFee, ensurePaymasterApproval } = useEstimateUserOpFee()

  const prepareSendData = useCallback(async (sendDataList: SendData[]) => {
    if (sendDataList.length === 0) {
      throw new Error('No send data provided')
    }

    const sends = await Promise.all(
      sendDataList.map(async (data, index) => {
        if (!data.token) {
          throw new Error(`Token information is missing for item ${index}`)
        }

        const tokenAddress = data.token.isNative ? NATIVE_TOKEN : data.token.contractAddress
        const decimals = parseInt(data.token.decimals) || 18

        const parsedAmount = parseUnits(data.amount, decimals)
        return {
          token: tokenAddress,
          to: data.receiverAddress,
          amount: parsedAmount,
        }
      }),
    )

    const totalNativeValue = sends.reduce(
      (sum, send) => (send.token === NATIVE_TOKEN ? sum.add(send.amount) : sum),
      ethers.constants.Zero,
    )

    return { sends, totalNativeValue }
  }, [])

  const ensureTokenApprovals = useCallback(
    async (tokenAddresses: string[], builder: any) => {
      if (!signer || !AAaddress || !client) return

      for (const tokenAddress of tokenAddresses) {
        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer)
        const allowance = await tokenContract.allowance(AAaddress, MULTI_SEND_ADDRESS)

        if (allowance.lt(ethers.constants.MaxUint256.div(2))) {
          const approveData = tokenContract.interface.encodeFunctionData('approve', [
            MULTI_SEND_ADDRESS,
            ethers.constants.MaxUint256,
          ])

          const approveOp = await builder.execute(tokenAddress, ethers.constants.Zero, approveData)
          const approveRes = await client.sendUserOperation(approveOp)
          await approveRes.wait()
        }
      }
    },
    [signer, client, AAaddress],
  )

  const estimateMultiSendFee = useCallback(
    async (
      sendDataList: SendData[],
      usePaymaster: boolean = false,
      paymasterTokenAddress?: string,
      type: number = 0,
    ) => {
      if (!signer || !client || !simpleAccountInstance || !AAaddress) {
        return '0'
      }

      try {
        const { sends, totalNativeValue } = await prepareSendData(sendDataList)

        const builder = await initBuilder(usePaymaster, paymasterTokenAddress, type)
        if (!builder) {
          return '0.0001'
        }

        const erc20Sends = sends.filter((send) => send.token !== NATIVE_TOKEN)
        const uniqueTokens = [...new Set(erc20Sends.map((send) => send.token))].filter(
          (address): address is string => !!address,
        )

        if (uniqueTokens.length > 0) {
          try {
            await ensureTokenApprovals(uniqueTokens, builder)
          } catch (error) {
            // 承認エラーでも続行して見積もりを試みる
          }
        }

        if (usePaymaster && paymasterTokenAddress && type !== PAYMASTER_MODE.FREE_GAS) {
          await ensurePaymasterApproval(paymasterTokenAddress)
        }

        const operations: OperationData[] = [
          {
            contractAddress: MULTI_SEND_ADDRESS,
            abi: MultiSendABI.abi,
            function: 'multiSend',
            params: [sends],
            value: totalNativeValue,
          },
        ]

        try {
          const fee = await estimateUserOpFee(operations, usePaymaster, paymasterTokenAddress, type)
          return fee
        } catch (estimateError: unknown) {
          return '0.0001'
        }
      } catch (error) {
        return '0.0001'
      }
    },
    [
      signer,
      client,
      simpleAccountInstance,
      AAaddress,
      estimateUserOpFee,
      ensurePaymasterApproval,
      prepareSendData,
      initBuilder,
      ensureTokenApprovals,
    ],
  )

  const multiTransferFn = useCallback(
    async (
      sendDataList: SendData[],
      usePaymaster: boolean = false,
      paymasterTokenAddress?: string,
      type: number = 0,
    ) => {
      if (!signer || !client || !simpleAccountInstance || !initBuilder || !AAaddress) {
        throw new Error('Required dependencies not available')
      }

      const builder = await initBuilder(usePaymaster, paymasterTokenAddress, type)
      if (!builder) {
        throw new Error('Failed to initialize builder')
      }

      const { sends, totalNativeValue } = await prepareSendData(sendDataList)
      const multiSendContract = new ethers.Contract(MULTI_SEND_ADDRESS, MultiSendABI.abi, signer)

      const erc20Sends = sends.filter((send) => send.token !== NATIVE_TOKEN)
      const uniqueTokens = [...new Set(erc20Sends.map((send) => send.token))].filter(
        (address): address is string => !!address,
      )

      if (uniqueTokens.length > 0) {
        await ensureTokenApprovals(uniqueTokens, builder)
      }
      if (
        usePaymaster &&
        paymasterTokenAddress &&
        paymasterTokenAddress !== ethers.constants.AddressZero &&
        type !== PAYMASTER_MODE.FREE_GAS &&
        tokenPaymaster
      ) {
        await ensurePaymasterApproval(paymasterTokenAddress)
      }

      const multiSendCallData = multiSendContract.interface.encodeFunctionData('multiSend', [sends])

      const userOp = await builder.execute(MULTI_SEND_ADDRESS, totalNativeValue, multiSendCallData)

      const res = await client.sendUserOperation(userOp)
      await res.wait()

      // Safety check for simpleAccountInstance.checkUserOp
      let userOpResult = false
      if (simpleAccountInstance && typeof simpleAccountInstance.checkUserOp === 'function') {
        try {
          userOpResult = await simpleAccountInstance.checkUserOp(res.userOpHash)
        } catch (error) {
          console.error('Error checking UserOp result:', error)
          userOpResult = false
        }
      } else {
        console.warn(
          'simpleAccountInstance.checkUserOp is not available, assuming transaction success',
        )
        userOpResult = true
      }

      return { hash: res.userOpHash, receipt: userOpResult }
    },
    [
      signer,
      client,
      simpleAccountInstance,
      AAaddress,
      initBuilder,
      tokenPaymaster,
      ensurePaymasterApproval,
      prepareSendData,
      ensureTokenApprovals,
    ],
  )

  const {
    isLoading,
    isError,
    error,
    isSuccess,
    execute: multiTransfer,
    reset,
  } = useTransaction(multiTransferFn)

  return {
    multiTransfer,
    estimateMultiSendFee,
    isLoading,
    isSuccess,
    isError,
    error,
    reset,
  }
}
