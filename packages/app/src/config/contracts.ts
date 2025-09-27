// Contract addresses for different networks
// Update these addresses after deployment

export interface ContractAddresses {
  wrappedKDA: `0x${string}`
  yieldSplitter: `0x${string}`
  principalToken: `0x${string}`
  yieldToken: `0x${string}`
  diaOracle: `0x${string}`
  mockAMM: `0x${string}`
}

// Kadena EVM Testnet (Chain ID: 5920)
export const KADENA_TESTNET_ADDRESSES: ContractAddresses = {
  // TODO: Update these addresses after deployment
  wrappedKDA: '0x0000000000000000000000000000000000000000',
  yieldSplitter: '0x0000000000000000000000000000000000000000',
  principalToken: '0x0000000000000000000000000000000000000000',
  yieldToken: '0x0000000000000000000000000000000000000000',
  diaOracle: '0x0000000000000000000000000000000000000000',
  mockAMM: '0x0000000000000000000000000000000000000000',
}

// Local Hardhat Network (Chain ID: 31337)
export const LOCAL_ADDRESSES: ContractAddresses = {
  // These will be populated when running local deployment
  wrappedKDA: '0x0000000000000000000000000000000000000000',
  yieldSplitter: '0x0000000000000000000000000000000000000000',
  principalToken: '0x0000000000000000000000000000000000000000',
  yieldToken: '0x0000000000000000000000000000000000000000',
  diaOracle: '0x0000000000000000000000000000000000000000',
  mockAMM: '0x0000000000000000000000000000000000000000',
}

// Get contract addresses based on chain ID
export function getContractAddresses(chainId: number): ContractAddresses {
  switch (chainId) {
    case 5920: // Kadena EVM Testnet
      return KADENA_TESTNET_ADDRESSES
    case 31337: // Local Hardhat
      return LOCAL_ADDRESSES
    default:
      console.warn(`Unsupported chain ID: ${chainId}, falling back to Kadena Testnet`)
      return KADENA_TESTNET_ADDRESSES
  }
}

// Contract ABIs (minimal required functions)
export const YIELD_SPLITTER_ABI = [
  {
    name: 'split',
    type: 'function',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'redeemBeforeMaturity',
    type: 'function',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'redeemPTAfterMaturity',
    type: 'function',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'claimYield',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'yieldAmount', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getUserPosition',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'ptBalance', type: 'uint256' },
      { name: 'ytBalance', type: 'uint256' },
      { name: 'claimableYield', type: 'uint256' }
    ],
    stateMutability: 'view',
  },
  {
    name: 'getContractStats',
    type: 'function',
    inputs: [],
    outputs: [
      { name: 'totalDeposited', type: 'uint256' },
      { name: 'totalYieldDistributed', type: 'uint256' },
      { name: 'maturity', type: 'uint256' },
      { name: 'isExpired', type: 'bool' }
    ],
    stateMutability: 'view',
  },
  {
    name: 'maturity',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

export const WRAPPED_KDA_ABI = [
  {
    name: 'deposit',
    type: 'function',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    name: 'withdraw',
    type: 'function',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
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
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

export const TOKEN_ABI = [
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
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

export const MOCK_AMM_ABI = [
  {
    name: 'swapPTForYT',
    type: 'function',
    inputs: [
      { name: 'ptAmount', type: 'uint256' },
      { name: 'minYTOut', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'swapYTForPT',
    type: 'function',
    inputs: [
      { name: 'ytAmount', type: 'uint256' },
      { name: 'minPTOut', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getSwapQuote',
    type: 'function',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'amountIn', type: 'uint256' }
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'getPTPrice',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'getYTPrice',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const
