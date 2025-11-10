import { useContext } from 'react'
import { TransactionContext } from '@/contexts/TransactionContext'
import { TransactionContextProps } from '@/types'

export const useTransactionContext = (): TransactionContextProps => {
  const context = useContext(TransactionContext)
  if (!context) {
    throw new Error('useTransactionContext must be used within a TransactionProvider')
  }
  return context
}
