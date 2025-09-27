const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking yield for all users...");

  const YIELD_SPLITTER_ADDRESS = "0x5405d3e877636212CBfBA5Cd7415ca8C26700Bf4";

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  // Get contract instances
  const yieldSplitter = await ethers.getContractAt("YieldSplitter", YIELD_SPLITTER_ADDRESS);
  
  // Get YT token address
  const ytAddress = await yieldSplitter.yieldToken();
  const yieldToken = await ethers.getContractAt("YieldToken", ytAddress);
  
  console.log("📍 YT Token:", ytAddress);

  // Check yield rate
  const yieldRate = await yieldToken.yieldRate();
  console.log(`📊 Current Yield Rate: ${yieldRate.toString()} basis points (${Number(yieldRate)/100}%)`);

  // List of addresses to check (add your address here)
  const addresses = [
    deployer.address,
    ethers.getAddress("0xFE52E1E3b23874E90a60E2eDdCb53Db5d1695923"), // Your address with proper checksum
  ];

  for (const addr of addresses) {
    console.log(`\n👤 Checking address: ${addr}`);
    
    try {
      const ytBalance = await yieldToken.balanceOf(addr);
      console.log(`📊 YT Balance: ${ethers.formatEther(ytBalance)}`);
      
      if (ytBalance > 0n) {
        const claimableYield = await yieldToken.getClaimableYield(addr);
        console.log(`💰 Claimable Yield: ${ethers.formatEther(claimableYield)} wKDA`);
        
        const lastClaimTime = await yieldToken.lastClaimTime(addr);
        const timeElapsed = Math.floor(Date.now() / 1000) - Number(lastClaimTime);
        console.log(`⏰ Time since last claim: ${timeElapsed} seconds (${(timeElapsed/3600).toFixed(2)} hours)`);
        
        if (claimableYield > 0n) {
          console.log(`✅ This address has claimable yield!`);
        } else {
          console.log(`⏳ No yield yet (${timeElapsed} seconds elapsed)`);
        }
      } else {
        console.log(`❌ No YT tokens`);
      }
    } catch (error) {
      console.log(`❌ Error checking ${addr}:`, error.message);
    }
  }

  console.log("\n🎯 Yield check complete!");
  console.log("If you see claimable yield above, refresh your frontend to claim it!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Yield check failed:", error);
    process.exit(1);
  });
