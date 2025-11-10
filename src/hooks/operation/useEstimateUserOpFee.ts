import { useCallback, useContext } from 'react'
import { BytesLike, ethers } from 'ethers'
import { erc20Abi } from 'viem'
import { ClientContext } from '@/contexts/ClientContext'
import { SignatureContext } from '@/contexts/SignatureContext'
import { useEthersSigner } from '@/hooks/account/useGetSigner'
import { usePaymasterContext } from '@/hooks/contexts/usePaymasterContext'
import { useSignature } from '@/hooks/account/useSignature'
import { useConfig } from './useConfig'
import { OperationData } from '@/types/hooks'
import { PAYMASTER_MODE } from '@/types/Paymaster'
import { useBuilderWithPaymaster } from '@/utils'

/**
 * トークン転送のための定数設定
 */
const TOKEN_CONFIG = {
  FALLBACK_GAS_ESTIMATE: '0.0001',
}

export const useEstimateUserOpFee = () => {
  const signer = useEthersSigner()
  const client = useContext(ClientContext)
  const { simpleAccountInstance } = useContext(SignatureContext)!
  const { AAaddress } = useSignature()
  const { supportedTokens } = usePaymasterContext()
  const { initBuilder } = useBuilderWithPaymaster(signer)
  const { tokenPaymaster } = useConfig()

  /**
   * allowanceを確認する関数
   */
  const checkAllowance = useCallback(
    async (
      tokenAddress: string,
      ownerAddress: string,
      spenderAddress: string,
    ): Promise<ethers.BigNumber> => {
      if (!signer?.provider) return ethers.constants.Zero

      try {
        const erc20Interface = new ethers.utils.Interface(erc20Abi)
        const allowanceData = erc20Interface.encodeFunctionData('allowance', [
          ownerAddress,
          spenderAddress,
        ])

        const allowanceHex = await signer.provider.call({
          to: tokenAddress,
          data: allowanceData,
        })

        return ethers.BigNumber.from(allowanceHex)
      } catch (error) {
        return ethers.constants.Zero
      }
    },
    [signer],
  )

  /**
   * UserOperationを送信して結果を待つ関数
   */
  const sendUserOpAndWait = useCallback(
    async (builder: any, tokenAddress: string, approveData: string): Promise<boolean> => {
      if (!client) return false

      try {
        const userOp = builder.execute(tokenAddress, ethers.constants.Zero, approveData)

        const res = await client.sendUserOperation(userOp, { dryRun: false })
        const receipt = await res.wait()

        return !!receipt
      } catch (error) {
        return false
      }
    },
    [client],
  )

  /**
   * AAアドレス経由でのApproveを実行する関数 - 無料ガスモードのみを使用
   */
  const ensurePaymasterApproval = useCallback(
    async (paymasterTokenAddress: string): Promise<boolean> => {
      if (!signer || !simpleAccountInstance || !tokenPaymaster || !AAaddress || !client)
        return false

      try {
        const currentAllowance = await checkAllowance(
          paymasterTokenAddress,
          AAaddress,
          tokenPaymaster,
        )

        if (currentAllowance.gte(ethers.constants.MaxUint256.div(2))) {
          return true
        }
        const erc20Interface = new ethers.utils.Interface(erc20Abi)
        const approveData = erc20Interface.encodeFunctionData('approve', [
          tokenPaymaster,
          ethers.constants.MaxUint256,
        ])

        const freeGasBuilder = await initBuilder(
          true,
          paymasterTokenAddress,
          PAYMASTER_MODE.FREE_GAS,
        )
        if (!freeGasBuilder) return false

        const success = await sendUserOpAndWait(freeGasBuilder, paymasterTokenAddress, approveData)

        if (success) {
          const newAllowance = await checkAllowance(
            paymasterTokenAddress,
            AAaddress,
            tokenPaymaster,
          )
          return newAllowance.gt(currentAllowance)
        }

        return false
      } catch (error) {
        return false
      }
    },
    [
      signer,
      simpleAccountInstance,
      tokenPaymaster,
      AAaddress,
      client,
      initBuilder,
      checkAllowance,
      sendUserOpAndWait,
    ],
  )

  const estimateUserOpFee = useCallback(
    async (
      operations: OperationData[],
      usePaymaster: boolean = false,
      paymasterTokenAddress?: string,
      type: number = 0,
    ): Promise<string> => {
      if (!signer || !client || !simpleAccountInstance || !initBuilder || operations.length === 0) {
        return '0'
      }

      try {
        if (usePaymaster && paymasterTokenAddress && type !== PAYMASTER_MODE.FREE_GAS) {
          await ensurePaymasterApproval(paymasterTokenAddress)
        }

        const builder = await initBuilder(usePaymaster, paymasterTokenAddress, type)
        if (!builder) return '0'
        let userOp
        if (operations.length === 1) {
          const operation = operations[0]
          const contract = new ethers.Contract(operation.contractAddress, operation.abi, signer)

          userOp = builder.execute(
            contract.address,
            operation.value || ethers.constants.Zero,
            contract.interface.encodeFunctionData(operation.function, operation.params),
          )
        } else if (operations.length > 1) {
          let to: string[] = []
          let data: BytesLike[] = []

          operations.forEach((operation) => {
            const contract = new ethers.Contract(operation.contractAddress, operation.abi, signer)
            to.push(contract.address)
            data.push(contract.interface.encodeFunctionData(operation.function, operation.params))
          })

          userOp = builder.executeBatch(to, data)
        } else {
          return '0'
        }

        const op = await client.buildUserOperation(userOp)
        const callGasLimit = ethers.BigNumber.from(op.callGasLimit)
        const verificationGasLimit = ethers.BigNumber.from(op.verificationGasLimit)
        const preVerificationGas = ethers.BigNumber.from(op.preVerificationGas)
        const maxFeePerGas = ethers.BigNumber.from(op.maxFeePerGas)

        const totalGas = callGasLimit.add(verificationGasLimit).add(preVerificationGas)
        const totalFeeWei = totalGas.mul(maxFeePerGas)

        if (usePaymaster && paymasterTokenAddress && type !== PAYMASTER_MODE.FREE_GAS) {
          const selectedToken = supportedTokens.find(
            (token) => token.token === paymasterTokenAddress,
          )

          if (selectedToken?.price) {
            const tokenPrice = parseFloat(selectedToken.price)

            if (tokenPrice > 0) {
              const ethFee = ethers.utils.formatEther(totalFeeWei)
              const tokenFee = parseFloat(ethFee) / tokenPrice
              return tokenFee.toFixed(15)
            }
          }
        }

        return ethers.utils.formatEther(totalFeeWei)
      } catch (error) {
        return TOKEN_CONFIG.FALLBACK_GAS_ESTIMATE
      }
    },
    [signer, client, simpleAccountInstance, initBuilder, supportedTokens, ensurePaymasterApproval],
  )

  return { estimateUserOpFee, ensurePaymasterApproval }
}
