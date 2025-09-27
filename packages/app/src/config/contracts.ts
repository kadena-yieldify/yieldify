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

// Kadena EVM Testnet (Chain ID: 5920) - Deployed Addresses
export const KADENA_TESTNET_ADDRESSES: ContractAddresses = {
  wrappedKDA: '0xF7Bce9D2106773D8d14B17B49FC261EfF52e7d0D',
  yieldSplitter: '0x81485FBD886d262b671F1789FB066366619eA8c7',
  principalToken: '0x42b12628cecccE59cB9bB57Ee6Dcc202e439Ca5b',
  yieldToken: '0x176Edfb5EEF281162963cF85E43630d9FC2488A6',
  diaOracle: '0x6B6564Ab45e49cF5B9AA55486cB72c76351D3b73',
  mockAMM: '0x3aE2a95a17aEdb8B53d0EBa6715336274b098DbF',
} as const

// Local Hardhat Network (Chain ID: 31337)
export const LOCAL_ADDRESSES: ContractAddresses = {
  // Deployed contract addresses from local deployment
  wrappedKDA: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  yieldSplitter: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  principalToken: '0x75537828f2ce51be7289709686A69CbFDbB714F1',
  yieldToken: '0xE451980132E65465d0a498c53f0b5227326Dd73F',
  diaOracle: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  mockAMM: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
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
    name: 'depositAndSplit',
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
  {
    name: 'calculatePendlePricing',
    type: 'function',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [
      { name: 'ptAmount', type: 'uint256' },
      { name: 'ytAmount', type: 'uint256' }
    ],
    stateMutability: 'view',
  },
  {
    name: 'yieldPercentage',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
]

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
