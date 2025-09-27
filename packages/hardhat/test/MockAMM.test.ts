import { expect } from "chai";
import { ethers } from "hardhat";
import { MockAMM, YieldSplitter, WrappedKDA, PrincipalToken, YieldToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("MockAMM", function () {
  let wrappedKDA: WrappedKDA;
  let yieldSplitter: YieldSplitter;
  let principalToken: PrincipalToken;
  let yieldToken: YieldToken;
  let mockAMM: MockAMM;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  
  const MATURITY_DURATION = 365 * 24 * 60 * 60; // 1 year
  const INITIAL_LIQUIDITY_PT = ethers.parseEther("100.0");
  const INITIAL_LIQUIDITY_YT = ethers.parseEther("100.0");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy the full system
    const WrappedKDAFactory = await ethers.getContractFactory("WrappedKDA");
    wrappedKDA = await WrappedKDAFactory.deploy();
    await wrappedKDA.waitForDeployment();
    
    const YieldSplitterFactory = await ethers.getContractFactory("YieldSplitter");
    yieldSplitter = await YieldSplitterFactory.deploy(
      await wrappedKDA.getAddress(),
      MATURITY_DURATION
    );
    await yieldSplitter.waitForDeployment();
    
    // Get PT and YT addresses
    const ptAddress = await yieldSplitter.principalToken();
    const ytAddress = await yieldSplitter.yieldToken();
    
    principalToken = await ethers.getContractAt("PrincipalToken", ptAddress);
    yieldToken = await ethers.getContractAt("YieldToken", ytAddress);
    
    // Deploy MockAMM
    const MockAMMFactory = await ethers.getContractFactory("MockAMM");
    mockAMM = await MockAMMFactory.deploy(ptAddress, ytAddress);
    await mockAMM.waitForDeployment();
    
    // Setup initial state
    // 1. Wrap KDA for owner and users
    await wrappedKDA.connect(owner).deposit({ value: ethers.parseEther("500.0") });
    await wrappedKDA.connect(user1).deposit({ value: ethers.parseEther("100.0") });
    await wrappedKDA.connect(user2).deposit({ value: ethers.parseEther("100.0") });
    
    // 2. Approve YieldSplitter
    await wrappedKDA.connect(owner).approve(await yieldSplitter.getAddress(), ethers.parseEther("300.0"));
    await wrappedKDA.connect(user1).approve(await yieldSplitter.getAddress(), ethers.parseEther("50.0"));
    await wrappedKDA.connect(user2).approve(await yieldSplitter.getAddress(), ethers.parseEther("50.0"));
    
    // 3. Split tokens to get PT and YT
    await yieldSplitter.connect(owner).depositAndSplit(ethers.parseEther("200.0"));
    await yieldSplitter.connect(user1).depositAndSplit(ethers.parseEther("50.0"));
    await yieldSplitter.connect(user2).depositAndSplit(ethers.parseEther("50.0"));
    
    // 4. Approve AMM to spend PT and YT tokens
    await principalToken.connect(owner).approve(await mockAMM.getAddress(), INITIAL_LIQUIDITY_PT);
    await yieldToken.connect(owner).approve(await mockAMM.getAddress(), INITIAL_LIQUIDITY_YT);
    
    await principalToken.connect(user1).approve(await mockAMM.getAddress(), ethers.parseEther("25.0"));
    await yieldToken.connect(user1).approve(await mockAMM.getAddress(), ethers.parseEther("25.0"));
    
    await principalToken.connect(user2).approve(await mockAMM.getAddress(), ethers.parseEther("25.0"));
    await yieldToken.connect(user2).approve(await mockAMM.getAddress(), ethers.parseEther("25.0"));
    
    // 5. Add initial liquidity
    await mockAMM.connect(owner).addInitialLiquidity(INITIAL_LIQUIDITY_PT, INITIAL_LIQUIDITY_YT);
  });

  describe("Deployment and Initial Setup", function () {
    it("Should deploy with correct token addresses", async function () {
      expect(await mockAMM.principalToken()).to.equal(await principalToken.getAddress());
      expect(await mockAMM.yieldToken()).to.equal(await yieldToken.getAddress());
    });

    it("Should have initial liquidity", async function () {
      const [ptReserve, ytReserve] = await mockAMM.getPoolInfo();
      expect(ptReserve).to.equal(INITIAL_LIQUIDITY_PT);
      expect(ytReserve).to.equal(INITIAL_LIQUIDITY_YT);
    });

    it("Should have 1:1 initial price", async function () {
      const ptPrice = await mockAMM.getPrice(await principalToken.getAddress());
      const ytPrice = await mockAMM.getPrice(await yieldToken.getAddress());
      
      expect(ptPrice).to.equal(ethers.parseEther("1.0")); // 1 PT = 1 YT
      expect(ytPrice).to.equal(ethers.parseEther("1.0")); // 1 YT = 1 PT
    });
  });

  describe("Liquidity Management", function () {
    it("Should add liquidity maintaining ratio", async function () {
      const ptAmount = ethers.parseEther("10.0");
      const expectedYtAmount = ethers.parseEther("10.0"); // 1:1 ratio
      
      const ytAmount = await mockAMM.connect(owner).addLiquidity.staticCall(ptAmount);
      expect(ytAmount).to.equal(expectedYtAmount);
      
      await mockAMM.connect(owner).addLiquidity(ptAmount);
      
      const [ptReserve, ytReserve] = await mockAMM.getPoolInfo();
      expect(ptReserve).to.equal(INITIAL_LIQUIDITY_PT + ptAmount);
      expect(ytReserve).to.equal(INITIAL_LIQUIDITY_YT + expectedYtAmount);
    });

    it("Should remove liquidity proportionally", async function () {
      const removeAmount = ethers.parseEther("20.0");
      
      const ytAmount = await mockAMM.connect(owner).removeLiquidity.staticCall(removeAmount);
      expect(ytAmount).to.equal(removeAmount); // 1:1 ratio
      
      await mockAMM.connect(owner).removeLiquidity(removeAmount);
      
      const [ptReserve, ytReserve] = await mockAMM.getPoolInfo();
      expect(ptReserve).to.equal(INITIAL_LIQUIDITY_PT - removeAmount);
      expect(ytReserve).to.equal(INITIAL_LIQUIDITY_YT - removeAmount);
    });
  });

  describe("Swapping PT for YT", function () {
    it("Should swap PT for YT with correct amounts", async function () {
      const ptAmountIn = ethers.parseEther("5.0");
      const expectedYtOut = await mockAMM.getQuotePTForYT(ptAmountIn);
      
      const initialPtBalance = await principalToken.balanceOf(user1.address);
      const initialYtBalance = await yieldToken.balanceOf(user1.address);
      
      await mockAMM.connect(user1).swapPTForYT(ptAmountIn, 0);
      
      const finalPtBalance = await principalToken.balanceOf(user1.address);
      const finalYtBalance = await yieldToken.balanceOf(user1.address);
      
      expect(finalPtBalance).to.equal(initialPtBalance - ptAmountIn);
      expect(finalYtBalance).to.equal(initialYtBalance + expectedYtOut);
    });

    it("Should update reserves after PT to YT swap", async function () {
      const ptAmountIn = ethers.parseEther("3.0");
      const expectedYtOut = await mockAMM.getQuotePTForYT(ptAmountIn);
      
      const [initialPtReserve, initialYtReserve] = await mockAMM.getPoolInfo();
      
      await mockAMM.connect(user1).swapPTForYT(ptAmountIn, 0);
      
      const [finalPtReserve, finalYtReserve] = await mockAMM.getPoolInfo();
      
      expect(finalPtReserve).to.equal(initialPtReserve + ptAmountIn);
      expect(finalYtReserve).to.equal(initialYtReserve - expectedYtOut);
    });

    it("Should respect slippage protection", async function () {
      const ptAmountIn = ethers.parseEther("2.0");
      const expectedYtOut = await mockAMM.getQuotePTForYT(ptAmountIn);
      const minYtOut = expectedYtOut + ethers.parseEther("1.0"); // Unrealistic minimum
      
      await expect(mockAMM.connect(user1).swapPTForYT(ptAmountIn, minYtOut))
        .to.be.revertedWith("Insufficient output amount");
    });

    it("Should emit Swap event", async function () {
      const ptAmountIn = ethers.parseEther("1.0");
      const expectedYtOut = await mockAMM.getQuotePTForYT(ptAmountIn);
      
      await expect(mockAMM.connect(user1).swapPTForYT(ptAmountIn, 0))
        .to.emit(mockAMM, "Swap")
        .withArgs(
          user1.address,
          await principalToken.getAddress(),
          await yieldToken.getAddress(),
          ptAmountIn,
          expectedYtOut
        );
    });
  });

  describe("Swapping YT for PT", function () {
    it("Should swap YT for PT with correct amounts", async function () {
      const ytAmountIn = ethers.parseEther("4.0");
      const expectedPtOut = await mockAMM.getQuoteYTForPT(ytAmountIn);
      
      const initialPtBalance = await principalToken.balanceOf(user2.address);
      const initialYtBalance = await yieldToken.balanceOf(user2.address);
      
      await mockAMM.connect(user2).swapYTForPT(ytAmountIn, 0);
      
      const finalPtBalance = await principalToken.balanceOf(user2.address);
      const finalYtBalance = await yieldToken.balanceOf(user2.address);
      
      expect(finalYtBalance).to.equal(initialYtBalance - ytAmountIn);
      expect(finalPtBalance).to.equal(initialPtBalance + expectedPtOut);
    });

    it("Should update reserves after YT to PT swap", async function () {
      const ytAmountIn = ethers.parseEther("6.0");
      const expectedPtOut = await mockAMM.getQuoteYTForPT(ytAmountIn);
      
      const [initialPtReserve, initialYtReserve] = await mockAMM.getPoolInfo();
      
      await mockAMM.connect(user2).swapYTForPT(ytAmountIn, 0);
      
      const [finalPtReserve, finalYtReserve] = await mockAMM.getPoolInfo();
      
      expect(finalYtReserve).to.equal(initialYtReserve + ytAmountIn);
      expect(finalPtReserve).to.equal(initialPtReserve - expectedPtOut);
    });
  });

  describe("Price Impact and Fees", function () {
    it("Should have price impact for large swaps", async function () {
      const smallSwap = ethers.parseEther("1.0");
      const largeSwap = ethers.parseEther("20.0");
      
      const smallQuote = await mockAMM.getQuotePTForYT(smallSwap);
      const largeQuote = await mockAMM.getQuotePTForYT(largeSwap);
      
      // Rate for small swap should be better than large swap
      const smallRate = (smallQuote * ethers.parseEther("1.0")) / smallSwap;
      const largeRate = (largeQuote * ethers.parseEther("1.0")) / largeSwap;
      
      expect(smallRate).to.be.greaterThan(largeRate);
    });

    it("Should apply trading fees", async function () {
      const swapAmount = ethers.parseEther("10.0");
      const quote = await mockAMM.getQuotePTForYT(swapAmount);
      
      // With 0.3% fee, output should be less than input
      expect(quote).to.be.lessThan(swapAmount);
      
      // The difference should be approximately the fee (accounting for price impact)
      const feeApprox = swapAmount * 30n / 10000n; // 0.3%
      expect(swapAmount - quote).to.be.greaterThanOrEqual(feeApprox);
    });
  });

  describe("Edge Cases", function () {
    it("Should revert when swapping with zero amount", async function () {
      await expect(mockAMM.connect(user1).swapPTForYT(0, 0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should revert when output exceeds reserve", async function () {
      const hugeSwap = ethers.parseEther("200.0"); // Larger than reserve
      
      await expect(mockAMM.connect(user1).swapPTForYT(hugeSwap, 0))
        .to.be.reverted; // Should revert due to insufficient balance or reserve
    });

    it("Should handle multiple consecutive swaps", async function () {
      const swapAmount = ethers.parseEther("2.0");
      
      // First swap PT -> YT
      await mockAMM.connect(user1).swapPTForYT(swapAmount, 0);
      
      // Second swap YT -> PT (different user)
      await mockAMM.connect(user2).swapYTForPT(swapAmount, 0);
      
      // Pool should still be functional
      const [ptReserve, ytReserve] = await mockAMM.getPoolInfo();
      expect(ptReserve).to.be.greaterThan(0);
      expect(ytReserve).to.be.greaterThan(0);
    });
  });

  describe("Price Queries", function () {
    it("Should return accurate quotes", async function () {
      const testAmount = ethers.parseEther("5.0");
      
      const ptToYtQuote = await mockAMM.getQuotePTForYT(testAmount);
      const ytToPtQuote = await mockAMM.getQuoteYTForPT(testAmount);
      
      expect(ptToYtQuote).to.be.greaterThan(0);
      expect(ytToPtQuote).to.be.greaterThan(0);
      
      // Due to fees and price impact, quotes should be less than input
      expect(ptToYtQuote).to.be.lessThan(testAmount);
      expect(ytToPtQuote).to.be.lessThan(testAmount);
    });

    it("Should maintain price consistency", async function () {
      const ptPrice = await mockAMM.getPrice(await principalToken.getAddress());
      const ytPrice = await mockAMM.getPrice(await yieldToken.getAddress());
      
      // PT price * YT price should be close to 1e36 (1e18 * 1e18)
      const priceProduct = ptPrice * ytPrice;
      const expectedProduct = ethers.parseEther("1.0") * ethers.parseEther("1.0");
      
      expect(priceProduct).to.equal(expectedProduct);
    });
  });
});
