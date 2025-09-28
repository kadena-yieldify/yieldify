const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Fixing Pool Balance with Swaps...");

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
  
  // The issue: PT reserve is much higher than YT reserve
  // Solution: Do YT → PT swaps to increase YT reserve and decrease PT reserve
  
  // First, get more tokens by splitting wKDA
  console.log("\n💰 Step 1: Getting more tokens...");
  const wrapAmount = ethers.parseEther("2");
  const wrapTx = await wrappedKDA.deposit({ value: wrapAmount });
  await wrapTx.wait();
  
  const splitAmount = ethers.parseEther("1.9");
  const approveTx = await wrappedKDA.approve(YIELD_SPLITTER_ADDRESS, splitAmount);
  await approveTx.wait();
  
  const splitTx = await yieldSplitter.depositAndSplit(splitAmount);
  await splitTx.wait();
  
  const ytBalance = await yieldToken.balanceOf(deployer.address);
  console.log(`✅ YT Balance: ${ethers.formatEther(ytBalance)}`);

  // Now do several small YT → PT swaps to balance the pool
  console.log("\n🔄 Step 2: Balancing pool with YT → PT swaps...");
  
  const numSwaps = 5;
  const swapAmount = ytBalance / BigInt(numSwaps + 2); // Leave some YT for user testing
  
  for (let i = 0; i < numSwaps; i++) {
    console.log(`\n🔄 Swap ${i + 1}/${numSwaps}:`);
    
    // Get quote for YT → PT
    const quote = await mockAMM.getQuoteYTForPT(swapAmount);
    console.log(`  ${ethers.formatEther(swapAmount)} YT → ${ethers.formatEther(quote)} PT`);
    
    // Approve YT tokens
    const approveYTTx = await yieldToken.approve(MOCK_AMM_ADDRESS, swapAmount);
    await approveYTTx.wait();
    
    // Execute swap with 10% slippage tolerance
    const minPTOut = quote * 90n / 100n;
    const swapTx = await mockAMM.swapYTForPT(swapAmount, minPTOut);
    await swapTx.wait();
    
    // Check new pool status
    const newPoolInfo = await mockAMM.getPoolInfo();
    console.log(`  New reserves: ${ethers.formatEther(newPoolInfo[0])} PT, ${ethers.formatEther(newPoolInfo[1])} YT`);
    
    // Small delay between swaps
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final pool status
  console.log("\n📊 Final Pool Status:");
  const finalPoolInfo = await mockAMM.getPoolInfo();
  console.log(`PT Reserve: ${ethers.formatEther(finalPoolInfo[0])}`);
  console.log(`YT Reserve: ${ethers.formatEther(finalPoolInfo[1])}`);
  console.log(`Exchange Rate: ${ethers.formatEther(finalPoolInfo[2])}`);

  // Test a PT → YT swap to verify it works now
  console.log("\n🧪 Step 3: Testing PT → YT swap...");
  const testAmount = ethers.parseEther("0.001");
  const ptBalance = await principalToken.balanceOf(deployer.address);
  
  if (ptBalance >= testAmount) {
    const testQuote = await mockAMM.getQuotePTForYT(testAmount);
    console.log(`Test quote: ${ethers.formatEther(testAmount)} PT → ${ethers.formatEther(testQuote)} YT`);
    
    // Approve and execute test swap
    const approveTestTx = await principalToken.approve(MOCK_AMM_ADDRESS, testAmount);
    await approveTestTx.wait();
    
    const minYTOut = testQuote * 90n / 100n; // 10% slippage
    const testSwapTx = await mockAMM.swapPTForYT(testAmount, minYTOut);
    await testSwapTx.wait();
    
    console.log("✅ PT → YT swap test successful!");
  }

  console.log("\n🎉 Pool Balance Fixed!");
  console.log("\n📋 Summary:");
  console.log("=====================================");
  console.log(`✅ Final PT Reserve: ${ethers.formatEther(finalPoolInfo[0])}`);
  console.log(`✅ Final YT Reserve: ${ethers.formatEther(finalPoolInfo[1])}`);
  console.log("✅ Pool is now more balanced for trading");
  console.log("✅ PT → YT swaps should work with reasonable slippage!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Pool fix failed:", error);
    process.exit(1);
  });
