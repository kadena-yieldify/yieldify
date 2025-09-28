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
              Split Your Yield, <span className="text-primary">Maximize Returns</span>
            </h1>
            <p className="text-xl mb-8 opacity-80">
              A Pendle Finance-inspired yield splitting protocol on Kadena. 
              Transform your yield-bearing assets into tradeable Principal Tokens (PT) and Yield Tokens (YT).
            </p>
            
            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
            </div>

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


      {/* Features Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose KYM Finance?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Pendle-Style Pricing</h3>
                <p>Authentic discount factor formula with PT = Amount × [1/(1+r)^t] for precise yield calculations.</p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Kadena Native</h3>
                <p>Built specifically for Kadena EVM with optimized gas usage and seamless integration.</p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Professional DeFi</h3>
                <p>Industry-standard sequential button flows and real-time analytics for optimal user experience.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-200 text-base-content">
        <div>
          <div className="text-xl font-bold">KYM Finance</div>
          <p>Transforming yield farming on Kadena, one split at a time</p>
          <p className="opacity-60">Built for ETHGlobal hackathon</p>
        </div>
      </footer>
    </div>
  )
}
