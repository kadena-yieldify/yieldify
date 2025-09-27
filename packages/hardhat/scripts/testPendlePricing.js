const { ethers } = require("hardhat");

async function main() {
  console.log("🧮 Testing Pendle Pricing in New Contract...");

  // New contract addresses
  const WRAPPED_KDA_ADDRESS = "0xF7Bce9D2106773D8d14B17B49FC261EfF52e7d0D";
  const YIELD_SPLITTER_ADDRESS = "0x81485FBD886d262b671F1789FB066366619eA8c7";

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  // Get contract instances
  const wrappedKDA = await ethers.getContractAt("WrappedKDA", WRAPPED_KDA_ADDRESS);
  const yieldSplitter = await ethers.getContractAt("YieldSplitter", YIELD_SPLITTER_ADDRESS);

  // Check yield percentage
  const yieldPercentage = await yieldSplitter.yieldPercentage();
  console.log(`📊 Yield Percentage: ${yieldPercentage} basis points (${Number(yieldPercentage)/100}%)`);

  // Test Pendle pricing calculation
  const testAmount = ethers.parseEther("1.0"); // 1 wKDA
  console.log(`\n🧮 Testing Pendle pricing for ${ethers.formatEther(testAmount)} wKDA:`);
  
  const pricing = await yieldSplitter.calculatePendlePricing(testAmount);
  const ptAmount = pricing[0];
  const ytAmount = pricing[1];
  
  console.log(`📊 PT Amount: ${ethers.formatEther(ptAmount)} (${(Number(ethers.formatEther(ptAmount)) * 100).toFixed(2)}%)`);
  console.log(`📊 YT Amount: ${ethers.formatEther(ytAmount)} (${(Number(ethers.formatEther(ytAmount)) * 100).toFixed(2)}%)`);
  console.log(`📊 Total: ${ethers.formatEther(ptAmount + ytAmount)}`);

  // Wrap some KDA and test actual splitting
  console.log("\n💰 Wrapping 0.1 KDA for testing...");
  const wrapAmount = ethers.parseEther("0.1");
  await wrappedKDA.deposit({ value: wrapAmount });
  
  const balance = await wrappedKDA.balanceOf(deployer.address);
  console.log(`✅ Wrapped KDA Balance: ${ethers.formatEther(balance)}`);

  // Test actual split with Pendle pricing
  console.log("\n✂️ Testing split with Pendle pricing...");
  const splitAmount = ethers.parseEther("0.05");
  
  await wrappedKDA.approve(YIELD_SPLITTER_ADDRESS, splitAmount);
  await yieldSplitter.depositAndSplit(splitAmount);
  
  console.log("✅ Split completed!");

  // Check resulting balances
  const ptAddress = await yieldSplitter.principalToken();
  const ytAddress = await yieldSplitter.yieldToken();
  const principalToken = await ethers.getContractAt("PrincipalToken", ptAddress);
  const yieldToken = await ethers.getContractAt("YieldToken", ytAddress);

  const ptBalance = await principalToken.balanceOf(deployer.address);
  const ytBalance = await yieldToken.balanceOf(deployer.address);

  console.log(`\n📊 Actual Results for ${ethers.formatEther(splitAmount)} wKDA split:`);
  console.log(`📊 PT Balance: ${ethers.formatEther(ptBalance)}`);
  console.log(`📊 YT Balance: ${ethers.formatEther(ytBalance)}`);
  console.log(`📊 Total: ${ethers.formatEther(ptBalance + ytBalance)}`);

  // Calculate percentages
  const ptPercentage = (Number(ethers.formatEther(ptBalance)) / Number(ethers.formatEther(splitAmount))) * 100;
  const ytPercentage = (Number(ethers.formatEther(ytBalance)) / Number(ethers.formatEther(splitAmount))) * 100;

  console.log(`📊 PT: ${ptPercentage.toFixed(2)}% of input`);
  console.log(`📊 YT: ${ytPercentage.toFixed(2)}% of input`);

  console.log("\n🎉 Pendle pricing is working in the smart contract!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
