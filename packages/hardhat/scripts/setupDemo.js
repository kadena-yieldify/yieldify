const { ethers } = require("hardhat");

async function main() {
  console.log("🎭 Setting up demo environment...");

  // Contract addresses (update these after deployment)
  const WRAPPED_KDA_ADDRESS = "0x..."; // Update with deployed address
  const YIELD_SPLITTER_ADDRESS = "0x..."; // Update with deployed address
  const MOCK_AMM_ADDRESS = "0x..."; // Update with deployed address
  const DIA_ORACLE_ADDRESS = "0x..."; // Update with deployed address

  if (WRAPPED_KDA_ADDRESS === "0x..." || YIELD_SPLITTER_ADDRESS === "0x...") {
    console.error("❌ Please update contract addresses in this script");
    process.exit(1);
  }

  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("👤 User1:", user1.address);
  console.log("👤 User2:", user2.address);

  // Get contract instances
  const wrappedKDA = await ethers.getContractAt("WrappedKDA", WRAPPED_KDA_ADDRESS);
  const yieldSplitter = await ethers.getContractAt("YieldSplitter", YIELD_SPLITTER_ADDRESS);
  
  let mockAMM, diaOracle;
  if (MOCK_AMM_ADDRESS !== "0x...") {
    mockAMM = await ethers.getContractAt("MockAMM", MOCK_AMM_ADDRESS);
  }
  if (DIA_ORACLE_ADDRESS !== "0x...") {
    diaOracle = await ethers.getContractAt("DIAOracle", DIA_ORACLE_ADDRESS);
  }

  // Get PT and YT addresses
  const ptAddress = await yieldSplitter.principalToken();
  const ytAddress = await yieldSplitter.yieldToken();
  const principalToken = await ethers.getContractAt("PrincipalToken", ptAddress);
  const yieldToken = await ethers.getContractAt("YieldToken", ytAddress);

  console.log("\n📍 Contract Addresses:");
  console.log("WrappedKDA:", WRAPPED_KDA_ADDRESS);
  console.log("YieldSplitter:", YIELD_SPLITTER_ADDRESS);
  console.log("PrincipalToken:", ptAddress);
  console.log("YieldToken:", ytAddress);
  if (mockAMM) console.log("MockAMM:", MOCK_AMM_ADDRESS);
  if (diaOracle) console.log("DIAOracle:", DIA_ORACLE_ADDRESS);

  console.log("\n💰 Step 1: Wrapping KDA to wKDA...");
  
  // Wrap KDA for demo users
  const wrapAmount = ethers.parseEther("100.0");
  
  await wrappedKDA.connect(deployer).deposit({ value: wrapAmount });
  await wrappedKDA.connect(user1).deposit({ value: wrapAmount });
  await wrappedKDA.connect(user2).deposit({ value: wrapAmount });
  
  console.log("✅ Wrapped 100 KDA for each user");

  console.log("\n✂️ Step 2: Splitting tokens...");
  
  // Approve and split tokens
  const splitAmount = ethers.parseEther("50.0");
  
  await wrappedKDA.connect(deployer).approve(YIELD_SPLITTER_ADDRESS, splitAmount);
  await wrappedKDA.connect(user1).approve(YIELD_SPLITTER_ADDRESS, splitAmount);
  await wrappedKDA.connect(user2).approve(YIELD_SPLITTER_ADDRESS, splitAmount);
  
  await yieldSplitter.connect(deployer).depositAndSplit(splitAmount);
  await yieldSplitter.connect(user1).depositAndSplit(splitAmount);
  await yieldSplitter.connect(user2).depositAndSplit(splitAmount);
  
  console.log("✅ Split 50 wKDA into PT+YT for each user");

  // Check balances
  const deployerPT = await principalToken.balanceOf(deployer.address);
  const deployerYT = await yieldToken.balanceOf(deployer.address);
  console.log(`📊 Deployer: ${ethers.formatEther(deployerPT)} PT, ${ethers.formatEther(deployerYT)} YT`);

  if (mockAMM) {
    console.log("\n🏊 Step 3: Adding liquidity to AMM...");
    
    const liquidityAmount = ethers.parseEther("20.0");
    
    // Approve AMM to spend tokens
    await principalToken.connect(deployer).approve(MOCK_AMM_ADDRESS, liquidityAmount);
    await yieldToken.connect(deployer).approve(MOCK_AMM_ADDRESS, liquidityAmount);
    
    // Add initial liquidity
    await mockAMM.connect(deployer).addInitialLiquidity(liquidityAmount, liquidityAmount);
    console.log("✅ Added 20 PT + 20 YT liquidity to AMM");
    
    // Check pool info
    const poolInfo = await mockAMM.getPoolInfo();
    console.log(`📊 Pool: ${ethers.formatEther(poolInfo[0])} PT, ${ethers.formatEther(poolInfo[1])} YT`);
  }

  if (diaOracle) {
    console.log("\n📊 Step 4: Updating oracle prices...");
    
    // Update mock prices
    await diaOracle.updatePrice("KDA/USD", ethers.parseEther("0.5"));
    await diaOracle.updatePrice("PT-wKDA/USD", ethers.parseEther("0.48"));
    await diaOracle.updatePrice("YT-wKDA/USD", ethers.parseEther("0.02"));
    
    console.log("✅ Updated oracle prices");
    
    // Check prices
    const kdaPrice = await diaOracle.getLatestPrice("KDA/USD");
    const ptPrice = await diaOracle.getLatestPrice("PT-wKDA/USD");
    const ytPrice = await diaOracle.getLatestPrice("YT-wKDA/USD");
    
    console.log(`📊 Prices: KDA=$${ethers.formatEther(kdaPrice)}, PT=$${ethers.formatEther(ptPrice)}, YT=$${ethers.formatEther(ytPrice)}`);
  }

  console.log("\n🎯 Demo Setup Complete!");
  console.log("\n📋 Summary:");
  console.log("- Each user has 50 wKDA remaining");
  console.log("- Each user has 50 PT + 50 YT tokens");
  console.log("- AMM has 20 PT + 20 YT liquidity (if deployed)");
  console.log("- Oracle has updated prices (if deployed)");
  
  console.log("\n🚀 Ready for demo! Users can now:");
  console.log("1. Trade PT ↔ YT on the AMM");
  console.log("2. Claim yield from YT tokens");
  console.log("3. Redeem PT+YT back to wKDA");
  console.log("4. View portfolio and price charts");

  console.log("\n🔗 Frontend Setup:");
  console.log("Update these addresses in your frontend components:");
  console.log(`WRAPPED_KDA_ADDRESS = '${WRAPPED_KDA_ADDRESS}'`);
  console.log(`YIELD_SPLITTER_ADDRESS = '${YIELD_SPLITTER_ADDRESS}'`);
  console.log(`PRINCIPAL_TOKEN_ADDRESS = '${ptAddress}'`);
  console.log(`YIELD_TOKEN_ADDRESS = '${ytAddress}'`);
  if (mockAMM) console.log(`MOCK_AMM_ADDRESS = '${MOCK_AMM_ADDRESS}'`);
  if (diaOracle) console.log(`DIA_ORACLE_ADDRESS = '${DIA_ORACLE_ADDRESS}'`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Demo setup failed:", error);
    process.exit(1);
  });
