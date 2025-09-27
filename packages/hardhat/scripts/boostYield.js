const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Boosting yield rate for demo...");

  const YIELD_SPLITTER_ADDRESS = "0x5405d3e877636212CBfBA5Cd7415ca8C26700Bf4";

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  // Get contract instances
  const yieldSplitter = await ethers.getContractAt("YieldSplitter", YIELD_SPLITTER_ADDRESS);
  
  // Get YT token address
  const ytAddress = await yieldSplitter.yieldToken();
  const yieldToken = await ethers.getContractAt("YieldToken", ytAddress);
  
  console.log("📍 YT Token:", ytAddress);

  // Check current yield rate
  const currentRate = await yieldToken.yieldRate();
  console.log(`📊 Current Yield Rate: ${currentRate.toString()} basis points (${Number(currentRate)/100}%)`);

  // Boost yield rate to 100% APY for demo
  console.log("🚀 Boosting yield rate to 100% APY for demo...");
  await yieldToken.setYieldRate(10000); // 100% APY
  
  const newRate = await yieldToken.yieldRate();
  console.log(`✅ New Yield Rate: ${newRate.toString()} basis points (${Number(newRate)/100}%)`);

  console.log("\n🎯 Yield boost complete!");
  console.log("All YT token holders will now earn 100% APY!");
  console.log("Wait a few minutes and refresh your frontend to see claimable yield.");
  
  // Calculate how much yield should accumulate per minute
  console.log("\n📊 Yield Calculation:");
  console.log("With 100% APY, YT holders earn:");
  console.log("- Per year: 100% of their YT balance");
  console.log("- Per day: ~0.27% of their YT balance");
  console.log("- Per hour: ~0.011% of their YT balance");
  console.log("- Per minute: ~0.00019% of their YT balance");
  console.log("\nFor 0.0205 YT tokens:");
  console.log("- Per minute: ~0.000000039 wKDA");
  console.log("- Per hour: ~0.0000023 wKDA");
  console.log("- Per day: ~0.000055 wKDA");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Yield boost failed:", error);
    process.exit(1);
  });
