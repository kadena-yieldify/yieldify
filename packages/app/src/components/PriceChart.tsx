'use client'

import { useState, useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'

// Contract addresses - update with deployed addresses
const DIA_ORACLE_ADDRESS = '0x...' as const
const MOCK_AMM_ADDRESS = '0x...' as const

const DIA_ORACLE_ABI = [
  {
    name: 'getLatestPrice',
    type: 'function',
    inputs: [{ name: 'key', type: 'string' }],
    outputs: [{ name: 'price', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'getPTYTRatio',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'ratio', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'getImpliedYieldRate',
    type: 'function',
    inputs: [{ name: 'timeToMaturity', type: 'uint256' }],
    outputs: [{ name: 'yieldRate', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

const MOCK_AMM_ABI = [
  {
    name: 'getPoolInfo',
    type: 'function',
    inputs: [],
    outputs: [
      { name: 'ptReserve', type: 'uint256' },
      { name: 'ytReserve', type: 'uint256' },
      { name: 'ptPrice', type: 'uint256' },
      { name: 'ytPrice', type: 'uint256' }
    ],
    stateMutability: 'view',
  },
] as const

interface PriceData {
  timestamp: number
  ptPrice: number
  ytPrice: number
  kdaPrice: number
}

export function PriceChart() {
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([])
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1H' | '1D' | '1W'>('1D')

  // Get current prices from oracle
  const { data: kdaPrice } = useReadContract({
    address: DIA_ORACLE_ADDRESS,
    abi: DIA_ORACLE_ABI,
    functionName: 'getLatestPrice',
    args: ['KDA/USD'],
  })

  const { data: ptPrice } = useReadContract({
    address: DIA_ORACLE_ADDRESS,
    abi: DIA_ORACLE_ABI,
    functionName: 'getLatestPrice',
    args: ['PT-wKDA/USD'],
  })

  const { data: ytPrice } = useReadContract({
    address: DIA_ORACLE_ADDRESS,
    abi: DIA_ORACLE_ABI,
    functionName: 'getLatestPrice',
    args: ['YT-wKDA/USD'],
  })

  // Get AMM pool info
  const { data: poolInfo } = useReadContract({
    address: MOCK_AMM_ADDRESS,
    abi: MOCK_AMM_ABI,
    functionName: 'getPoolInfo',
  })

  // Get PT/YT ratio
  const { data: ptytRatio } = useReadContract({
    address: DIA_ORACLE_ADDRESS,
    abi: DIA_ORACLE_ABI,
    functionName: 'getPTYTRatio',
  })

  // Get implied yield rate (assuming 6 months to maturity)
  const { data: impliedYield } = useReadContract({
    address: DIA_ORACLE_ADDRESS,
    abi: DIA_ORACLE_ABI,
    functionName: 'getImpliedYieldRate',
    args: [BigInt(180 * 24 * 60 * 60)], // 6 months in seconds
  })

  // Mock price history generation (in a real app, this would come from a backend)
  useEffect(() => {
    const generateMockHistory = () => {
      const now = Date.now()
      const intervals = selectedTimeframe === '1H' ? 12 : selectedTimeframe === '1D' ? 24 : 168 // hours
      const intervalMs = selectedTimeframe === '1H' ? 5 * 60 * 1000 : 60 * 60 * 1000 // 5min or 1hour
      
      const history: PriceData[] = []
      
      for (let i = intervals; i >= 0; i--) {
        const timestamp = now - (i * intervalMs)
        // Generate mock price movements
        const baseKdaPrice = 0.5
        const basePtPrice = 0.48
        const baseYtPrice = 0.02
        
        const volatility = 0.02 // 2% volatility
        const kdaPricePoint = baseKdaPrice * (1 + (Math.random() - 0.5) * volatility)
        const ptPricePoint = basePtPrice * (1 + (Math.random() - 0.5) * volatility * 0.5) // Less volatile
        const ytPricePoint = baseYtPrice * (1 + (Math.random() - 0.5) * volatility * 2) // More volatile
        
        history.push({
          timestamp,
          kdaPrice: kdaPricePoint,
          ptPrice: ptPricePoint,
          ytPrice: ytPricePoint,
        })
      }
      
      setPriceHistory(history)
    }

    generateMockHistory()
    const interval = setInterval(generateMockHistory, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [selectedTimeframe])

  const currentKdaPrice = kdaPrice ? parseFloat(formatEther(kdaPrice)) : 0.5
  const currentPtPrice = ptPrice ? parseFloat(formatEther(ptPrice)) : 0.48
  const currentYtPrice = ytPrice ? parseFloat(formatEther(ytPrice)) : 0.02

  const formatPrice = (price: number) => {
    return price < 0.01 ? price.toFixed(6) : price.toFixed(4)
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h3 className="card-title text-lg flex items-center gap-2">
            <span className="text-xl">📈</span>
            Price Chart
          </h3>
          
          {/* Timeframe Selector */}
          <div className="btn-group btn-group-sm">
            {(['1H', '1D', '1W'] as const).map((timeframe) => (
              <button
                key={timeframe}
                className={`btn btn-sm ${selectedTimeframe === timeframe ? 'btn-active' : ''}`}
                onClick={() => setSelectedTimeframe(timeframe)}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>

        {/* Current Prices */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="stat bg-accent/10 rounded p-2">
            <div className="stat-title text-xs">KDA</div>
            <div className="stat-value text-sm">${formatPrice(currentKdaPrice)}</div>
            <div className="stat-desc text-xs">Underlying</div>
          </div>
          <div className="stat bg-primary/10 rounded p-2">
            <div className="stat-title text-xs">PT</div>
            <div className="stat-value text-sm">${formatPrice(currentPtPrice)}</div>
            <div className="stat-desc text-xs">Principal</div>
          </div>
          <div className="stat bg-secondary/10 rounded p-2">
            <div className="stat-title text-xs">YT</div>
            <div className="stat-value text-sm">${formatPrice(currentYtPrice)}</div>
            <div className="stat-desc text-xs">Yield</div>
          </div>
        </div>

        {/* Simple Price Chart (ASCII-style for MVP) */}
        <div className="bg-base-200 rounded-lg p-4 mb-4">
          <div className="text-xs mb-2">Price Movement ({selectedTimeframe})</div>
          <div className="h-32 flex items-end justify-between gap-1">
            {priceHistory.slice(-20).map((data, index) => {
              const maxPrice = Math.max(...priceHistory.map(d => d.kdaPrice))
              const minPrice = Math.min(...priceHistory.map(d => d.kdaPrice))
              const normalizedHeight = ((data.kdaPrice - minPrice) / (maxPrice - minPrice)) * 100
              
              return (
                <div
                  key={index}
                  className="bg-primary rounded-t flex-1 min-w-0 tooltip"
                  style={{ height: `${Math.max(normalizedHeight, 5)}%` }}
                  data-tip={`$${formatPrice(data.kdaPrice)}`}
                ></div>
              )
            })}
          </div>
          <div className="text-xs opacity-50 mt-1">KDA Price Trend</div>
        </div>

        {/* Market Metrics */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">PT/YT Ratio:</span>
            <span className="font-semibold">
              {ptytRatio ? parseFloat(formatEther(ptytRatio)).toFixed(2) : '24.00'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Implied APY:</span>
            <span className="font-semibold text-success">
              {impliedYield ? (Number(impliedYield) / 100).toFixed(2) : '5.00'}%
            </span>
          </div>
          
          {poolInfo && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pool Liquidity:</span>
                <span className="font-semibold">
                  {(parseFloat(formatEther(poolInfo[0])) + parseFloat(formatEther(poolInfo[1]))).toFixed(2)} Tokens
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">AMM PT Price:</span>
                <span className="font-semibold">
                  {parseFloat(formatEther(poolInfo[2])).toFixed(4)} YT
                </span>
              </div>
            </>
          )}
        </div>

        {/* Market Status */}
        <div className="alert alert-info mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div className="text-xs">
            <div className="font-semibold">Market Status: Active</div>
            <div>PT trading at {((currentPtPrice / currentKdaPrice - 1) * 100).toFixed(1)}% discount to underlying</div>
          </div>
        </div>
      </div>
    </div>
  )
}
