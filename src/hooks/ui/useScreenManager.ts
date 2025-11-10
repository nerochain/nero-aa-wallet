import { useContext } from 'react'
import { ScreenManagerContext } from '@/contexts/ScreenManagerContext'

export const useScreenManager = () => {
  const context = useContext(ScreenManagerContext)
  if (context === undefined) {
    throw new Error('useScreenManager must be used within a ScreenManagerProvider')
  }
  return context
}
