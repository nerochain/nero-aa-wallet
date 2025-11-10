import useSWR from 'swr'
import { fetcher } from '@/helper/fetcher'
import { useSignature } from '@/hooks/account/useSignature'
import { useConfig } from '@/hooks/operation/useConfig'
import { UserTokensResponse } from '@/types'

export const useUserTokens = (): {
  userTokens: UserTokensResponse | undefined
  error: Error | undefined
  isLoading: boolean
  AAaddress: string
} => {
  const { AAaddress } = useSignature()
  const { explorerAPI } = useConfig()

  const apiUrl = `${explorerAPI}/api`
  const { data: userTokens, error } = useSWR(
    AAaddress ? `${apiUrl}?module=account&action=tokentx&address=${AAaddress}` : null,
    fetcher,
  )

  return { userTokens, error, isLoading: !error && !userTokens, AAaddress }
}
