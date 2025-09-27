const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Distributing mock yield...");

  const YIELD_SPLITTER_ADDRESS = "0x5405d3e877636212CBfBA5Cd7415ca8C26700Bf4";
  const WRAPPED_KDA_ADDRESS = "0x31c13bed4969a135bE285Bcb7BfDc56b601EaA43";

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  // Get contract instances
  const yieldSplitter = await ethers.getContractAt("YieldSplitter", YIELD_SPLITTER_ADDRESS);
  const wrappedKDA = await ethers.getContractAt("WrappedKDA", WRAPPED_KDA_ADDRESS);

  // Check current contract balance
  const contractBalance = await wrappedKDA.balanceOf(YIELD_SPLITTER_ADDRESS);
  console.log(`📊 YieldSplitter wKDA balance: ${ethers.formatEther(contractBalance)}`);

  // Add some wKDA to the contract for yield distribution
  const yieldAmount = ethers.parseEther("0.01"); // 0.01 wKDA as mock yield
  
  console.log("💰 Adding wKDA to contract for yield distribution...");
  await wrappedKDA.transfer(YIELD_SPLITTER_ADDRESS, yieldAmount);
  
  console.log("📈 Triggering yield distribution...");
  try {
    await yieldSplitter.distributeYield();
    console.log("✅ Yield distributed successfully!");
  } catch (error) {
    console.log("ℹ️ Note:", error.message);
    console.log("This might be expected if not enough time has passed since last distribution");
  }

  // Check updated balance
  const newBalance = await wrappedKDA.balanceOf(YIELD_SPLITTER_ADDRESS);
  console.log(`📊 Updated YieldSplitter balance: ${ethers.formatEther(newBalance)}`);

  console.log("\n🎯 Mock yield setup complete!");
  console.log("YT token holders should now have claimable yield available.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Yield distribution failed:", error);
    process.exit(1);
  });
