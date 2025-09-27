'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'react-hot-toast'

// Contract addresses - update these with your deployed addresses
const MOCK_AMM_ADDRESS = '0x...' as const
const PRINCIPAL_TOKEN_ADDRESS = '0x...' as const
const YIELD_TOKEN_ADDRESS = '0x...' as const

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

  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  // Get token balances
  const { data: ptBalance } = useReadContract({
    address: PRINCIPAL_TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: ytBalance } = useReadContract({
    address: YIELD_TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Get pool info
  const { data: poolInfo } = useReadContract({
    address: MOCK_AMM_ADDRESS,
    abi: MOCK_AMM_ABI,
    functionName: 'getPoolInfo',
  })

  // Get quote for swap
  const { data: quote } = useReadContract({
    address: MOCK_AMM_ADDRESS,
    abi: MOCK_AMM_ABI,
    functionName: fromToken === 'PT' ? 'getQuotePTForYT' : 'getQuoteYTForPT',
    args: fromAmount ? [parseEther(fromAmount)] : undefined,
    query: {
      enabled: !!fromAmount && parseFloat(fromAmount) > 0,
    },
  })

  // Update to amount when quote changes
  useEffect(() => {
    if (quote && fromAmount) {
      setToAmount(formatEther(quote))
    } else {
      setToAmount('')
    }
  }, [quote, fromAmount])

  const handleSwapTokens = () => {
    setFromToken(fromToken === 'PT' ? 'YT' : 'PT')
    setFromAmount(toAmount)
    setToAmount('')
  }

  const handleApprove = async (tokenAddress: string) => {
    try {
      await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'approve',
        args: [MOCK_AMM_ADDRESS, parseEther('1000000')], // Large approval
      })
      toast.success('Approval transaction submitted!')
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
      const minToAmountWei = parseEther(toAmount) * BigInt(10000 - parseInt(slippage) * 100) / BigInt(10000)

      if (fromToken === 'PT') {
        await writeContract({
          address: MOCK_AMM_ADDRESS,
          abi: MOCK_AMM_ABI,
          functionName: 'swapPTForYT',
          args: [fromAmountWei, minToAmountWei],
        })
      } else {
        await writeContract({
          address: MOCK_AMM_ADDRESS,
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
        {poolInfo && (
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
            onClick={handleSwapTokens}
          >
            ↕️
          </button>
        </div>

        {/* To Token */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">To</span>
            <span className="label-text-alt">
              {poolInfo && fromToken === 'PT' ? 
                `1 PT = ${parseFloat(formatEther(poolInfo[2])).toFixed(4)} YT` :
                `1 YT = ${parseFloat(formatEther(poolInfo[3] || 0n)).toFixed(4)} PT`
              }
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

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Approve Button (if needed) */}
          <button
            className="btn btn-outline w-full"
            onClick={() => handleApprove(fromToken === 'PT' ? PRINCIPAL_TOKEN_ADDRESS : YIELD_TOKEN_ADDRESS)}
            disabled={isPending || isConfirming || !address}
          >
            Approve {fromToken}-wKDA
          </button>

          {/* Swap Button */}
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
              parseFloat(fromAmount) <= 0
            }
          >
            {isPending ? 'Confirming...' : 
             isConfirming ? 'Processing...' : 
             isLoading ? 'Swapping...' : 
             `Swap ${fromToken} for ${toToken}`}
          </button>
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
