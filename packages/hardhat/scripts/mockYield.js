const { ethers } = require("hardhat");

async function main() {
  console.log("🎭 Setting up mock yield for demo...");

  const YIELD_SPLITTER_ADDRESS = "0x5405d3e877636212CBfBA5Cd7415ca8C26700Bf4";
  const USER_ADDRESS = "0xFE52E1E3b23874E90a60E2eDdCb53Db5d1695923"; // Your wallet address

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  // Get contract instances
  const yieldSplitter = await ethers.getContractAt("YieldSplitter", YIELD_SPLITTER_ADDRESS);
  
  // Get YT token address
  const ytAddress = await yieldSplitter.yieldToken();
  const yieldToken = await ethers.getContractAt("YieldToken", ytAddress);
  
  console.log("📍 YT Token:", ytAddress);
  console.log("📍 User:", USER_ADDRESS);

  // Check user's YT balance
  const ytBalance = await yieldToken.balanceOf(USER_ADDRESS);
  console.log(`📊 User YT Balance: ${ethers.formatEther(ytBalance)}`);

  if (ytBalance === 0n) {
    console.log("❌ User has no YT tokens. Cannot generate yield.");
    return;
  }

  // Check current claimable yield
  const currentYield = await yieldToken.getClaimableYield(USER_ADDRESS);
  console.log(`📊 Current Claimable Yield: ${ethers.formatEther(currentYield)}`);

  // The yield is time-based, so let's check the yield rate and calculation
  const yieldRate = await yieldToken.yieldRate();
  const lastClaimTime = await yieldToken.lastClaimTime(USER_ADDRESS);
  
  console.log(`📊 Yield Rate: ${yieldRate} basis points (${yieldRate/100}%)`);
  console.log(`📊 Last Claim Time: ${new Date(Number(lastClaimTime) * 1000).toLocaleString()}`);
  console.log(`📊 Current Time: ${new Date().toLocaleString()}`);
  
  const timeElapsed = Math.floor(Date.now() / 1000) - Number(lastClaimTime);
  console.log(`📊 Time Elapsed: ${timeElapsed} seconds (${(timeElapsed/3600).toFixed(2)} hours)`);

  // Calculate expected yield manually
  const annualYield = (Number(ethers.formatEther(ytBalance)) * Number(yieldRate)) / 10000;
  const timeBasedYield = (annualYield * timeElapsed) / (365.25 * 24 * 60 * 60);
  
  console.log(`📊 Expected Yield: ${timeBasedYield.toFixed(8)} wKDA`);

  if (timeBasedYield > 0.000001) {
    console.log("✅ Yield should be available! The frontend should show claimable yield.");
  } else {
    console.log("⏰ Very little time has passed. Yield accumulation is minimal.");
    console.log("💡 In a real demo, you might want to:");
    console.log("   1. Wait longer for yield to accumulate");
    console.log("   2. Increase the yield rate");
    console.log("   3. Use a larger YT balance");
  }

  // Let's try to increase the yield rate for demo purposes
  console.log("\n🚀 Increasing yield rate for demo...");
  try {
    await yieldToken.setYieldRate(5000); // 50% APY for demo
    console.log("✅ Yield rate increased to 50% APY for demo purposes");
    
    // Recalculate with new rate
    const newAnnualYield = (Number(ethers.formatEther(ytBalance)) * 5000) / 10000;
    const newTimeBasedYield = (newAnnualYield * timeElapsed) / (365.25 * 24 * 60 * 60);
    console.log(`📊 New Expected Yield: ${newTimeBasedYield.toFixed(8)} wKDA`);
    
  } catch (error) {
    console.log("ℹ️ Could not increase yield rate:", error.message);
  }

  console.log("\n🎯 Demo setup complete!");
  console.log("Refresh your frontend to see updated claimable yield.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Mock yield setup failed:", error);
    process.exit(1);
  });
