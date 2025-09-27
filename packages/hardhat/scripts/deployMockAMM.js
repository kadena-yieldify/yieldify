const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MockAMM...");

  // Get the deployed YieldSplitter address (update this after deployment)
  const YIELD_SPLITTER_ADDRESS = "0x..."; // Update with your YieldSplitter address
  
  if (YIELD_SPLITTER_ADDRESS === "0x...") {
    console.error("❌ Please update YIELD_SPLITTER_ADDRESS in this script");
    process.exit(1);
  }

  // Get YieldSplitter contract to fetch PT and YT addresses
  const yieldSplitter = await ethers.getContractAt("YieldSplitter", YIELD_SPLITTER_ADDRESS);
  
  const ptAddress = await yieldSplitter.principalToken();
  const ytAddress = await yieldSplitter.yieldToken();
  
  console.log("📍 Principal Token address:", ptAddress);
  console.log("📍 Yield Token address:", ytAddress);

  // Deploy MockAMM
  const MockAMM = await ethers.getContractFactory("MockAMM");
  const mockAMM = await MockAMM.deploy(ptAddress, ytAddress);
  await mockAMM.waitForDeployment();

  const mockAMMAddress = await mockAMM.getAddress();
  console.log("✅ MockAMM deployed to:", mockAMMAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const ptToken = await mockAMM.principalToken();
  const ytToken = await mockAMM.yieldToken();
  
  console.log("✓ PT Token in AMM:", ptToken);
  console.log("✓ YT Token in AMM:", ytToken);

  console.log("\n📋 Contract Addresses Summary:");
  console.log("YieldSplitter:", YIELD_SPLITTER_ADDRESS);
  console.log("PrincipalToken:", ptAddress);
  console.log("YieldToken:", ytAddress);
  console.log("MockAMM:", mockAMMAddress);

  console.log("\n🎯 Next Steps:");
  console.log("1. Update frontend components with these addresses");
  console.log("2. Add initial liquidity to the AMM");
  console.log("3. Test the full flow: Deposit → Split → Swap → Redeem");

  // Optional: Add initial liquidity if you have tokens
  console.log("\n💡 To add initial liquidity:");
  console.log(`1. Get some PT and YT tokens by calling depositAndSplit on YieldSplitter`);
  console.log(`2. Approve MockAMM to spend your PT and YT tokens`);
  console.log(`3. Call addInitialLiquidity on MockAMM`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
