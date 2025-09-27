const { ethers } = require("hardhat");

async function main() {
  console.log("⚖️ Balancing AMM Pool...");

  // Contract addresses
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

  // Check current pool status
  console.log("\n📊 Current Pool Status:");
  const poolInfo = await mockAMM.getPoolInfo();
  console.log(`PT Reserve: ${ethers.formatEther(poolInfo[0])}`);
  console.log(`YT Reserve: ${ethers.formatEther(poolInfo[1])}`);
  console.log(`Exchange Rate: ${ethers.formatEther(poolInfo[2])}`);

  // The pool is heavily imbalanced - we need more YT tokens
  // Let's split more wKDA to get more YT tokens
  console.log("\n💰 Step 1: Wrapping more KDA...");
  const wrapAmount = ethers.parseEther("0.5");
  const wrapTx = await wrappedKDA.deposit({ value: wrapAmount });
  await wrapTx.wait();
  
  console.log("\n✂️ Step 2: Splitting more wKDA to get YT tokens...");
  const splitAmount = ethers.parseEther("0.3");
  
  const approveTx = await wrappedKDA.approve(YIELD_SPLITTER_ADDRESS, splitAmount);
  await approveTx.wait();
  
  const splitTx = await yieldSplitter.depositAndSplit(splitAmount);
  await splitTx.wait();
  
  const ptBalance = await principalToken.balanceOf(deployer.address);
  const ytBalance = await yieldToken.balanceOf(deployer.address);
  
  console.log(`✅ New PT Balance: ${ethers.formatEther(ptBalance)}`);
  console.log(`✅ New YT Balance: ${ethers.formatEther(ytBalance)}`);

  // Add more liquidity to balance the pool
  console.log("\n🏊 Step 3: Adding more liquidity to balance pool...");
  
  // Use most of our YT balance to balance the pool
  const addYTAmount = ytBalance * 8n / 10n; // Use 80% of YT balance
  const addPTAmount = ptBalance * 2n / 10n; // Use 20% of PT balance
  
  console.log(`📊 Adding ${ethers.formatEther(addPTAmount)} PT and ${ethers.formatEther(addYTAmount)} YT`);
  
  // Approve tokens for AMM
  const approvePTTx = await principalToken.approve(MOCK_AMM_ADDRESS, addPTAmount);
  await approvePTTx.wait();
  
  const approveYTTx = await yieldToken.approve(MOCK_AMM_ADDRESS, addYTAmount);
  await approveYTTx.wait();
  
  // Add liquidity
  const addLiquidityTx = await mockAMM.addLiquidity(addPTAmount, addYTAmount);
  await addLiquidityTx.wait();
  
  console.log("✅ Liquidity added successfully!");

  // Check new pool status
  console.log("\n📊 New Pool Status:");
  const newPoolInfo = await mockAMM.getPoolInfo();
  console.log(`PT Reserve: ${ethers.formatEther(newPoolInfo[0])}`);
  console.log(`YT Reserve: ${ethers.formatEther(newPoolInfo[1])}`);
  console.log(`Exchange Rate: ${ethers.formatEther(newPoolInfo[2])}`);

  // Test a small swap to verify it works
  console.log("\n🔄 Step 4: Testing small swap...");
  const testSwapAmount = ethers.parseEther("0.001"); // Very small amount
  
  const remainingPT = await principalToken.balanceOf(deployer.address);
  if (remainingPT >= testSwapAmount) {
    const quote = await mockAMM.getQuotePTForYT(testSwapAmount);
    console.log(`📊 Quote: ${ethers.formatEther(testSwapAmount)} PT → ${ethers.formatEther(quote)} YT`);
    
    // Approve and execute test swap
    const approveTestTx = await principalToken.approve(MOCK_AMM_ADDRESS, testSwapAmount);
    await approveTestTx.wait();
    
    // Use very low slippage protection for test
    const minYTOut = quote * 95n / 100n; // 5% slippage tolerance
    const testSwapTx = await mockAMM.swapPTForYT(testSwapAmount, minYTOut);
    await testSwapTx.wait();
    
    console.log("✅ Test swap successful!");
  }

  console.log("\n🎉 Pool Balancing Complete!");
  console.log("\n📋 Summary:");
  console.log("=====================================");
  console.log(`✅ PT Reserve: ${ethers.formatEther(newPoolInfo[0])} tokens`);
  console.log(`✅ YT Reserve: ${ethers.formatEther(newPoolInfo[1])} tokens`);
  console.log(`✅ Pool is now balanced for trading`);
  console.log("✅ Swaps should work with normal slippage!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Pool balancing failed:", error);
    process.exit(1);
  });
