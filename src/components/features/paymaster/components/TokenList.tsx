import React, { useState, useMemo } from 'react'
import { AiFillCaretLeft, AiFillCaretRight } from 'react-icons/ai'
import { TokenIcon, TokenSearchInput } from '@/components/features/token'
import { PaymasterToken, TokenListProps } from '@/types/Paymaster'
import { truncateAddress } from '@/utils'
import { getCustomERC20Tokens } from '@/utils/localStorage'

const TokenList: React.FC<TokenListProps> = ({
  tokens,
  selectedToken,
  scrollContainerRef,
  onTokenClick,
  onScrollLeft,
  onScrollRight,
  onBackClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokens

    const query = searchQuery.toLowerCase().trim()

    return tokens.filter((token) => {
      const symbolMatch = token.symbol.toLowerCase().includes(query)
      let addressMatch = false
      if (query.startsWith('0x') && token.token) {
        addressMatch = token.token.toLowerCase().includes(query)
      }

      return symbolMatch || addressMatch
    })
  }, [tokens, searchQuery])

  const sortedTokens = useMemo(() => {
    const importedTokens = getCustomERC20Tokens()
    const importedAddresses = importedTokens.map((token) => token.contractAddress.toLowerCase())

    const nativeToken = filteredTokens.filter((token) => token.type === 'native')
    const importedGroup = filteredTokens.filter(
      (token) =>
        token.type !== 'native' &&
        token.token &&
        importedAddresses.includes(token.token.toLowerCase()),
    )
    const systemTokens = filteredTokens.filter(
      (token) =>
        token.type !== 'native' &&
        (!token.token || !importedAddresses.includes(token.token.toLowerCase())),
    )

    const sortByPrice = (firstToken: PaymasterToken, secondToken: PaymasterToken) => {
      const firstPrice = parseFloat(firstToken.price)
      const secondPrice = parseFloat(secondToken.price)
      return firstPrice - secondPrice
    }

    const sortedImportedGroup = [...importedGroup].sort(sortByPrice)
    const sortedOtherTokens = [...systemTokens].sort(sortByPrice)

    return [...nativeToken, ...sortedImportedGroup, ...sortedOtherTokens]
  }, [filteredTokens])

  if (tokens.length === 0) {
    return (
      <div className='p-3 text-center'>
        <p className='text-gray-500'>No tokens available</p>
        <button onClick={onBackClick} className='mt-2 text-sm text-blue-500 hover:text-blue-700'>
          Back
        </button>
      </div>
    )
  }

  return (
    <div className='w-full bg-white rounded-xl flex flex-col'>
      <div className='p-2 border-b flex items-center justify-between'>
        <button onClick={onBackClick} className='text-blue-500 hover:text-blue-600 mr-2 text-md'>
          ← Back
        </button>

        <TokenSearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          className='relative w-32 sm:w-40'
        />
      </div>

      {sortedTokens.length > 0 ? (
        <>
          <div className='flex items-center mt-3 w-full'>
            <button onClick={onScrollLeft} className='rounded-full focus:outline-none'>
              <AiFillCaretLeft className='text-0.5xl text-text-primary' />
            </button>
            <div
              className='flex flex-1  space-x-2 overflow-x-auto no-scrollbar'
              ref={scrollContainerRef}
            >
              {sortedTokens.map((token) => (
                <div
                  key={token.token}
                  className={`flex items-center text-text-primary rounded-full p-2 border border-border-primary cursor-pointer min-w-[90px] ${
                    selectedToken === token.token ? 'bg-blue-200' : 'bg-white'
                  }`}
                  onClick={() => onTokenClick(token)}
                >
                  <TokenIcon
                    tokenAddress={token.token}
                    symbol={token.symbol}
                    size='sm'
                    isNative={token.type === 'native'}
                    className='mr-2'
                  />
                  <div className='flex flex-col overflow-hidden'>
                    <div className='text-xs font-bold'>{token.symbol}</div>
                    <div className='text-xs'>
                      {token.type === 'native' ? 'Native' : token.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={onScrollRight} className=' rounded-full focus:outline-none'>
              <AiFillCaretRight className='text-0.5xl text-text-primary' />
            </button>
          </div>
          <div className='flex flex-col text-sm p-1 mt-2'>
            <span>
              Selected Token:{' '}
              {selectedToken
                ? selectedToken === '0x0000000000000000000000000000000000000000'
                  ? 'NERO (Native)'
                  : truncateAddress(selectedToken)
                : 'None'}
            </span>
          </div>
        </>
      ) : (
        <div className='p-4 text-center text-gray-500'>
          No tokens found matching "{searchQuery}"
        </div>
      )}
    </div>
  )
}

export default TokenList
