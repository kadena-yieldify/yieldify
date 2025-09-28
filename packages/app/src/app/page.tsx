import Link from 'next/link'
import { Connect } from '@/components/Connect'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300">
      {/* Header */}
      <header className="navbar bg-base-100 shadow-lg">
        <div className="navbar-start">
          <div className="text-xl font-bold">KYM Finance</div>
        </div>
        <div className="navbar-end">
          <Connect />
        </div>
      </header>

      {/* Hero Section */}
      <div className="hero min-h-[80vh]">
        <div className="hero-content text-center">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-6">
              Split KDA,{" "}<span className="text-primary">Maximize Yield</span>
            </h1>
            <p className="text-xl mb-8 opacity-80">
            KYM-Finance wraps KDA and splits it into tradable principal and yield tokens to maximize returns.
            </p>
            
            {/* Feature Cards */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <div className="text-primary font-bold">D</div>
                  </div>
                  <h3 className="card-title text-lg">Deposit</h3>
                  <p className="text-sm opacity-70">Wrap KDA into wKDA for yield splitting</p>
                </div>
              </div>
              
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                  <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                    <div className="text-secondary font-bold">S</div>
                  </div>
                  <h3 className="card-title text-lg">Split</h3>
                  <p className="text-sm opacity-70">Split wKDA into PT and YT tokens</p>
                </div>
              </div>
              
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                    <div className="text-accent font-bold">T</div>
                  </div>
                  <h3 className="card-title text-lg">Swap</h3>
                  <p className="text-sm opacity-70">Trade PT and YT tokens in AMM</p>
                </div>
              </div>
              
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                  <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mb-4">
                    <div className="text-success font-bold">R</div>
                  </div>
                  <h3 className="card-title text-lg">Redeem</h3>
                  <p className="text-sm opacity-70">Claim yield and redeem tokens</p>
                </div>
              </div>
            </div> */}

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/deposit" className="btn btn-primary btn-lg">
                Start Depositing
              </Link>
              <Link href="/split" className="btn btn-outline btn-lg">
                Split Tokens
              </Link>
              <Link href="/swap" className="btn btn-outline btn-lg">
                Trade Now
              </Link>
              <Link href="/redeem" className="btn btn-outline btn-lg">
                Redeem & Claim
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
