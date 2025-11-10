import { useContext } from 'react'
import { TokenContext } from '@/contexts/TokenContext'
import { TokenContextType } from '@/types'

export const useTokenContext = (): TokenContextType => {
  const context = useContext(TokenContext)
  if (context === undefined) {
    throw new Error('useTokenContext must be used within a NFTProvider')
  }
  return context
}
