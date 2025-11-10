import { useContext, useCallback } from 'react'
import { ethers } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { erc20Abi } from 'viem'
import { ClientContext } from '@/contexts/ClientContext'
import { SignatureContext } from '@/contexts/SignatureContext'
import { useEstimateUserOpFee } from './useEstimateUserOpFee'
import { useEthersSigner } from '@/hooks/account/useGetSigner'
import { useConfig } from './useConfig'
import { useTransaction } from '@/hooks/utils/useTransaction'
import { OperationData } from '@/types'
import { PAYMASTER_MODE } from '@/types/Paymaster'
import { useBuilderWithPaymaster } from '@/utils'

export const useAAtransfer = () => {
  const signer = useEthersSigner()
  const client = useContext(ClientContext)
  const { simpleAccountInstance } = useContext(SignatureContext)!
  const { tokenPaymaster } = useConfig()
  const { estimateUserOpFee, ensurePaymasterApproval } = useEstimateUserOpFee()
  const { initBuilder } = useBuilderWithPaymaster(signer)

  const estimateTransferFee = useCallback(
    async (
      receiverAddress: string,
      amount: string,
      tokenAddress?: string,
      usePaymaster: boolean = false,
      paymasterTokenAddress?: string,
      type: number = 0,
    ) => {
      if (!signer || !client || !simpleAccountInstance) {
        return '0'
      }

      try {
        const operations: OperationData[] = []

        if (tokenAddress && tokenAddress !== ethers.constants.AddressZero) {
          const erc20Interface = new ethers.Contract(tokenAddress, erc20Abi, signer)
          let decimals = 18
          try {
            decimals = await erc20Interface.decimals()
          } catch {
            // Use default decimals
          }

          const parsedAmount = parseUnits(amount, decimals)

          operations.push({
            contractAddress: tokenAddress,
            abi: erc20Abi,
            function: 'transfer',
            params: [receiverAddress, parsedAmount],
            value: ethers.constants.Zero,
          })
        } else {
          operations.push({
            contractAddress: receiverAddress,
            abi: [],
            function: '',
            params: [],
            value: parseUnits(amount, 18),
          })
        }

        if (usePaymaster && paymasterTokenAddress && type !== PAYMASTER_MODE.FREE_GAS) {
          await ensurePaymasterApproval(paymasterTokenAddress)
        }

        return estimateUserOpFee(operations, usePaymaster, paymasterTokenAddress, type)
      } catch (error) {
        return '0.0001'
      }
    },
    [signer, client, simpleAccountInstance, estimateUserOpFee, ensurePaymasterApproval],
  )

  const transferFn = useCallback(
    async (
      receiverAddress: string,
      amount: string,
      tokenAddress?: string,
      usePaymaster: boolean = false,
      paymasterTokenAddress?: string,
      type: number = 0,
    ) => {
      if (!signer || !client || !simpleAccountInstance || !initBuilder) {
        throw new Error('Required dependencies not available')
      }

      let decimals = 18
      if (tokenAddress && tokenAddress !== ethers.constants.AddressZero) {
        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer)
        try {
          decimals = await tokenContract.decimals()
        } catch {
          // Use default decimals
        }
      }

      const builder = await initBuilder(usePaymaster, paymasterTokenAddress, type)
      if (!builder) {
        throw new Error('Failed to initialize builder')
      }

      let userOp

      if (tokenAddress && tokenAddress !== ethers.constants.AddressZero) {
        const erc20Interface = new ethers.Contract(tokenAddress, erc20Abi, signer)

        if (
          usePaymaster &&
          paymasterTokenAddress &&
          paymasterTokenAddress !== ethers.constants.AddressZero
        ) {
          const paymasterTokenInterface = new ethers.Contract(
            paymasterTokenAddress,
            erc20Abi,
            signer,
          )
          const currentAllowance = await paymasterTokenInterface.allowance(
            await signer.getAddress(),
            tokenPaymaster,
          )

          if (currentAllowance.isZero()) {
            const approvePaymasterCall = {
              to: paymasterTokenAddress,
              value: ethers.constants.Zero,
              data: paymasterTokenInterface.interface.encodeFunctionData('approve', [
                tokenPaymaster,
                ethers.constants.MaxUint256,
              ]),
            }
            const approveOp = await builder.execute(
              approvePaymasterCall.to,
              approvePaymasterCall.value,
              approvePaymasterCall.data,
            )
            const approveRes = await client.sendUserOperation(approveOp)
            await approveRes.wait()
          }
        }

        const parsedAmount = parseUnits(amount, decimals)

        const transferCall = {
          to: tokenAddress,
          value: ethers.constants.Zero,
          data: erc20Interface.interface.encodeFunctionData('transfer', [
            receiverAddress,
            parsedAmount,
          ]),
        }

        userOp = await builder.execute(transferCall.to, transferCall.value, transferCall.data)

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
      }

      if (
        usePaymaster &&
        paymasterTokenAddress &&
        paymasterTokenAddress !== ethers.constants.AddressZero
      ) {
        const paymasterTokenInterface = new ethers.Contract(paymasterTokenAddress, erc20Abi, signer)
        const currentAllowance = await paymasterTokenInterface.allowance(
          await signer.getAddress(),
          tokenPaymaster,
        )

        if (currentAllowance.isZero()) {
          const approvePaymasterCall = {
            to: paymasterTokenAddress,
            value: ethers.constants.Zero,
            data: paymasterTokenInterface.interface.encodeFunctionData('approve', [
              tokenPaymaster,
              ethers.constants.MaxUint256,
            ]),
          }
          const approveOp = await builder.execute(
            approvePaymasterCall.to,
            approvePaymasterCall.value,
            approvePaymasterCall.data,
          )
          const approveRes = await client.sendUserOperation(approveOp)
          await approveRes.wait()
        }
      }

      const parsedAmount = parseUnits(amount, decimals)

      userOp = await builder.execute(receiverAddress, parsedAmount, '0x')

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
    [signer, client, simpleAccountInstance, initBuilder, tokenPaymaster],
  )

  const {
    isLoading,
    isError,
    error,
    isSuccess,
    execute: transfer,
    reset,
  } = useTransaction(transferFn)

  return {
    transfer,
    estimateTransferFee,
    isLoading,
    isSuccess,
    isError,
    error,
    reset,
  }
}
