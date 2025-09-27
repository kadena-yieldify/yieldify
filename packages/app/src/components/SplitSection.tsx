'use client'

import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useBalance, useAccount } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'react-hot-toast'

// Contract addresses - update with deployed addresses
const YIELD_SPLITTER_ADDRESS = '0x...' as const
const WRAPPED_KDA_ADDRESS = '0x...' as const

const YIELD_SPLITTER_ABI = [
  {
    name: 'depositAndSplit',
    type: 'function',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

const TOKEN_ABI = [
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

export function SplitSection() {
  const [splitAmount, setSplitAmount] = useState('')
  const [isApproved, setIsApproved] = useState(false)

  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  // Get wKDA balance
  const { data: wkdaBalance } = useBalance({
    address: address,
    token: WRAPPED_KDA_ADDRESS,
  })

  const handleApprove = async () => {
    if (!splitAmount || parseFloat(splitAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await writeContract({
        address: WRAPPED_KDA_ADDRESS,
        abi: TOKEN_ABI,
        functionName: 'approve',
        args: [YIELD_SPLITTER_ADDRESS, parseEther(splitAmount)],
      })
      
      toast.success('Approval transaction submitted!')
      setIsApproved(true)
    } catch (error) {
      console.error('Approval failed:', error)
      toast.error('Approval failed. Please try again.')
    }
  }

  const handleSplit = async () => {
    if (!splitAmount || parseFloat(splitAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await writeContract({
        address: YIELD_SPLITTER_ADDRESS,
        abi: YIELD_SPLITTER_ABI,
        functionName: 'depositAndSplit',
        args: [parseEther(splitAmount)],
      })
      
      toast.success('Split transaction submitted!')
      setSplitAmount('')
      setIsApproved(false)
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

  const expectedPT = splitAmount ? parseFloat(splitAmount) : 0
  const expectedYT = splitAmount ? parseFloat(splitAmount) : 0

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <span className="text-2xl">✂️</span>
          Split wKDA into PT + YT
        </h2>
        
        <div className="alert alert-info mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <div className="font-bold">How it works:</div>
            <div className="text-sm">
              Split your wKDA into Principal Tokens (PT) and Yield Tokens (YT) at 1:1 ratio.
              PT can be redeemed for wKDA at maturity, YT earns yield over time.
            </div>
          </div>
        </div>

        {/* Balance Display */}
        <div className="stat bg-base-200 rounded-lg mb-4">
          <div className="stat-title">wKDA Balance</div>
          <div className="stat-value text-lg">
            {wkdaBalance ? parseFloat(formatEther(wkdaBalance.value)).toFixed(4) : '0.0000'}
          </div>
        </div>

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
              <div className="font-bold">Projected Annual Yield</div>
              <div>
                ~{(expectedYT * 0.05).toFixed(4)} wKDA per year from YT tokens
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!isApproved && (
            <button
              className="btn btn-outline w-full"
              onClick={handleApprove}
              disabled={!splitAmount || isPending || isConfirming || !address}
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Approve wKDA'}
            </button>
          )}

          <button
            className="btn btn-primary w-full"
            onClick={handleSplit}
            disabled={
              !splitAmount || 
              !isApproved ||
              isPending || 
              isConfirming || 
              !address ||
              parseFloat(splitAmount) <= 0
            }
          >
            {isPending ? 'Confirming...' : 
             isConfirming ? 'Processing...' : 
             `Split ${splitAmount || '0'} wKDA`}
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

        {/* Educational Info */}
        <div className="collapse collapse-arrow bg-base-200 mt-4">
          <input type="checkbox" /> 
          <div className="collapse-title text-sm font-medium">
            💡 Learn more about yield splitting
          </div>
          <div className="collapse-content text-sm"> 
            <div className="space-y-2">
              <p><strong>Principal Tokens (PT):</strong> Represent your original deposit. Can be redeemed 1:1 for wKDA when the contract matures.</p>
              <p><strong>Yield Tokens (YT):</strong> Represent the yield-earning rights. Accumulate yield over time based on the underlying asset's performance.</p>
              <p><strong>Benefits:</strong> Trade yield separately from principal, optimize your risk/reward profile, or combine both for maximum returns.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
