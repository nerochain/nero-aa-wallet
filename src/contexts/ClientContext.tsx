import React, { createContext, useState, useEffect } from 'react'
import { Client } from 'userop'
import { useConfig } from '@/hooks/operation/useConfig'
import { ProviderProps } from '@/types'

export const ClientContext = createContext<Client | null>(null)

export const ClientProvider: React.FC<ProviderProps> = ({ children }) => {
  const [client, setClient] = useState<Client | null>(null)
  const { rpcUrl, bundlerUrl, entryPoint } = useConfig()

  useEffect(() => {
    const initClient = async () => {
      try {
        const clientInstance = await Client.init(rpcUrl, {
          entryPoint,
          overrideBundlerRpc: bundlerUrl,
        })
        setClient(clientInstance)
      } catch (error) {
        console.error('Failed to initialize client')
      }
    }
    initClient()
  }, [entryPoint, rpcUrl, bundlerUrl])

  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
}
