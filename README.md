# KYM-Finance

**KYM-Finance wraps KDA and splits it into tradable principal and yield tokens to maximize returns.**

![KYM Finance](https://img.shields.io/badge/Kadena-EVM%20Testnet-purple) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## Features

- **Pendle-Style Pricing**: Authentic discount factor formula `PT = Amount × [1/(1+r)^t]`
- **Token Splitting**: Split wKDA into Principal Tokens (PT) and Yield Tokens (YT)
- **AMM Trading**: Swap PT ↔ YT tokens with dynamic pricing
- **Yield Claiming**: Accumulate and claim yield from YT token holdings
- **Kadena Native**: Built specifically for Kadena EVM with optimized gas usage

## Architecture
<img width="6317" height="3829" alt="kym-finance" src="https://github.com/user-attachments/assets/a7f63197-1542-4ebd-bc2e-8c01d9dc2586" />

### Smart Contracts

```
📁 contracts/
├── YieldSplitter.sol      # Core splitting logic with Pendle pricing
├── PrincipalToken.sol     # PT token (ERC20)
├── YieldToken.sol         # YT token (ERC20)
├── WrappedKDA.sol         # wKDA wrapper contract
├── MockAMM.sol           # AMM for PT/YT trading
└── DIAOracle.sol         # Price oracle integration
```

### Frontend Architecture

```
📁 packages/app/src/
├── components/
│   ├── SplitSection.tsx      # wKDA → PT + YT splitting
│   ├── SwapSection.tsx       # PT ↔ YT trading
│   ├── RedeemSection.tsx     # Token redemption & yield claiming
│   ├── DepositSection.tsx    # KDA → wKDA wrapping
│   └── PortfolioOverview.tsx # Portfolio analytics
├── config/
│   └── contracts.ts          # Contract addresses & ABIs
└── context/
    └── Web3.tsx             # Wallet connection & network config
```

## Pendle Pricing Mathematics

### Formula

The protocol implements authentic Pendle Finance pricing:

```solidity
// Discount Factor: DF = 1 / (1 + r)^t
// Where: r = yield percentage, t = time to maturity (years)

function calculatePendlePricing(uint256 amount) public view returns (uint256 ptAmount, uint256 ytAmount) {
    uint256 timeToMaturity = maturity - block.timestamp;
    uint256 yieldRate = (yieldPercentage * PRECISION) / BASIS_POINTS;
    uint256 timeFactor = (timeToMaturity * PRECISION) / SECONDS_PER_YEAR;
    
    // Linear approximation: (1 + r)^t ≈ 1 + r*t
    uint256 discountDenominator = PRECISION + (yieldRate * timeFactor) / PRECISION;
    
    // PT = amount * (1 / (1 + r*t))
    ptAmount = (amount * PRECISION) / discountDenominator;
    
    // YT = amount - PT
    ytAmount = amount - ptAmount;
}
```

### Example Calculation

With **5% APY** and **1 year maturity**:
- **Input**: 1.0 wKDA
- **PT Output**: ~0.9524 wKDA (95.24%)
- **YT Output**: ~0.0476 wKDA (4.76%)
- **Total**: 1.0 wKDA (perfect conservation)

## Deployed Contracts (Kadena EVM Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **WrappedKDA** | `0xF7Bce9D2106773D8d14B17B49FC261EfF52e7d0D` | KDA wrapper token |
| **YieldSplitter** | `0x81485FBD886d262b671F1789FB066366619eA8c7` | Core splitting logic |
| **PrincipalToken** | `0x42b12628cecccE59cB9bB57Ee6Dcc202e439Ca5b` | PT-wKDA token |
| **YieldToken** | `0x176Edfb5EEF281162963cF85E43630d9FC2488A6` | YT-wKDA token |
| **DIAOracle** | `0x6B6564Ab45e49cF5B9AA55486cB72c76351D3b73` | Price oracle |
| **MockAMM** | `0x3aE2a95a17aEdb8B53d0EBa6715336274b098DbF` | PT/YT trading pool |

### Network Details
- **Chain ID**: 5920
- **RPC**: `https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc`
- **Explorer**: `http://chain-20.evm-testnet-blockscout.chainweb.com`

## Installation & Setup

### Prerequisites
- Node.js 18+
- Yarn or npm
- MetaMask or compatible wallet

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/kadena-yield-splitter
cd kadena-yield-splitter

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

Create `.env.local` in `packages/app/`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_SITE_NAME="KYM Finance"
NEXT_PUBLIC_SITE_DESCRIPTION="Pendle-style yield splitting on Kadena"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

## Usage Guide

### 1. Connect Wallet
- Connect MetaMask to Kadena EVM Testnet
- Add network: Chain ID 5920, RPC: `https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc`

### 2. Get Test KDA
- Use Kadena testnet faucet to get test KDA
- Or contact the team for test tokens

### 3. Wrap KDA → wKDA
```typescript
// In Deposit section
1. Enter KDA amount
2. Click "Wrap KDA"
3. Confirm transaction
```

### 4. Split wKDA → PT + YT
```typescript
// In Split section
1. Enter wKDA amount to split
2. Click "Approve wKDA" (first time)
3. Click "Split X wKDA"
4. Receive PT + YT tokens with Pendle pricing
```

### 5. Trade PT ↔ YT
```typescript
// In Swap section
1. Select from token (PT or YT)
2. Enter amount
3. Set yield parameters (auto-filled)
4. Click "Approve" then "Swap"
```

### 6. Claim Yield & Redeem
```typescript
// In Redeem section
1. View accumulated yield from YT tokens
2. Click "Claim Yield" to harvest
3. Redeem PT + YT back to wKDA at maturity
```

## Development & Testing

### Run Local Development

```bash
# Start frontend
cd packages/app
npm run dev

# Compile contracts
cd packages/hardhat
npx hardhat compile

# Run tests
npx hardhat test
```

### Deploy to Kadena Testnet

```bash
cd packages/hardhat

# Deploy all contracts
npx hardhat run scripts/deployToKadena.js --network kadenaTestnet

# Initialize AMM pool
npx hardhat run scripts/setupPoolDemo.js --network kadenaTestnet
```

### Useful Scripts

```bash
# Test Pendle pricing
npx hardhat run scripts/testPendlePricing.js --network kadenaTestnet

# Check pool status
npx hardhat run scripts/checkPool.js --network kadenaTestnet

# Check yield accumulation
npx hardhat run scripts/checkYield.js --network kadenaTestnet
```

## Technical Implementation

### Smart Contract Features

```solidity
contract YieldSplitter {
    // Pendle-style pricing parameters
    uint256 public yieldPercentage; // 500 = 5% APY
    uint256 public constant BASIS_POINTS = 10000;
    
    // Core splitting function
    function depositAndSplit(uint256 amount) external {
        (uint256 ptAmount, uint256 ytAmount) = calculatePendlePricing(amount);
        principalToken.mint(msg.sender, ptAmount);
        yieldToken.mint(msg.sender, ytAmount);
    }
}
```

### Frontend Integration

```typescript
// Contract interaction with proper typing
const { writeContract } = useWriteContract()

const handleSplit = async () => {
  await writeContract({
    address: contracts.yieldSplitter,
    abi: YIELD_SPLITTER_ABI,
    functionName: 'depositAndSplit',
    args: [parseEther(amount)],
  })
}
```

## Deployment

### Vercel Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Environment Variables for Production

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_production_id
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for ETHGlobal Hackathon New Delhi**
