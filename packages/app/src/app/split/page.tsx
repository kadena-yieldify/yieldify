'use client'

import React from 'react'
import Link from 'next/link'
import { Connect } from '@/components/Connect'
import { SplitSection } from '@/components/SplitSection'
import { PortfolioOverview } from '@/components/PortfolioOverview'
import { useAccount, useChainId, useBalance, useReadContract } from 'wagmi'
import { getContractAddresses, YIELD_SPLITTER_ABI } from '@/config/contracts'

export default function SplitPage() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contracts = getContractAddresses(chainId)

  // Get balances
  const { data: kdaBalance } = useBalance({
    address: address,
  })

  const { data: wkdaBalance } = useBalance({
    address: address,
    token: contracts.wrappedKDA,
  })

  // Get user position
  const { data: userPosition } = useReadContract({
    address: contracts.yieldSplitter,
    abi: YIELD_SPLITTER_ABI,
    functionName: 'getUserPosition',
    args: address ? [address] : undefined,
  })

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="navbar bg-base-100 shadow-lg">
        <div className="navbar-start">
          <Link href="/" className="text-xl font-bold">KYM Finance</Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <div className="tabs tabs-boxed">
            <Link href="/deposit" className="tab">
              Deposit
            </Link>
            <Link href="/split" className="tab tab-active">
              Split
            </Link>
            <Link href="/swap" className="tab">
              Swap
            </Link>
            <Link href="/redeem" className="tab">
              Redeem
            </Link>
          </div>
        </div>
        <div className="navbar-end">
          <Connect />
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Split Tokens</h1>
              <p className="text-base-content/70">Split your wKDA into Principal Tokens (PT) and Yield Tokens (YT)</p>
            </div>
            <SplitSection />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PortfolioOverview 
              userPosition={userPosition as readonly [bigint, bigint, bigint] | undefined}
              kdaBalance={kdaBalance}
              wkdaBalance={wkdaBalance}
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="btm-nav lg:hidden">
        <Link href="/deposit">
          <span className="btm-nav-label">Deposit</span>
        </Link>
        <Link href="/split" className="active">
          <span className="btm-nav-label">Split</span>
        </Link>
        <Link href="/swap">
          <span className="btm-nav-label">Swap</span>
        </Link>
        <Link href="/redeem">
          <span className="btm-nav-label">Redeem</span>
        </Link>
      </div>
    </div>
  )
}
