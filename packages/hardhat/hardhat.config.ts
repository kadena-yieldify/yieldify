import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox-viem'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'
import '@nomicfoundation/hardhat-verify'
import '@typechain/hardhat'
import { CONFIG } from './utils/config'

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.17', // Updated to match our contracts
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
    alwaysGenerateOverloads: false,
    externalArtifacts: ['externalArtifacts/*.json'],
  },
  defaultNetwork: 'hardhat',
  etherscan: {
    apiKey: {
      mainnet: CONFIG.ETHERSCAN_API_KEY || 'dummy',
      sepolia: CONFIG.ETHERSCAN_API_KEY || 'dummy',
      optimisticEthereum: CONFIG.OPTIMISTIC_API_KEY || 'dummy',
      kadenaTestnet: 'dummy', // Kadena doesn't use Etherscan
    },
  },
  sourcify: {
    enabled: true,
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
      url: 'http://127.0.0.1:8545',
    },
    // Kadena EVM Testnet Chain 20
    kadenaTestnet: {
      chainId: 5920,
      url: 'https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc',
      accounts: CONFIG.DEPLOYER_KEY ? [CONFIG.DEPLOYER_KEY] : [],
      gasPrice: 'auto',
      gas: 'auto',
    },
    // Keep other networks for testing purposes
    sepolia: {
      chainId: 11155111,
      url: 'https://rpc.sepolia.org/',
      accounts: CONFIG.DEPLOYER_KEY ? [CONFIG.DEPLOYER_KEY] : [],
    },
    mainnet: {
      chainId: 1,
      url: `https://mainnet.infura.io/v3/${CONFIG.INFURA_API_KEY}`,
      accounts: CONFIG.DEPLOYER_KEY ? [CONFIG.DEPLOYER_KEY] : [],
    },
  },
}

export default config
