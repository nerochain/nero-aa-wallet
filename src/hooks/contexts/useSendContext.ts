import { useContext } from 'react'
import { SendContext } from '@/contexts/SendContext'
import { SendContextProps } from '@/types'

export const useSendContext = (): SendContextProps => {
  const context = useContext(SendContext)
  if (!context) {
    throw new Error('useSendContext must be used within a SendProvider')
  }
  return context
}
