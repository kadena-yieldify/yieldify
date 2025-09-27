# Kadena Yield Splitter - Deployment Guide

## 🚀 Quick Start

This is a Pendle Finance-inspired yield splitting MVP built for the ETH Global hackathon on Kadena blockchain.

### Features
- **Deposit**: Wrap KDA → wKDA (1:1 ratio)
- **Split**: wKDA → PT-wKDA + YT-wKDA (yield splitting)
- **Swap**: Trade PT ↔ YT tokens via mock AMM
- **Redeem**: Claim yield and redeem tokens back to wKDA

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Git
- MetaMask or compatible wallet
- Some test ETH for gas fees

## 🛠 Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd kadena-yield-splitter
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

Create `.env` files in both packages:

**packages/hardhat/.env**
```env
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_key_here
ETHERSCAN_API_KEY=your_etherscan_key_here
```

**packages/app/.env.local**
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key_here
```

## 🔧 Smart Contract Deployment

### 1. Compile Contracts
```bash
cd packages/hardhat
npx hardhat compile
```

### 2. Run Tests
```bash
npx hardhat test
```

### 3. Deploy to Local Network
```bash
# Start local node
npx hardhat node

# Deploy contracts (in another terminal)
npx hardhat ignition deploy ignition/modules/YieldSplittingSystem.ts --network localhost
```

### 4. Deploy to Testnet
```bash
# Deploy to Sepolia testnet
npx hardhat ignition deploy ignition/modules/YieldSplittingSystem.ts --network sepolia
```

### 5. Deploy MockAMM Separately
After YieldSplitter deployment, get the PT and YT addresses and deploy MockAMM:

```bash
# Update the addresses in the deployment script
npx hardhat run scripts/deployMockAMM.js --network sepolia
```

## 🎨 Frontend Setup

### 1. Update Contract Addresses

After deployment, update the contract addresses in the frontend components:

**Files to update:**
- `packages/app/src/components/DepositSection.tsx`
- `packages/app/src/components/SplitSection.tsx`
- `packages/app/src/components/SwapSection.tsx`
- `packages/app/src/components/RedeemSection.tsx`
- `packages/app/src/components/YieldSplittingDashboard.tsx`
- `packages/app/src/components/PriceChart.tsx`

Replace `'0x...'` with your actual deployed contract addresses.

### 2. Start Development Server
```bash
cd packages/app
npm run dev
```

The app will be available at `http://localhost:3000`

## 📝 Contract Addresses (Update After Deployment)

```typescript
// Update these addresses in your frontend components
const WRAPPED_KDA_ADDRESS = '0x...' // WrappedKDA contract
const YIELD_SPLITTER_ADDRESS = '0x...' // YieldSplitter contract  
const PRINCIPAL_TOKEN_ADDRESS = '0x...' // PT-wKDA contract (auto-deployed)
const YIELD_TOKEN_ADDRESS = '0x...' // YT-wKDA contract (auto-deployed)
const MOCK_AMM_ADDRESS = '0x...' // MockAMM contract
const DIA_ORACLE_ADDRESS = '0x...' // DIAOracle contract
```

## 🧪 Testing the Application

### 1. Wrap KDA
- Connect your wallet
- Go to "Deposit" tab
- Enter KDA amount and click "Wrap KDA → wKDA"

### 2. Split Tokens
- Go to "Split" tab
- Enter wKDA amount
- Approve wKDA spending
- Click "Split wKDA into PT + YT"

### 3. Trade Tokens
- Go to "Swap" tab
- Select PT → YT or YT → PT
- Enter amount and execute swap

### 4. Claim Yield & Redeem
- Go to "Redeem" tab
- Claim accumulated yield from YT tokens
- Redeem PT+YT back to wKDA (before maturity)
- Or redeem PT individually (after maturity)

## 🏗 Architecture Overview

### Smart Contracts
1. **WrappedKDA.sol** - ERC20 wrapper for native KDA
2. **PrincipalToken.sol** - PT-wKDA token representing principal
3. **YieldToken.sol** - YT-wKDA token representing yield rights
4. **YieldSplitter.sol** - Main contract orchestrating the splitting logic
5. **MockAMM.sol** - Simple AMM for PT/YT token swapping
6. **DIAOracle.sol** - Price feed oracle (mock implementation)

### Frontend Components
- **YieldSplittingDashboard** - Main dashboard with tabs
- **DepositSection** - KDA wrapping functionality
- **SplitSection** - Token splitting interface
- **SwapSection** - AMM trading interface
- **RedeemSection** - Yield claiming and redemption
- **PortfolioOverview** - User's asset breakdown
- **PriceChart** - Price visualization and metrics

## 🔍 Key Features

### Yield Splitting Mechanism
- Deposit wKDA → Get PT + YT tokens (1:1 ratio)
- PT tokens: Redeemable for wKDA at maturity
- YT tokens: Earn yield over time (~5% APY)

### Mock AMM
- Constant product formula (x * y = k)
- 0.3% trading fee
- Slippage protection
- Real-time price quotes

### Oracle Integration
- DIA Oracle interface for price feeds
- PT/YT ratio calculations
- Implied yield rate computation
- Mock price data for demonstration

## 🚨 Important Notes

### For Hackathon Demo
- This is an MVP with simplified mechanics
- Uses mock yield generation (5% APY)
- AMM has basic functionality
- Oracle uses mock price data

### Security Considerations
- Contracts include reentrancy guards
- Access controls for admin functions
- Input validation and error handling
- Emergency recovery functions

### Limitations
- Mock yield generation (not real staking)
- Simplified AMM (no liquidity mining)
- Basic oracle (not production-ready)
- Limited to single asset (wKDA)

## 📊 Demo Data

The contracts are pre-configured with:
- 1 year maturity period
- 5% annual yield rate
- Mock KDA price: $0.50
- Mock PT price: $0.48 (4% discount)
- Mock YT price: $0.02 (yield component)

## 🎯 Hackathon Judging Points

### Innovation
- Novel yield splitting mechanism on Kadena
- Pendle Finance-inspired architecture
- Integrated AMM for secondary trading

### Technical Excellence
- Comprehensive smart contract suite
- Modern React frontend with Web3 integration
- Proper testing and documentation

### User Experience
- Intuitive dashboard design
- Real-time portfolio tracking
- Educational tooltips and guides

### Completeness
- Full end-to-end functionality
- All 4 core features implemented
- Ready for live demonstration

## 🤝 Contributing

This project was built for ETH Global hackathon. For improvements or bug fixes:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for ETH Global Hackathon**

*Bringing Pendle Finance's yield splitting innovation to the Kadena ecosystem*
