import useSWR from 'swr'
import { formatTransaction } from '@/helper/formatTransaction'
import { useSignature } from '@/hooks/account/useSignature'
import { useConfig } from '@/hooks/operation/useConfig'
import {
  TransactionListResponse,
  ActionType,
  CombinedTransaction,
  TokenTransaction,
  StandardTransaction,
} from '@/types'

export function useTransactions() {
  const { AAaddress } = useSignature()
  const { explorerAPI, explorerUrl } = useConfig()
  const apiUrl = `${explorerAPI}/api`
  const actions: ActionType[] = ['txlist', 'tokentx']
  const getUrl = (action: ActionType) =>
    `${apiUrl}?module=account&action=${action}&address=${AAaddress}`

  const fetcher = async (urls: string[]): Promise<TransactionListResponse[]> => {
    const responses = await Promise.all(urls.map((url) => fetch(url)))
    const results = await Promise.all(responses.map((res) => res.json()))
    return results
  }

  const { data, error, mutate } = useSWR<TransactionListResponse[], Error>(
    AAaddress ? actions.map(getUrl) : null,
    {
      fetcher: (urls) => fetcher(urls as string[]),
    },
  )

  const combineTransactions = (
    internalTxs: StandardTransaction[] | undefined,
    tokenTxs: TokenTransaction[] | undefined,
  ): CombinedTransaction[] => {
    if (!internalTxs && !tokenTxs) return []

    const internalTxMap = new Map<string, StandardTransaction>()
    internalTxs?.forEach((tx) => {
      internalTxMap.set(tx.transactionHash, tx)
    })

    const tokenTxMap = new Map<string, TokenTransaction[]>()
    tokenTxs?.forEach((tx) => {
      if (!tokenTxMap.has(tx.hash)) {
        tokenTxMap.set(tx.hash, [])
      }
      tokenTxMap.get(tx.hash)!.push(tx)
    })

    const allHashes = new Set([...internalTxMap.keys(), ...tokenTxMap.keys()])
    const combinedTxs: CombinedTransaction[] = []

    allHashes.forEach((hash) => {
      const internalTx = internalTxMap.get(hash)
      const tokenTxs = tokenTxMap.get(hash) || []

      if (tokenTxs.length > 0) {
        const [mainTx, ...otherTxs] = tokenTxs
        const combinedTx: CombinedTransaction = {
          ...mainTx,
          isTokenTransaction: true,
          transactionHash: hash,
        }
        combinedTx.gasToken = {
          tokenName: mainTx.tokenName,
          tokenSymbol: mainTx.tokenSymbol,
          value: mainTx.value,
          tokenDecimal: mainTx.tokenDecimal,
        }

        if (otherTxs.length > 0) {
          const actualSentTx = otherTxs[0]
          combinedTx.tokenName = actualSentTx.tokenName
          combinedTx.tokenSymbol = actualSentTx.tokenSymbol
          combinedTx.value = actualSentTx.value
          combinedTx.tokenDecimal = actualSentTx.tokenDecimal
        }

        combinedTxs.push(combinedTx)
      } else if (internalTx) {
        combinedTxs.push({
          ...internalTx,
          isTokenTransaction: false,
        })
      }
    })

    return combinedTxs
  }

  const combinedTransactions = combineTransactions(
    data?.[0]?.result as StandardTransaction[] | undefined,
    data?.[1]?.result as TokenTransaction[] | undefined,
  )

  const filteredTransactions = combinedTransactions
    .filter((tx) => {
      const isRelevant =
        tx.to.toLowerCase() === AAaddress.toLowerCase() ||
        tx.from.toLowerCase() === AAaddress.toLowerCase()
      return isRelevant
    })
    .map((tx) => formatTransaction(tx, AAaddress, explorerUrl))
    .sort((recent, older) => new Date(older.date).getTime() - new Date(recent.date).getTime())

  return {
    formattedTransactions: filteredTransactions,
    isLoading: !error && !data,
    isError: !!error,
    mutate,
  }
}
