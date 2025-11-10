import { useMemo } from 'react'
import { usePaymasterContext } from '@/hooks/contexts/usePaymasterContext'
import { PaymasterModeValue, PAYMASTER_MODE } from '@/types/Paymaster'

export const usePaymasterMode = (): {
  paymasterModeValue: PaymasterModeValue
  isFreeGasMode: boolean
  isPreFundMode: boolean
  isPostFundMode: boolean
} => {
  const { selectedMode } = usePaymasterContext()

  const paymasterModeValue = useMemo<PaymasterModeValue>(
    () => selectedMode?.value ?? PAYMASTER_MODE.FREE_GAS,
    [selectedMode],
  )

  const isFreeGasMode = paymasterModeValue === PAYMASTER_MODE.FREE_GAS
  const isPreFundMode = paymasterModeValue === PAYMASTER_MODE.PRE_FUND
  const isPostFundMode = paymasterModeValue === PAYMASTER_MODE.POST_FUND

  return {
    paymasterModeValue,
    isFreeGasMode,
    isPreFundMode,
    isPostFundMode,
  }
}
