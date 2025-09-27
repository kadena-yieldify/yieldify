import { expect } from "chai";
import { ethers } from "hardhat";
import { YieldSplitter, WrappedKDA, PrincipalToken, YieldToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Yield Splitting System", function () {
  let wrappedKDA: WrappedKDA;
  let yieldSplitter: YieldSplitter;
  let principalToken: PrincipalToken;
  let yieldToken: YieldToken;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  
  const MATURITY_DURATION = 365 * 24 * 60 * 60; // 1 year
  const DEPOSIT_AMOUNT = ethers.parseEther("10.0");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy WrappedKDA
    const WrappedKDAFactory = await ethers.getContractFactory("WrappedKDA");
    wrappedKDA = await WrappedKDAFactory.deploy();
    await wrappedKDA.waitForDeployment();
    
    // Deploy YieldSplitter
    const YieldSplitterFactory = await ethers.getContractFactory("YieldSplitter");
    yieldSplitter = await YieldSplitterFactory.deploy(
      await wrappedKDA.getAddress(),
      MATURITY_DURATION
    );
    await yieldSplitter.waitForDeployment();
    
    // Get PT and YT addresses from YieldSplitter
    const ptAddress = await yieldSplitter.principalToken();
    const ytAddress = await yieldSplitter.yieldToken();
    
    principalToken = await ethers.getContractAt("PrincipalToken", ptAddress);
    yieldToken = await ethers.getContractAt("YieldToken", ytAddress);
    
    // Wrap some KDA for testing
    await wrappedKDA.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
    await wrappedKDA.connect(user2).deposit({ value: DEPOSIT_AMOUNT });
    
    // Approve YieldSplitter to spend wKDA
    await wrappedKDA.connect(user1).approve(await yieldSplitter.getAddress(), DEPOSIT_AMOUNT);
    await wrappedKDA.connect(user2).approve(await yieldSplitter.getAddress(), DEPOSIT_AMOUNT);
  });

  describe("Deployment", function () {
    it("Should deploy all contracts correctly", async function () {
      expect(await wrappedKDA.name()).to.equal("Wrapped KDA");
      expect(await principalToken.name()).to.equal("Principal Token wKDA");
      expect(await yieldToken.name()).to.equal("Yield Token wKDA");
    });

    it("Should set correct maturity", async function () {
      const currentTime = await time.latest();
      const maturity = await yieldSplitter.maturity();
      expect(maturity).to.be.closeTo(currentTime + MATURITY_DURATION, 10);
    });

    it("Should link contracts correctly", async function () {
      expect(await principalToken.yieldSplitter()).to.equal(await yieldSplitter.getAddress());
      expect(await yieldToken.yieldSplitter()).to.equal(await yieldSplitter.getAddress());
    });
  });

  describe("Deposit and Split", function () {
    it("Should deposit and split wKDA into PT and YT", async function () {
      const splitAmount = ethers.parseEther("5.0");
      
      await yieldSplitter.connect(user1).depositAndSplit(splitAmount);
      
      expect(await principalToken.balanceOf(user1.address)).to.equal(splitAmount);
      expect(await yieldToken.balanceOf(user1.address)).to.equal(splitAmount);
      expect(await wrappedKDA.balanceOf(await yieldSplitter.getAddress())).to.equal(splitAmount);
    });

    it("Should emit correct events", async function () {
      const splitAmount = ethers.parseEther("3.0");
      
      await expect(yieldSplitter.connect(user1).depositAndSplit(splitAmount))
        .to.emit(yieldSplitter, "Deposit")
        .withArgs(user1.address, splitAmount)
        .and.to.emit(yieldSplitter, "Split")
        .withArgs(user1.address, splitAmount, splitAmount, splitAmount);
    });

    it("Should revert with insufficient allowance", async function () {
      const splitAmount = ethers.parseEther("15.0"); // More than approved
      
      await expect(yieldSplitter.connect(user1).depositAndSplit(splitAmount))
        .to.be.reverted;
    });

    it("Should track user positions correctly", async function () {
      const splitAmount = ethers.parseEther("4.0");
      
      await yieldSplitter.connect(user1).depositAndSplit(splitAmount);
      
      const [ptBalance, ytBalance, claimableYield] = await yieldSplitter.getUserPosition(user1.address);
      expect(ptBalance).to.equal(splitAmount);
      expect(ytBalance).to.equal(splitAmount);
      expect(claimableYield).to.equal(0); // No time passed yet
    });
  });

  describe("Yield Generation and Claiming", function () {
    beforeEach(async function () {
      const splitAmount = ethers.parseEther("5.0");
      await yieldSplitter.connect(user1).depositAndSplit(splitAmount);
    });

    it("Should generate yield over time", async function () {
      // Fast forward 30 days
      await time.increase(30 * 24 * 60 * 60);
      
      const claimableYield = await yieldToken.getClaimableYield(user1.address);
      expect(claimableYield).to.be.gt(0);
    });

    it("Should allow yield claiming", async function () {
      // Fast forward 30 days
      await time.increase(30 * 24 * 60 * 60);
      
      const initialBalance = await wrappedKDA.balanceOf(user1.address);
      
      // Fund the contract with some KDA for yield distribution
      await owner.sendTransaction({
        to: await yieldSplitter.getAddress(),
        value: ethers.parseEther("1.0")
      });
      
      await yieldSplitter.connect(user1).claimYield();
      
      const finalBalance = await wrappedKDA.balanceOf(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should distribute yield proportionally to multiple users", async function () {
      const splitAmount2 = ethers.parseEther("10.0"); // User2 deposits 2x more
      await yieldSplitter.connect(user2).depositAndSplit(splitAmount2);
      
      // Fast forward 60 days
      await time.increase(60 * 24 * 60 * 60);
      
      const yield1 = await yieldToken.getClaimableYield(user1.address);
      const yield2 = await yieldToken.getClaimableYield(user2.address);
      
      // User2 should have approximately 2x the yield of User1
      expect(yield2).to.be.closeTo(yield1 * 2n, ethers.parseEther("0.01"));
    });
  });

  describe("Redemption Before Maturity", function () {
    beforeEach(async function () {
      const splitAmount = ethers.parseEther("8.0");
      await yieldSplitter.connect(user1).depositAndSplit(splitAmount);
    });

    it("Should allow redemption of PT+YT for wKDA before maturity", async function () {
      const redeemAmount = ethers.parseEther("3.0");
      const initialBalance = await wrappedKDA.balanceOf(user1.address);
      
      await yieldSplitter.connect(user1).redeemBeforeMaturity(redeemAmount);
      
      expect(await principalToken.balanceOf(user1.address)).to.equal(ethers.parseEther("5.0"));
      expect(await yieldToken.balanceOf(user1.address)).to.equal(ethers.parseEther("5.0"));
      expect(await wrappedKDA.balanceOf(user1.address)).to.equal(initialBalance + redeemAmount);
    });

    it("Should revert if insufficient PT or YT balance", async function () {
      const redeemAmount = ethers.parseEther("10.0"); // More than balance
      
      await expect(yieldSplitter.connect(user1).redeemBeforeMaturity(redeemAmount))
        .to.be.revertedWith("Insufficient PT balance");
    });
  });

  describe("Redemption After Maturity", function () {
    beforeEach(async function () {
      const splitAmount = ethers.parseEther("6.0");
      await yieldSplitter.connect(user1).depositAndSplit(splitAmount);
      
      // Fast forward past maturity
      await time.increase(MATURITY_DURATION + 1);
    });

    it("Should allow PT redemption after maturity", async function () {
      const redeemAmount = ethers.parseEther("4.0");
      const initialBalance = await wrappedKDA.balanceOf(user1.address);
      
      await yieldSplitter.connect(user1).redeemPTAfterMaturity(redeemAmount);
      
      expect(await principalToken.balanceOf(user1.address)).to.equal(ethers.parseEther("2.0"));
      expect(await wrappedKDA.balanceOf(user1.address)).to.equal(initialBalance + redeemAmount);
    });

    it("Should prevent new deposits after maturity", async function () {
      const splitAmount = ethers.parseEther("1.0");
      
      await expect(yieldSplitter.connect(user2).depositAndSplit(splitAmount))
        .to.be.revertedWith("Contract has matured");
    });

    it("Should allow marking as expired", async function () {
      await yieldSplitter.markAsExpired();
      
      const [, , , isExpired] = await yieldSplitter.getContractStats();
      expect(isExpired).to.be.true;
    });
  });

  describe("Contract Statistics", function () {
    it("Should track contract statistics correctly", async function () {
      const splitAmount1 = ethers.parseEther("5.0");
      const splitAmount2 = ethers.parseEther("3.0");
      
      await yieldSplitter.connect(user1).depositAndSplit(splitAmount1);
      await yieldSplitter.connect(user2).depositAndSplit(splitAmount2);
      
      const [totalDeposited, totalYieldDistributed, maturity, isExpired] = 
        await yieldSplitter.getContractStats();
      
      expect(totalDeposited).to.equal(splitAmount1 + splitAmount2);
      expect(totalYieldDistributed).to.equal(0); // No yield claimed yet
      expect(isExpired).to.be.false;
    });
  });
});
