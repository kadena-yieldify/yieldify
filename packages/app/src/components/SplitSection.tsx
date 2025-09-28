'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useBalance, useAccount, useChainId, useReadContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'react-hot-toast'
import { getContractAddresses, YIELD_SPLITTER_ABI, WRAPPED_KDA_ABI, TOKEN_ABI } from '../config/contracts'


export function SplitSection() {
  const [splitAmount, setSplitAmount] = useState('')
  const [isApproving, setIsApproving] = useState(false)

  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  // Get contract addresses for current chain
  const contracts = getContractAddresses(chainId)

  // Get wKDA balance
  const { data: wkdaBalance, refetch: refetchWkdaBalance } = useBalance({
    address,
    token: contracts.wrappedKDA,
  })

  // Get PT and YT balances to show after split
  const { data: ptBalance, refetch: refetchPtBalance, error: ptError } = useReadContract({
    address: contracts.principalToken,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: ytBalance, refetch: refetchYtBalance, error: ytError } = useReadContract({
    address: contracts.yieldToken,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Check current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.wrappedKDA,
    abi: WRAPPED_KDA_ABI,
    functionName: 'allowance',
    args: address ? [address, contracts.yieldSplitter] : undefined,
  })

  // Check if we have sufficient allowance
  const requiredAmount = splitAmount ? parseEther(splitAmount) : 0n
  const hasSufficientAllowance = currentAllowance && splitAmount ? 
    currentAllowance >= requiredAmount : false

  // Debug logging
  console.log('Contract addresses:', contracts)
  console.log('PT Balance:', ptBalance, 'Error:', ptError)
  console.log('YT Balance:', ytBalance, 'Error:', ytError)
  console.log('wKDA Balance:', wkdaBalance)
  console.log('Split Amount:', splitAmount)
  console.log('Required Amount (wei):', requiredAmount.toString())
  console.log('Current Allowance (wei):', currentAllowance?.toString())
  console.log('Has Sufficient:', hasSufficientAllowance)

  // Handle transaction completion
  useEffect(() => {
    if (isConfirming === false && hash) {
      // Transaction completed, refresh all balances and allowance
      refetchWkdaBalance()
      refetchPtBalance()
      refetchYtBalance()
      refetchAllowance()
      
      // Reset form state
      setSplitAmount('')
      setIsApproving(false)
      
      toast.success('Transaction completed successfully!')
    }
  }, [isConfirming, hash, refetchWkdaBalance, refetchPtBalance, refetchYtBalance, refetchAllowance])

  const handleApprove = async () => {
    if (!splitAmount || parseFloat(splitAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      setIsApproving(true)
      await writeContract({
        address: contracts.wrappedKDA,
        abi: WRAPPED_KDA_ABI,
        functionName: 'approve',
        args: [contracts.yieldSplitter, parseEther(splitAmount)],
      })
      
      toast.success('Approval transaction submitted!')
      // Don't set approved here - wait for transaction confirmation
    } catch (error) {
      console.error('Approval failed:', error)
      toast.error('Approval failed. Please try again.')
      setIsApproving(false)
    }
  }

  const handleSplit = async () => {
    if (!splitAmount || parseFloat(splitAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await writeContract({
        address: contracts.yieldSplitter,
        abi: YIELD_SPLITTER_ABI,
        functionName: 'depositAndSplit',
        args: [parseEther(splitAmount)],
      })
      
      toast.success('Split transaction submitted!')
      // Don't reset here - let useEffect handle it after confirmation
    } catch (error) {
      console.error('Split failed:', error)
      toast.error('Split failed. Please try again.')
    }
  }

  const setMaxAmount = () => {
    if (wkdaBalance) {
      setSplitAmount(formatEther(wkdaBalance.value))
    }
  }

  // Pendle-style pricing calculation
  const yieldPercent = 5 // 5% APY (could be made configurable)
  const maturityYears = 1 // 1 year (could get from contract stats)
  
  const calculatePendlePricing = (amount: number) => {
    if (!amount) return { pt: 0, yt: 0 }
    
    const r = yieldPercent / 100 // Convert percentage to decimal
    const t = maturityYears
    const discountFactor = 1 / Math.pow(1 + r, t) // DF = 1/(1+r)^t
    
    const ptAmount = amount * discountFactor // PT gets discounted value
    const ytAmount = amount - ptAmount // YT gets remaining value
    
    return { pt: ptAmount, yt: ytAmount }
  }
  
  const pricing = calculatePendlePricing(splitAmount ? parseFloat(splitAmount) : 0)
  const expectedPT = pricing.pt
  const expectedYT = pricing.yt

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <span className="text-2xl"></span>
          Split wKDA into PT + YT
        </h2>
        
        <div className="alert alert-info mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <div className="font-bold">How it works:</div>
            <div className="text-sm">
              Split your wKDA using Pendle-style pricing: PT = Amount × [1/(1+r)^t], YT = Amount - PT.
              PT trades at discount (~95.2% of face value), YT captures yield premium (~4.8%).
            </div>
          </div>
        </div>

        {/* Balance Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">wKDA Balance</div>
            <div className="stat-value text-lg">
              {wkdaBalance ? parseFloat(formatEther(wkdaBalance.value)).toFixed(4) : '0.0000'}
            </div>
            <div className="stat-desc text-xs">
              {contracts.wrappedKDA.slice(0, 8)}...
            </div>
          </div>
          
          <div className="stat bg-primary/10 rounded-lg">
            <div className="stat-title">PT-wKDA Balance</div>
            <div className="stat-value text-lg text-primary">
              {ptBalance ? parseFloat(formatEther(ptBalance)).toFixed(4) : '0.0000'}
            </div>
            <div className="stat-desc text-xs">
              {ptError ? '❌ Error' : contracts.principalToken.slice(0, 8) + '...'}
            </div>
          </div>
          
          <div className="stat bg-secondary/10 rounded-lg">
            <div className="stat-title">YT-wKDA Balance</div>
            <div className="stat-value text-lg text-secondary">
              {ytBalance ? parseFloat(formatEther(ytBalance)).toFixed(4) : '0.0000'}
            </div>
            <div className="stat-desc text-xs">
              {ytError ? '❌ Error' : contracts.yieldToken.slice(0, 8) + '...'}
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {(ptError || ytError) && (
          <div className="alert alert-error mb-4">
            <span>Contract call errors detected. Check console for details.</span>
          </div>
        )}

        {/* Input Section */}
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Amount to Split (wKDA)</span>
            <button 
              className="label-text-alt link link-hover"
              onClick={setMaxAmount}
            >
              Max
            </button>
          </label>
          <input
            type="number"
            placeholder="0.0"
            className="input input-bordered"
            value={splitAmount}
            onChange={(e) => setSplitAmount(e.target.value)}
            step="0.0001"
            min="0"
          />
        </div>

        {/* Split Preview */}
        {splitAmount && parseFloat(splitAmount) > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="card bg-primary/10 border border-primary/20">
              <div className="card-body p-4">
                <h4 className="font-semibold text-primary">Principal Tokens (PT)</h4>
                <div className="text-2xl font-bold">{expectedPT.toFixed(4)}</div>
                <div className="text-sm opacity-70">
                  Redeemable 1:1 for wKDA at maturity
                </div>
              </div>
            </div>
            
            <div className="card bg-secondary/10 border border-secondary/20">
              <div className="card-body p-4">
                <h4 className="font-semibold text-secondary">Yield Tokens (YT)</h4>
                <div className="text-2xl font-bold">{expectedYT.toFixed(4)}</div>
                <div className="text-sm opacity-70">
                  Earns yield until maturity (~5% APY)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Yield Projection */}
        {splitAmount && parseFloat(splitAmount) > 0 && (
          <div className="alert alert-success mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-bold">Pendle-Style Pricing Breakdown</div>
              <div>
                PT Discount: {((1 - (expectedPT / (splitAmount ? parseFloat(splitAmount) : 1))) * 100).toFixed(1)}% 
                | YT Premium: {((expectedYT / (splitAmount ? parseFloat(splitAmount) : 1)) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!hasSufficientAllowance ? (
            <button
              className="btn btn-outline w-full"
              onClick={handleApprove}
              disabled={!splitAmount || isPending || isConfirming || isApproving || !address}
            >
              {isPending || isConfirming || isApproving ? 'Processing...' : 'Approve wKDA'}
            </button>
          ) : (
            <button
              className="btn btn-primary w-full"
              onClick={handleSplit}
              disabled={
                !splitAmount || 
                isPending || 
                isConfirming || 
                isApproving ||
                !address ||
                parseFloat(splitAmount) <= 0
              }
            >
              {isPending || isConfirming ? 'Processing...' : 
               `Split ${splitAmount || '0'} wKDA`}
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

        {/* Educational Info */}
        <div className="collapse collapse-arrow bg-base-200 mt-4">
          <input type="checkbox" /> 
          <div className="collapse-title text-sm font-medium">
            💡 Learn more about yield splitting
          </div>
          <div className="collapse-content text-sm"> 
            <div className="space-y-2">
              <p><strong>Principal Tokens (PT):</strong> Represent your original deposit. Can be redeemed 1:1 for wKDA when the contract matures.</p>
              <p><strong>Yield Tokens (YT):</strong> Represent the yield-earning rights. Accumulate yield over time based on the underlying asset&apos;s performance.</p>
              <p><strong>Benefits:</strong> Trade yield separately from principal, optimize your risk/reward profile, or combine both for maximum returns.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
