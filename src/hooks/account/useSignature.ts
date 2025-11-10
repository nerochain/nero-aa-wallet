import { useContext } from 'react'
import { SignatureContext } from '@/contexts/SignatureContext'
import { SignatureContextProps } from '@/types'

export const useSignature = (): SignatureContextProps => {
  const context = useContext(SignatureContext)
  if (!context) {
    throw new Error('useSignature must be used within a SignatureProvider')
  }
  return context
}
