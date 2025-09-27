const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking AMM Pool Status...");

  const MOCK_AMM_ADDRESS = "0x5158337793D9913b5967B91a32bB328521D7C7fb";
  
  const [deployer] = await ethers.getSigners();
  const mockAMM = await ethers.getContractAt("MockAMM", MOCK_AMM_ADDRESS);
  
  try {
    const poolInfo = await mockAMM.getPoolInfo();
    console.log("📊 Pool Info:");
    console.log(`  PT Reserve: ${ethers.formatEther(poolInfo[0])}`);
    console.log(`  YT Reserve: ${ethers.formatEther(poolInfo[1])}`);
    console.log(`  PT Price: ${ethers.formatEther(poolInfo[2])}`);
    console.log(`  YT Price: ${ethers.formatEther(poolInfo[3])}`);
    
    if (poolInfo[0] === 0n && poolInfo[1] === 0n) {
      console.log("❌ Pool is NOT initialized");
    } else {
      console.log("✅ Pool IS initialized");
    }
  } catch (error) {
    console.error("❌ Error checking pool:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
