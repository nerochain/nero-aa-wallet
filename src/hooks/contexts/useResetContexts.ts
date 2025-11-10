import { useContext } from 'react'
import { MultiSendContext } from '@/contexts/MultiSendContext'
import { NFTContext } from '@/contexts/NFTContext'
import { SendContext } from '@/contexts/SendContext'
import { SendUserOpContext } from '@/contexts/SendUserOpContext'
import { TokenContext } from '@/contexts/TokenContext'
import { usePaymasterContext } from './usePaymasterContext'

export const useResetContexts = () => {
  const sendContext = useContext(SendContext)
  const sendUserOpContext = useContext(SendUserOpContext)
  const multiSendContext = useContext(MultiSendContext)
  const tokenContext = useContext(TokenContext)
  const nftContext = useContext(NFTContext)
  const paymasterContext = usePaymasterContext()

  const resetAllContexts = () => {
    // SendContext
    if (sendContext) {
      sendContext.clearRecipientAddress()
      sendContext.clearSelectedToken()
      sendContext.clearBalance()
      sendContext.setPaymaster(false)
      sendContext.setIsTransferEnabled(false)
    }

    // SendUserOpContext
    if (sendUserOpContext) {
      sendUserOpContext.clearUserOperations()
      sendUserOpContext.setPaymaster(false)
      sendUserOpContext.setLatestUserOpResult(null)
    }

    // MultiSendContext
    if (multiSendContext) {
      multiSendContext.clearAll()
    }

    // TokenContext
    if (tokenContext) {
      tokenContext.clearToken()
      tokenContext.clearRecipientAddress()
      tokenContext.setPaymaster(false)
      tokenContext.setIsTransferEnabled(false)
    }

    // NFTContext
    if (nftContext) {
      nftContext.clearNFT()
      nftContext.clearRecipientAddress()
      nftContext.setPaymaster(false)
      nftContext.setIsTransferEnabled(false)
    }

    // PaymasterContext
    if (paymasterContext) {
      paymasterContext.clearPaymasterStates()
      paymasterContext.setIsPaymentSelected(false)
    }
  }

  return { resetAllContexts }
}
