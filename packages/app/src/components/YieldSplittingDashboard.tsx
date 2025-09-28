'use client'

import React, { useState, useCallback } from 'react'
import { useAccount, useReadContract, useChainId, useBalance } from 'wagmi'
import { formatEther } from 'viem'
import { DepositSection } from './DepositSection'
import { SplitSection } from './SplitSection'
import { SwapSection } from './SwapSection'
import { RedeemSection } from './RedeemSection'
import { PortfolioOverview } from './PortfolioOverview'
import { PriceChart } from './PriceChart'
import { Connect } from './Connect'
import { getContractAddresses } from '@/config/contracts'
import { YIELD_SPLITTER_ABI } from '@/config/contracts'

export function YieldSplittingDashboard(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'deposit' | 'split' | 'swap' | 'redeem'>('deposit')
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  // Get contract addresses for current chain
  const contracts = getContractAddresses(chainId)

  // Get contract stats
  const { data: contractStats } = useReadContract({
    address: contracts.yieldSplitter,
    abi: YIELD_SPLITTER_ABI,
    functionName: 'getContractStats',
  })

  // Get user position
  const { data: userPosition, refetch: refetchUserPosition } = useReadContract({
    address: contracts.yieldSplitter,
    abi: YIELD_SPLITTER_ABI,
    functionName: 'getUserPosition',
    args: address ? [address] : undefined,
  })

  // Get user balances
  const { data: kdaBalance, refetch: refetchKdaBalance } = useBalance({ address })
  const { data: wkdaBalance, refetch: refetchWkdaBalance } = useBalance({ address, token: contracts.wrappedKDA })

  // Refresh all data periodically to catch transaction updates
  const refreshAllData = useCallback(() => {
    refetchUserPosition()
    refetchKdaBalance()
    refetchWkdaBalance()
  }, [refetchKdaBalance, refetchUserPosition, refetchWkdaBalance])

  // Auto-refresh every 10 seconds when connected
  React.useEffect(() => {
    if (isConnected) {
      const interval = setInterval(refreshAllData, 10000)
      return () => clearInterval(interval)
    }
  }, [isConnected, refreshAllData])

  const formatTimeToMaturity = (maturityTimestamp: bigint) => {
    const now = Math.floor(Date.now() / 1000)
    const maturity = Number(maturityTimestamp)
    const timeLeft = maturity - now

    if (timeLeft <= 0) return 'Matured'

    const days = Math.floor(timeLeft / (24 * 60 * 60))
    const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="navbar-start">
          <div className="text-xl font-bold">KYM Finance</div>
        </div>
        <div className="navbar-center hidden lg:flex">
          <div className="tabs tabs-boxed">
            <button 
              className={`tab ${activeTab === 'deposit' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('deposit')}
            >
              Deposit
            </button>
            <button 
              className={`tab ${activeTab === 'split' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('split')}
            >
              Split
            </button>
            <button 
              className={`tab ${activeTab === 'swap' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('swap')}
            >
              Swap
            </button>
            <button 
              className={`tab ${activeTab === 'redeem' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('redeem')}
            >
              Redeem
            </button>
          </div>
        </div>
        <div className="navbar-end">
          <Connect />
        </div>
      </div>

      <div className="container mx-auto p-4">
        {/* Protocol Stats */}
        {contractStats && Array.isArray(contractStats) && contractStats.length >= 4 ? (
          <div className="stats shadow mb-6 w-full">
            <div className="stat">
              <div className="stat-title">Total Value Locked</div>
              <div className="stat-value text-primary">
                {parseFloat(formatEther(contractStats[0])).toFixed(2)} wKDA
              </div>
              <div className="stat-desc">Total deposited in protocol</div>
            </div>
            
            <div className="stat">
              <div className="stat-title">Total Yield Distributed</div>
              <div className="stat-value text-secondary">
                {parseFloat(formatEther(contractStats[1])).toFixed(4)} wKDA
              </div>
              <div className="stat-desc">Cumulative yield paid out</div>
            </div>
            
            <div className="stat">
              <div className="stat-title">Time to Maturity</div>
              <div className="stat-value text-accent">
                {formatTimeToMaturity(contractStats[2])}
              </div>
              <div className="stat-desc">
                {contractStats[3] ? 'Contract Expired' : 'Until PT redemption'}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Action Panel */}
          <div className="lg:col-span-3">
            {activeTab === 'deposit' && <DepositSection />}
            {activeTab === 'split' && <SplitSection />}
            {activeTab === 'swap' && <SwapSection />}
            {activeTab === 'redeem' && <RedeemSection />}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Portfolio Overview */}
            <PortfolioOverview 
              userPosition={userPosition as readonly [bigint, bigint, bigint] | undefined}
              kdaBalance={kdaBalance}
              wkdaBalance={wkdaBalance}
            />

            {/* Price Chart */}
            <PriceChart />
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="btm-nav lg:hidden">
          <button 
            className={activeTab === 'deposit' ? 'active' : ''}
            onClick={() => setActiveTab('deposit')}
          >
            <span className="btm-nav-label">Deposit</span>
          </button>
          <button 
            className={activeTab === 'split' ? 'active' : ''}
            onClick={() => setActiveTab('split')}
          >
            <span className="btm-nav-label">Split</span>
          </button>
          <button 
            className={activeTab === 'swap' ? 'active' : ''}
            onClick={() => setActiveTab('swap')}
          >
            <span className="btm-nav-label">Swap</span>
          </button>
          <button 
            className={activeTab === 'redeem' ? 'active' : ''}
            onClick={() => setActiveTab('redeem')}
          >
            <span className="btm-nav-label">Redeem</span>
          </button>
        </div>
      </div>
    </div>
  )
}
