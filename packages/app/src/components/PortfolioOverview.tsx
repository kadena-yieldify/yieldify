'use client'

import { formatEther } from 'viem'

interface Balance {
  value: bigint
  decimals: number
  symbol: string
}

interface PortfolioOverviewProps {
  userPosition?: readonly [bigint, bigint, bigint] // [ptBalance, ytBalance, claimableYield]
  kdaBalance?: Balance
  wkdaBalance?: Balance
}

export function PortfolioOverview({ userPosition, kdaBalance, wkdaBalance }: PortfolioOverviewProps) {
  const ptBalance = userPosition ? userPosition[0] : 0n
  const ytBalance = userPosition ? userPosition[1] : 0n
  const claimableYield = userPosition ? userPosition[2] : 0n

  const totalPortfolioValue = () => {
    const kda = kdaBalance ? parseFloat(formatEther(kdaBalance.value)) : 0
    const wkda = wkdaBalance ? parseFloat(formatEther(wkdaBalance.value)) : 0
    const pt = parseFloat(formatEther(ptBalance))
    const yt = parseFloat(formatEther(ytBalance))
    const yield_ = parseFloat(formatEther(claimableYield))
    
    return kda + wkda + pt + yt + yield_
  }

  const portfolioValue = totalPortfolioValue()

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-lg flex items-center gap-2">
          <span className="text-xl"></span>
          Portfolio Overview
        </h3>

        {/* Total Portfolio Value */}
        <div className="stat bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg mb-4">
          <div className="stat-title">Total Portfolio Value</div>
          <div className="stat-value text-2xl">{portfolioValue.toFixed(4)}</div>
          <div className="stat-desc">KDA equivalent</div>
        </div>

        {/* Asset Breakdown */}
        <div className="space-y-3">
          {/* Native KDA */}
          <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              <span className="font-medium">KDA</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {kdaBalance ? parseFloat(formatEther(kdaBalance.value)).toFixed(4) : '0.0000'}
              </div>
              <div className="text-xs opacity-70">Native</div>
            </div>
          </div>

          {/* Wrapped KDA */}
          <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-info rounded-full"></div>
              <span className="font-medium">wKDA</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {wkdaBalance ? parseFloat(formatEther(wkdaBalance.value)).toFixed(4) : '0.0000'}
              </div>
              <div className="text-xs opacity-70">Wrapped</div>
            </div>
          </div>

          {/* Principal Tokens */}
          <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="font-medium">PT-wKDA</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {parseFloat(formatEther(ptBalance)).toFixed(4)}
              </div>
              <div className="text-xs opacity-70">Principal</div>
            </div>
          </div>

          {/* Yield Tokens */}
          <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
              <span className="font-medium">YT-wKDA</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {parseFloat(formatEther(ytBalance)).toFixed(4)}
              </div>
              <div className="text-xs opacity-70">Yield</div>
            </div>
          </div>

          {/* Claimable Yield */}
          {claimableYield > 0n && (
            <div className="flex justify-between items-center p-3 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                <span className="font-medium text-success">Claimable Yield</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-success">
                  {parseFloat(formatEther(claimableYield)).toFixed(6)}
                </div>
                <div className="text-xs opacity-70">Ready to claim</div>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Allocation Chart */}
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Asset Allocation</div>
          <div className="w-full bg-base-200 rounded-full h-3 overflow-hidden">
            {portfolioValue > 0 && (
              <div className="h-full flex">
                {kdaBalance && kdaBalance.value > 0n && (
                  <div 
                    className="bg-accent h-full"
                    style={{ 
                      width: `${(parseFloat(formatEther(kdaBalance.value)) / portfolioValue * 100)}%` 
                    }}
                  ></div>
                )}
                {wkdaBalance && wkdaBalance.value > 0n && (
                  <div 
                    className="bg-info h-full"
                    style={{ 
                      width: `${(parseFloat(formatEther(wkdaBalance.value)) / portfolioValue * 100)}%` 
                    }}
                  ></div>
                )}
                {ptBalance > 0n && (
                  <div 
                    className="bg-primary h-full"
                    style={{ 
                      width: `${(parseFloat(formatEther(ptBalance)) / portfolioValue * 100)}%` 
                    }}
                  ></div>
                )}
                {ytBalance > 0n && (
                  <div 
                    className="bg-secondary h-full"
                    style={{ 
                      width: `${(parseFloat(formatEther(ytBalance)) / portfolioValue * 100)}%` 
                    }}
                  ></div>
                )}
                {claimableYield > 0n && (
                  <div 
                    className="bg-success h-full"
                    style={{ 
                      width: `${(parseFloat(formatEther(claimableYield)) / portfolioValue * 100)}%` 
                    }}
                  ></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div className="stat bg-base-200 rounded p-2">
            <div className="stat-title text-xs">Yield Earning</div>
            <div className="stat-value text-sm">
              {parseFloat(formatEther(ytBalance)).toFixed(2)}
            </div>
          </div>
          <div className="stat bg-base-200 rounded p-2">
            <div className="stat-title text-xs">Principal Protected</div>
            <div className="stat-value text-sm">
              {parseFloat(formatEther(ptBalance)).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {portfolioValue === 0 && (
          <div className="text-center py-8 opacity-50">
            <div className="text-4xl mb-2">🌱</div>
            <div className="text-sm">No assets yet</div>
            <div className="text-xs">Start by wrapping some KDA</div>
          </div>
        )}
      </div>
    </div>
  )
}
