'use client'

import { useState } from 'react'
import { useAccount, useBalance, useReadContract, useChainId } from 'wagmi'
import { formatEther } from 'viem'
import { DepositSection } from './DepositSection'
import { SwapSection } from './SwapSection'
import { SplitSection } from './SplitSection'
import { RedeemSection } from './RedeemSection'
import { PortfolioOverview } from './PortfolioOverview'
import { PriceChart } from './PriceChart'
import { getContractAddresses, YIELD_SPLITTER_ABI } from '../config/contracts'

export function YieldSplittingDashboard() {
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
  const { data: userPosition } = useReadContract({
    address: contracts.yieldSplitter,
    abi: YIELD_SPLITTER_ABI,
    functionName: 'getUserPosition',
    args: address ? [address] : undefined,
  })

  // Get user balances
  const { data: kdaBalance } = useBalance({ address })
  const { data: wkdaBalance } = useBalance({ address, token: contracts.wrappedKDA })

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
          <div className="text-xl font-bold">🌾 Kadena Yield Splitter</div>
        </div>
        <div className="navbar-center hidden lg:flex">
          <div className="tabs tabs-boxed">
            <button 
              className={`tab ${activeTab === 'deposit' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('deposit')}
            >
              💰 Deposit
            </button>
            <button 
              className={`tab ${activeTab === 'split' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('split')}
            >
              ✂️ Split
            </button>
            <button 
              className={`tab ${activeTab === 'swap' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('swap')}
            >
              🔄 Swap
            </button>
            <button 
              className={`tab ${activeTab === 'redeem' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('redeem')}
            >
              💎 Redeem
            </button>
          </div>
        </div>
        <div className="navbar-end">
          {isConnected && (
            <div className="text-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto p-4">
        {/* Protocol Stats */}
        {contractStats && contractStats.length >= 4 && (
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
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Action Panel */}
          <div className="lg:col-span-2">
            {activeTab === 'deposit' && <DepositSection />}
            {activeTab === 'split' && <SplitSection />}
            {activeTab === 'swap' && <SwapSection />}
            {activeTab === 'redeem' && <RedeemSection />}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Portfolio Overview */}
            <PortfolioOverview 
              userPosition={userPosition}
              kdaBalance={kdaBalance}
              wkdaBalance={wkdaBalance}
            />

            {/* Price Chart */}
            <PriceChart />

            {/* Quick Actions */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    className="btn btn-outline btn-sm w-full"
                    onClick={() => setActiveTab('deposit')}
                  >
                    🔄 Wrap KDA
                  </button>
                  <button 
                    className="btn btn-outline btn-sm w-full"
                    onClick={() => setActiveTab('split')}
                  >
                    ✂️ Split Tokens
                  </button>
                  <button 
                    className="btn btn-outline btn-sm w-full"
                    onClick={() => setActiveTab('swap')}
                  >
                    💱 Trade PT/YT
                  </button>
                  <button 
                    className="btn btn-outline btn-sm w-full"
                    onClick={() => setActiveTab('redeem')}
                  >
                    💰 Claim Yield
                  </button>
                </div>
              </div>
            </div>

            {/* Protocol Info */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">Protocol Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Current APY:</span>
                    <span className="font-semibold text-success">5.00%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trading Fee:</span>
                    <span className="font-semibold">0.30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PT Discount:</span>
                    <span className="font-semibold text-warning">4.00%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>YT Premium:</span>
                    <span className="font-semibold text-info">2.00%</span>
                  </div>
                </div>
              </div>
            </div>
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
