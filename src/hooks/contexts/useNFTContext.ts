import { useContext } from 'react'
import { NFTContext } from '@/contexts/NFTContext'
import { NFTContextType } from '@/types'

export const useNFTContext = (): NFTContextType => {
  const context = useContext(NFTContext)
  if (context === undefined) {
    throw new Error('useNFTContext must be used within a NFTProvider')
  }
  return context
}
