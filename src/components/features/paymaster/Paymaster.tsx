import React, { useEffect } from 'react'
import { FaGift } from 'react-icons/fa'
import { GoArrowSwitch } from 'react-icons/go'
import { MdAdsClick } from 'react-icons/md'
import { PaymentOption, TokenList, ErrorDisplay } from './components'
import { TokenIcon } from '@/components/features/token'
import { usePaymasterUI } from '@/hooks'

const PaymasterPanel: React.FC = () => {
  const {
    screen,
    isFlipped,
    setIsFlipped,
    localError,
    isLoading,
    error,
    supportedTokens,
    sponsorshipInfo,
    selectedToken,
    isSponsoredSelected,
    scrollContainerRef,
    fetchTokens,
    handleRetry,
    handleTokenClick,
    scrollLeft,
    scrollRight,
    handleSelectPaymentType,
    handleBackToSelection,
  } = usePaymasterUI()

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  if (isLoading && !localError) return <div>Loading supported tokens...</div>

  if (error || localError) {
    return <ErrorDisplay error={localError || error} onRetry={handleRetry} />
  }

  if (screen === 'selection') {
    return (
      <div className='w-full bg-white rounded-xl flex flex-col space-y-2 p-1 relative'>
        <div className='absolute top-2 right-2 z-10'>
          <GoArrowSwitch
            className='text-xl text-gray-500 hover:text-gray-700 cursor-pointer transition-transform duration-300 hover:rotate-180'
            onClick={() => setIsFlipped(!isFlipped)}
          />
        </div>

        <div className='text-sm text-text-secondary text-left'>Select Payment Method</div>

        <div
          className={`relative transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Sponsored Gas Option */}
          <div className={`absolute w-full backface-hidden ${!isFlipped ? 'block' : 'hidden'}`}>
            <PaymentOption
              isSelected={isSponsoredSelected}
              isDisabled={!sponsorshipInfo.freeGas}
              onClick={() => sponsorshipInfo.freeGas && handleSelectPaymentType('sponsored')}
              icon={
                <FaGift
                  className={`text-xs ${
                    isSponsoredSelected
                      ? 'text-white scale-110'
                      : sponsorshipInfo.freeGas
                        ? 'text-white'
                        : 'text-gray-400'
                  }`}
                />
              }
              title='Sponsored Gas'
              subtitle={
                sponsorshipInfo.freeGas
                  ? 'Free transactions available'
                  : 'Sponsored transactions not available'
              }
              rightIcon={sponsorshipInfo.freeGas ? <MdAdsClick className='text-md' /> : undefined}
            />
          </div>

          {/* Token Payment Option */}
          <div
            className={`absolute w-full backface-hidden rotate-y-180 ${isFlipped ? 'block' : 'hidden'}`}
          >
            <PaymentOption
              isDisabled={supportedTokens.length === 0}
              onClick={() => supportedTokens.length > 0 && handleSelectPaymentType('token')}
              icon={
                <TokenIcon
                  tokenAddress={supportedTokens[0]?.token}
                  symbol={supportedTokens[0]?.symbol}
                  size='xs'
                  isNative={supportedTokens[0]?.type === 'native'}
                />
              }
              title='Pay with Token'
              subtitle={
                supportedTokens.length > 0
                  ? `${supportedTokens.length} tokens available`
                  : 'No tokens available'
              }
              isTokenOption={true}
              isNativeToken={supportedTokens[0]?.type === 'native'}
              rightIcon={
                supportedTokens.length > 0 ? <MdAdsClick className='text-md' /> : undefined
              }
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <TokenList
      tokens={supportedTokens}
      selectedToken={selectedToken}
      scrollContainerRef={scrollContainerRef}
      onTokenClick={handleTokenClick}
      onScrollLeft={scrollLeft}
      onScrollRight={scrollRight}
      onBackClick={handleBackToSelection}
    />
  )
}

export default PaymasterPanel
