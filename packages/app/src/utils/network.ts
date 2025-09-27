import { mainnet, arbitrum, base, polygon, optimism } from '@reown/appkit/networks'
import { sepolia } from '@reown/appkit/networks'

// Kadena EVM Testnet configuration (Chain 20)
// Using the same structure as other networks to avoid TypeScript issues
export const kadenaTestnet = {
  id: 5920,
  name: 'Kadena EVM Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Kadena',
    symbol: 'KDA',
  },
  rpcUrls: {
    default: {
      http: ['https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc'],
    },
    public: {
      http: ['https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Kadena Chain 20 Explorer',
      url: 'http://chain-20.evm-testnet-blockscout.chainweb.com',
    },
  },
  testnet: true,
} as const

export const ETH_CHAINS = [kadenaTestnet, mainnet, arbitrum, base, polygon, optimism, sepolia]

export const NETWORK_COLORS = {
  kadena: {
    color: 'emerald',
    bgVariant: 'bg-emerald-600',
  },
  ethereum: {
    color: 'green',
    bgVariant: 'bg-green-600',
  },
  arbitrum: {
    color: 'sky',
    bgVariant: 'bg-sky-600',
  },
  base: {
    color: 'blue',
    bgVariant: 'bg-blue-600',
  },
  linea: {
    color: 'slate',
    bgVariant: 'bg-slate-600',
  },
  polygon: {
    color: 'purple',
    bgVariant: 'bg-purple-600',
  },
  optimism: {
    color: 'red',
    bgVariant: 'bg-red-600',
  },
  scroll: {
    color: 'amber',
    bgVariant: 'bg-amber-600',
  },
  other: {
    color: 'gray',
    bgVariant: 'bg-gray-600',
  },
}

export function GetNetworkColor(chain?: string, type: 'color' | 'bgVariant' = 'color') {
  chain = chain?.toLocaleLowerCase()
  if (chain?.includes('kadena')) return NETWORK_COLORS.kadena[type]
  if (chain === 'ethereum' || chain === 'mainnet' || chain === 'homestead') return NETWORK_COLORS.ethereum[type]
  if (chain?.includes('arbitrum')) return NETWORK_COLORS.arbitrum[type]
  if (chain?.includes('base')) return NETWORK_COLORS.base[type]
  if (chain?.includes('linea')) return NETWORK_COLORS.linea[type]
  if (chain?.includes('polygon') || chain?.includes('matic')) return NETWORK_COLORS.polygon[type]
  if (chain?.includes('optimism') || chain?.startsWith('op')) return NETWORK_COLORS.optimism[type]
  if (chain?.includes('scroll')) return NETWORK_COLORS.scroll[type]

  return NETWORK_COLORS.other[type]
}
