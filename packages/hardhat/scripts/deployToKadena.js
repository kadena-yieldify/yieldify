const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Kadena Yield Splitter to Kadena EVM Testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "KDA");
  
  if (balance < ethers.parseEther("0.1")) {
    console.warn("⚠️  Low balance! You might need more KDA for deployment");
  }

  console.log("\n📋 Deployment Plan:");
  console.log("1. WrappedKDA");
  console.log("2. YieldSplitter (auto-deploys PT and YT)");
  console.log("3. DIAOracle");
  console.log("4. MockAMM (separate script)");

  // 1. Deploy WrappedKDA
  console.log("\n💎 Step 1: Deploying WrappedKDA...");
  const WrappedKDA = await ethers.getContractFactory("WrappedKDA");
  const wrappedKDA = await WrappedKDA.deploy();
  await wrappedKDA.waitForDeployment();
  const wrappedKDAAddress = await wrappedKDA.getAddress();
  console.log("✅ WrappedKDA deployed to:", wrappedKDAAddress);

  // 2. Deploy YieldSplitter (1 year maturity)
  console.log("\n✂️ Step 2: Deploying YieldSplitter...");
  const maturityDuration = 365 * 24 * 60 * 60; // 1 year
  const YieldSplitter = await ethers.getContractFactory("YieldSplitter");
  const yieldSplitter = await YieldSplitter.deploy(wrappedKDAAddress, maturityDuration);
  await yieldSplitter.waitForDeployment();
  const yieldSplitterAddress = await yieldSplitter.getAddress();
  console.log("✅ YieldSplitter deployed to:", yieldSplitterAddress);

  // Get PT and YT addresses
  const ptAddress = await yieldSplitter.principalToken();
  const ytAddress = await yieldSplitter.yieldToken();
  console.log("📍 PrincipalToken deployed to:", ptAddress);
  console.log("📍 YieldToken deployed to:", ytAddress);

  // 3. Deploy DIAOracle
  console.log("\n📊 Step 3: Deploying DIAOracle...");
  const DIAOracle = await ethers.getContractFactory("DIAOracle");
  const diaOracle = await DIAOracle.deploy();
  await diaOracle.waitForDeployment();
  const diaOracleAddress = await diaOracle.getAddress();
  console.log("✅ DIAOracle deployed to:", diaOracleAddress);

  // 4. Deploy MockAMM
  console.log("\n🏊 Step 4: Deploying MockAMM...");
  const MockAMM = await ethers.getContractFactory("MockAMM");
  const mockAMM = await MockAMM.deploy(ptAddress, ytAddress);
  await mockAMM.waitForDeployment();
  const mockAMMAddress = await mockAMM.getAddress();
  console.log("✅ MockAMM deployed to:", mockAMMAddress);

  console.log("\n🎉 Deployment Complete!");
  console.log("\n📋 Contract Addresses Summary:");
  console.log("=====================================");
  console.log(`WrappedKDA:      ${wrappedKDAAddress}`);
  console.log(`YieldSplitter:   ${yieldSplitterAddress}`);
  console.log(`PrincipalToken:  ${ptAddress}`);
  console.log(`YieldToken:      ${ytAddress}`);
  console.log(`DIAOracle:       ${diaOracleAddress}`);
  console.log(`MockAMM:         ${mockAMMAddress}`);
  console.log("=====================================");

  console.log("\n🔗 Kadena EVM Testnet Info:");
  console.log("Chain ID: 5920");
  console.log("RPC: https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc");
  console.log("Explorer: http://chain-20.evm-testnet-blockscout.chainweb.com/");

  console.log("\n📝 Frontend Configuration:");
  console.log("Update these addresses in your frontend components:");
  console.log(`const WRAPPED_KDA_ADDRESS = '${wrappedKDAAddress}' as const`);
  console.log(`const YIELD_SPLITTER_ADDRESS = '${yieldSplitterAddress}' as const`);
  console.log(`const PRINCIPAL_TOKEN_ADDRESS = '${ptAddress}' as const`);
  console.log(`const YIELD_TOKEN_ADDRESS = '${ytAddress}' as const`);
  console.log(`const DIA_ORACLE_ADDRESS = '${diaOracleAddress}' as const`);
  console.log(`const MOCK_AMM_ADDRESS = '${mockAMMAddress}' as const`);

  console.log("\n🚀 Next Steps:");
  console.log("1. Update contract addresses in frontend components");
  console.log("2. Run setup demo script to populate with test data");
  console.log("3. Test the full user flow");
  console.log("4. Present at hackathon!");

  // Save addresses to a file for easy reference
  const addresses = {
    network: "kadenaTestnet",
    chainId: 5920,
    wrappedKDA: wrappedKDAAddress,
    yieldSplitter: yieldSplitterAddress,
    principalToken: ptAddress,
    yieldToken: ytAddress,
    diaOracle: diaOracleAddress,
    mockAMM: mockAMMAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("\n💾 Addresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
