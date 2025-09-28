import React from 'react'
import { LinkComponent } from './LinkComponent'
import { Connect } from './Connect'

interface HeaderProps {
  activeTab?: string
  setActiveTab?: (tab: string) => void
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="navbar bg-base-100 shadow-lg">
      <div className="navbar-start">
        <LinkComponent href='/'>
          <div className="text-xl font-bold">KYM Finance</div>
        </LinkComponent>
      </div>
      
      {setActiveTab && (
        <div className="navbar-center hidden lg:flex">
          <div className="tabs tabs-boxed">
            <button 
              className={`tab ${activeTab === 'deposit' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('deposit')}
            >
              Deposit
            </button>
            <button 
              className={`tab ${activeTab === 'split' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('split')}
            >
              Split
            </button>
            <button 
              className={`tab ${activeTab === 'swap' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('swap')}
            >
              Swap
            </button>
            <button 
              className={`tab ${activeTab === 'redeem' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('redeem')}
            >
              Redeem
            </button>
          </div>
        </div>
      )}
      
      <div className="navbar-end">
        <Connect />
      </div>
    </header>
  )
}
