const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Setting up AMM Pool Demo...");

  // New contract addresses
  const WRAPPED_KDA_ADDRESS = "0xF7Bce9D2106773D8d14B17B49FC261EfF52e7d0D";
  const YIELD_SPLITTER_ADDRESS = "0x81485FBD886d262b671F1789FB066366619eA8c7";
  const MOCK_AMM_ADDRESS = "0x3aE2a95a17aEdb8B53d0EBa6715336274b098DbF";

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  // Get contract instances
  const wrappedKDA = await ethers.getContractAt("WrappedKDA", WRAPPED_KDA_ADDRESS);
  const yieldSplitter = await ethers.getContractAt("YieldSplitter", YIELD_SPLITTER_ADDRESS);
  const mockAMM = await ethers.getContractAt("MockAMM", MOCK_AMM_ADDRESS);
  
  // Get PT and YT addresses
  const ptAddress = await yieldSplitter.principalToken();
  const ytAddress = await yieldSplitter.yieldToken();
  const principalToken = await ethers.getContractAt("PrincipalToken", ptAddress);
  const yieldToken = await ethers.getContractAt("YieldToken", ytAddress);

  console.log("📍 PT Address:", ptAddress);
  console.log("📍 YT Address:", ytAddress);

  // Step 1: Wrap some KDA
  console.log("\n💰 Step 1: Wrapping 0.2 KDA...");
  const wrapAmount = ethers.parseEther("0.2");
  await wrappedKDA.deposit({ value: wrapAmount });
  
  const wkdaBalance = await wrappedKDA.balanceOf(deployer.address);
  console.log(`✅ Wrapped KDA Balance: ${ethers.formatEther(wkdaBalance)}`);

  // Step 2: Split wKDA to get PT/YT tokens
  console.log("\n✂️ Step 2: Splitting 0.05 wKDA to get PT/YT tokens...");
  const splitAmount = ethers.parseEther("0.05");
  
  console.log("📋 Approving wKDA...");
  const approveTx = await wrappedKDA.approve(YIELD_SPLITTER_ADDRESS, splitAmount);
  await approveTx.wait();
  
  console.log("📋 Splitting wKDA...");
  const splitTx = await yieldSplitter.depositAndSplit(splitAmount);
  await splitTx.wait();
  
  const ptBalance = await principalToken.balanceOf(deployer.address);
  const ytBalance = await yieldToken.balanceOf(deployer.address);
  
  console.log(`✅ PT Balance: ${ethers.formatEther(ptBalance)}`);
  console.log(`✅ YT Balance: ${ethers.formatEther(ytBalance)}`);

  // Step 3: Initialize AMM Pool
  console.log("\n🏊 Step 3: Initializing AMM Pool...");
  
  // Use smaller amounts for initial liquidity
  const initPTAmount = ptBalance / 2n; // Use half of PT balance
  const initYTAmount = ytBalance / 2n; // Use half of YT balance
  
  console.log(`📊 Initializing with ${ethers.formatEther(initPTAmount)} PT and ${ethers.formatEther(initYTAmount)} YT`);
  
  // Approve tokens for AMM
  console.log("📋 Approving PT tokens...");
  const approvePTTx = await principalToken.approve(MOCK_AMM_ADDRESS, initPTAmount);
  await approvePTTx.wait();
  
  console.log("📋 Approving YT tokens...");
  const approveYTTx = await yieldToken.approve(MOCK_AMM_ADDRESS, initYTAmount);
  await approveYTTx.wait();
  
  // Initialize the pool
  console.log("📋 Adding initial liquidity...");
  const initTx = await mockAMM.addInitialLiquidity(initPTAmount, initYTAmount);
  await initTx.wait();
  
  console.log("✅ AMM Pool initialized successfully!");

  // Step 4: Check pool status
  console.log("\n📊 Step 4: Checking pool status...");
  const poolInfo = await mockAMM.getPoolInfo();
  console.log(`📊 PT Reserve: ${ethers.formatEther(poolInfo[0])}`);
  console.log(`📊 YT Reserve: ${ethers.formatEther(poolInfo[1])}`);
  console.log(`📊 Exchange Rate: ${ethers.formatEther(poolInfo[2])}`);
  console.log(`📊 Pool Initialized: ${poolInfo[3]}`);

  // Step 5: Pool is ready for trading!
  console.log("\n🎯 Step 5: Pool ready for trading!");

  console.log("\n🎉 AMM Pool Demo Setup Complete!");
  console.log("\n📋 Summary:");
  console.log("=====================================");
  console.log(`✅ Pool Initialized: ${poolInfo[3]}`);
  console.log(`✅ PT Reserve: ${ethers.formatEther(poolInfo[0])} tokens`);
  console.log(`✅ YT Reserve: ${ethers.formatEther(poolInfo[1])} tokens`);
  console.log("✅ Pendle-style pricing active with 5% APY");
  console.log("✅ Ready for swapping and yield claiming!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });
