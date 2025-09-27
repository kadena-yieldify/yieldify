'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useChainId } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'react-hot-toast'
import { getContractAddresses, YIELD_SPLITTER_ABI } from '../config/contracts'

const MOCK_AMM_ABI = [
  {
    name: 'swapPTForYT',
    type: 'function',
    inputs: [
      { name: 'ptAmountIn', type: 'uint256' },
      { name: 'minYtOut', type: 'uint256' }
    ],
    outputs: [{ name: 'ytAmountOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'swapYTForPT',
    type: 'function',
    inputs: [
      { name: 'ytAmountIn', type: 'uint256' },
      { name: 'minPtOut', type: 'uint256' }
    ],
    outputs: [{ name: 'ptAmountOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getQuotePTForYT',
    type: 'function',
    inputs: [{ name: 'ptAmountIn', type: 'uint256' }],
    outputs: [{ name: 'ytAmountOut', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'getQuoteYTForPT',
    type: 'function',
    inputs: [{ name: 'ytAmountIn', type: 'uint256' }],
    outputs: [{ name: 'ptAmountOut', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'addInitialLiquidity',
    type: 'function',
    inputs: [
      { name: 'ptAmount', type: 'uint256' },
      { name: 'ytAmount', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
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

const TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

export function SwapSection() {
  const [fromToken, setFromToken] = useState<'PT' | 'YT'>('PT')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5') // 0.5% default slippage
  const [isLoading, setIsLoading] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [yieldPercent, setYieldPercent] = useState('5') // r: default 5%
  const [maturityYears, setMaturityYears] = useState('1') // t: default 1 year

  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  // Get contract addresses for current chain
  const contracts = getContractAddresses(chainId)

  // Get token balances
  const { data: ptBalance } = useReadContract({
    address: contracts.principalToken,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: ytBalance } = useReadContract({
    address: contracts.yieldToken,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Get pool info (optional: used for reserves display only)
  const { data: poolInfo, refetch: refetchPoolInfo } = useReadContract({
    address: contracts.mockAMM,
    abi: MOCK_AMM_ABI,
    functionName: 'getPoolInfo',
  })

  // Auto-refresh pool info every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchPoolInfo()
    }, 5000)
    return () => clearInterval(interval)
  }, [refetchPoolInfo])

  // Get contract stats to auto-fill maturity time
  const { data: contractStats } = useReadContract({
    address: contracts.yieldSplitter,
    abi: YIELD_SPLITTER_ABI,
    functionName: 'getContractStats',
  })


  // Auto-fill maturity time when contract stats are available
  useEffect(() => {
    if (contractStats && Array.isArray(contractStats) && contractStats.length >= 3) {
      const maturityTimestamp = Number(contractStats[2])
      const currentTimestamp = Math.floor(Date.now() / 1000)
      const timeToMaturitySeconds = maturityTimestamp - currentTimestamp
      
      if (timeToMaturitySeconds > 0) {
        const timeToMaturityYears = timeToMaturitySeconds / (365.25 * 24 * 60 * 60)
        setMaturityYears(Math.max(0.1, timeToMaturityYears).toFixed(2))
      }
    }
  }, [contractStats])

  // Compute toAmount using Pendle-like formula
  // PT discount factor DF = 1 / (1 + r)^t
  // Split of 1 unit: PT = DF, YT = 1 - DF
  // Conversions:
  //  - PT -> YT: for each PT, equivalent YT = PT * (1/DF - 1)
  //  - YT -> PT: for each YT, equivalent PT = YT * (DF / (1 - DF))
  useEffect(() => {
    const amt = parseFloat(fromAmount)
    const r = parseFloat(yieldPercent)
    const t = parseFloat(maturityYears)

    if (!isFinite(amt) || amt <= 0 || !isFinite(r) || r < 0 || !isFinite(t) || t <= 0) {
      setToAmount('')
      return
    }

    const rDec = r / 100
    const DF = 1 / Math.pow(1 + rDec, t)

    // Guard against edge cases
    if (!isFinite(DF) || DF <= 0 || DF >= 1) {
      setToAmount('')
      return
    }

    let out = 0
    if (fromToken === 'PT') {
      out = amt * (1 / DF - 1)
    } else {
      const denom = (1 - DF)
      if (denom <= 0) {
        setToAmount('')
        return
      }
      out = amt * (DF / denom)
    }

    // Avoid scientific notation for small amounts
    const outStr = out.toFixed(6).replace(/\.0+$/, '')
    setToAmount(outStr)
  }, [fromAmount, fromToken, yieldPercent, maturityYears])

  const swapTokens = () => {
    setFromToken(fromToken === 'PT' ? 'YT' : 'PT')
    setFromAmount(toAmount)
    setToAmount('')
    setIsApproved(false) // Reset approval when switching tokens
  }

  const handleApprove = async (tokenAddress: string) => {
    try {
      await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'approve',
        args: [contracts.mockAMM, parseEther('1000000')], // Large approval
      })
      toast.success('Approval transaction submitted!')
      setIsApproved(true) // Enable swap button after approval
    } catch (error) {
      console.error('Approval failed:', error)
      toast.error('Approval failed. Please try again.')
    }
  }


  const handleSwap = async () => {
    if (!fromAmount || !toAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      setIsLoading(true)
      
      const fromAmountWei = parseEther(fromAmount)
      // Fix slippage calculation to handle decimal values (e.g., 0.5%)
      const slippageBasisPoints = Math.floor(parseFloat(slippage) * 100) // Convert % to basis points
      const minToAmountWei = parseEther(toAmount) * BigInt(10000 - slippageBasisPoints) / BigInt(10000)

      if (fromToken === 'PT') {
        await writeContract({
          address: contracts.mockAMM,
          abi: MOCK_AMM_ABI,
          functionName: 'swapPTForYT',
          args: [fromAmountWei, minToAmountWei],
        })
      } else {
        await writeContract({
          address: contracts.mockAMM,
          abi: MOCK_AMM_ABI,
          functionName: 'swapYTForPT',
          args: [fromAmountWei, minToAmountWei],
        })
      }
      
      toast.success('Swap transaction submitted!')
      setFromAmount('')
      setToAmount('')
    } catch (error) {
      console.error('Swap failed:', error)
      toast.error('Swap failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const setMaxAmount = () => {
    const balance = fromToken === 'PT' ? ptBalance : ytBalance
    if (balance) {
      setFromAmount(formatEther(balance))
    }
  }

  const fromTokenBalance = fromToken === 'PT' ? ptBalance : ytBalance
  const toToken = fromToken === 'PT' ? 'YT' : 'PT'

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <span className="text-2xl">🔄</span>
          Token Swap
        </h2>

        {/* Pool Info */}
        {poolInfo && poolInfo.length >= 2 && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">PT Reserve</div>
              <div className="stat-value text-sm">
                {parseFloat(formatEther(poolInfo[0])).toFixed(2)}
              </div>
            </div>
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">YT Reserve</div>
              <div className="stat-value text-sm">
                {parseFloat(formatEther(poolInfo[1])).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* From Token */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">From</span>
            <span className="label-text-alt">
              Balance: {fromTokenBalance ? parseFloat(formatEther(fromTokenBalance)).toFixed(4) : '0.0000'}
            </span>
          </label>
          <div className="input-group">
            <input
              type="number"
              placeholder="0.0"
              className="input input-bordered flex-1"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              step="0.0001"
              min="0"
            />
            <button 
              className="btn btn-outline btn-sm"
              onClick={setMaxAmount}
            >
              Max
            </button>
            <div className="btn btn-ghost btn-sm cursor-default">
              {fromToken}-wKDA
            </div>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <button 
            className="btn btn-circle btn-outline"
            onClick={swapTokens}
          >
            ↕️
          </button>
        </div>

        {/* To Token */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">To</span>
            <span className="label-text-alt">
              {/* Display formula-based instantaneous rate */}
              {(() => {
                const r = parseFloat(yieldPercent)
                const t = parseFloat(maturityYears)
                if (!isFinite(r) || r < 0 || !isFinite(t) || t <= 0) return 'Enter r and t'
                const DF = 1 / Math.pow(1 + r / 100, t)
                if (!isFinite(DF) || DF <= 0 || DF >= 1) return 'Check r and t'
                if (fromToken === 'PT') {
                  const rate = 1 / DF - 1
                  return `1 PT ≈ ${rate.toFixed(4)} YT`
                } else {
                  const rate = DF / (1 - DF)
                  return `1 YT ≈ ${rate.toFixed(4)} PT`
                }
              })()}
            </span>
          </label>
          <div className="input-group">
            <input
              type="number"
              placeholder="0.0"
              className="input input-bordered flex-1"
              value={toAmount}
              readOnly
            />
            <div className="btn btn-ghost btn-sm cursor-default">
              {toToken}-wKDA
            </div>
          </div>
        </div>

        {/* Yield and Maturity Inputs */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Pricing Parameters</span>
            <span className="label-text-alt">Pendle-style DF = 1/(1+r)^t</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="input-group">
              <span className="btn btn-ghost btn-sm">r (%)</span>
              <input
                type="number"
                className="input input-bordered input-sm w-full"
                value={yieldPercent}
                onChange={(e) => setYieldPercent(e.target.value)}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
            <div className="input-group">
              <span className="btn btn-ghost btn-sm">t (years)</span>
              <input
                type="number"
                className="input input-bordered input-sm w-full"
                value={maturityYears}
                onChange={(e) => setMaturityYears(e.target.value)}
                step="0.1"
                min="0.1"
                max="50"
              />
            </div>
          </div>
        </div>

        {/* Slippage Settings */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Slippage Tolerance</span>
          </label>
          <div className="flex gap-2">
            {['0.1', '0.5', '1.0'].map((value) => (
              <button
                key={value}
                className={`btn btn-sm ${slippage === value ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSlippage(value)}
              >
                {value}%
              </button>
            ))}
            <input
              type="number"
              className="input input-bordered input-sm w-20"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              step="0.1"
              min="0.1"
              max="50"
            />
          </div>
        </div>

        {/* Swap Details */}
        {fromAmount && toAmount && (
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <div>Rate: 1 {fromToken} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken}</div>
              <div>Min received: {(parseFloat(toAmount) * (100 - parseFloat(slippage)) / 100).toFixed(6)} {toToken}</div>
            </div>
          </div>
        )}

        {/* Pool Status */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm">
            Pool: {poolInfo && poolInfo.length >= 2 ? 
              `${parseFloat(formatEther(poolInfo[0])).toFixed(4)} PT, ${parseFloat(formatEther(poolInfo[1])).toFixed(4)} YT` : 
              'Loading...'}
          </div>
          <button 
            className="btn btn-ghost btn-xs"
            onClick={() => refetchPoolInfo()}
            title="Refresh pool data"
          >
            🔄
          </button>
        </div>

        {poolInfo && poolInfo.length >= 2 && poolInfo[0] === 0n && poolInfo[1] === 0n && (
          <div className="alert alert-warning mb-4">
            <div>
              <div className="font-bold">⚠️ AMM Pool Not Initialized</div>
              <div className="text-sm mt-1">
                The AMM pool needs to be initialized by the contract owner first. 
                <br />Contact the deployer or wait for pool initialization.
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Show Approve button first, then Swap button after approval */}
          {!isApproved ? (
            <button
              className="btn btn-outline w-full"
              onClick={() => handleApprove(fromToken === 'PT' ? contracts.principalToken : contracts.yieldToken)}
              disabled={isPending || isConfirming || !address || (poolInfo && poolInfo.length >= 2 && poolInfo[0] === 0n && poolInfo[1] === 0n)}
            >
              {isPending || isConfirming ? 'Processing...' : 
               (poolInfo && poolInfo.length >= 2 && poolInfo[0] === 0n && poolInfo[1] === 0n) ? 'Pool Not Ready' :
               `Approve ${fromToken}-wKDA`}
            </button>
          ) : (
            <button
              className="btn btn-primary w-full"
              onClick={handleSwap}
              disabled={
                !fromAmount || 
                !toAmount || 
                isPending || 
                isConfirming || 
                isLoading ||
                !address ||
                parseFloat(fromAmount) <= 0 ||
                (poolInfo && poolInfo.length >= 2 && poolInfo[0] === 0n && poolInfo[1] === 0n)
              }
            >
              {isPending ? 'Confirming...' : 
               isConfirming ? 'Processing...' : 
               isLoading ? 'Swapping...' : 
               (poolInfo && poolInfo.length >= 2 && poolInfo[0] === 0n && poolInfo[1] === 0n) ? 'Pool Not Ready' :
               `Swap ${fromToken} for ${toToken}`}
            </button>
          )}
        </div>

        {!address && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Please connect your wallet to use this feature</span>
          </div>
        )}
      </div>
    </div>
  )
}
