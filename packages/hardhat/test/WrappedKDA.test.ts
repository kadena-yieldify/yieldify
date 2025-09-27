import { expect } from "chai";
import { ethers } from "hardhat";
import { WrappedKDA } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("WrappedKDA", function () {
  let wrappedKDA: WrappedKDA;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const WrappedKDAFactory = await ethers.getContractFactory("WrappedKDA");
    wrappedKDA = await WrappedKDAFactory.deploy();
    await wrappedKDA.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should have correct name and symbol", async function () {
      expect(await wrappedKDA.name()).to.equal("Wrapped KDA");
      expect(await wrappedKDA.symbol()).to.equal("wKDA");
    });

    it("Should have 18 decimals", async function () {
      expect(await wrappedKDA.decimals()).to.equal(18);
    });

    it("Should start with zero total supply", async function () {
      expect(await wrappedKDA.totalSupply()).to.equal(0);
    });
  });

  describe("Deposit", function () {
    it("Should mint wKDA tokens when depositing KDA", async function () {
      const depositAmount = ethers.parseEther("1.0");
      
      await wrappedKDA.connect(user1).deposit({ value: depositAmount });
      
      expect(await wrappedKDA.balanceOf(user1.address)).to.equal(depositAmount);
      expect(await wrappedKDA.totalSupply()).to.equal(depositAmount);
      expect(await wrappedKDA.totalKDABacking()).to.equal(depositAmount);
    });

    it("Should emit Deposit event", async function () {
      const depositAmount = ethers.parseEther("0.5");
      
      await expect(wrappedKDA.connect(user1).deposit({ value: depositAmount }))
        .to.emit(wrappedKDA, "Deposit")
        .withArgs(user1.address, depositAmount);
    });

    it("Should revert when depositing zero KDA", async function () {
      await expect(wrappedKDA.connect(user1).deposit({ value: 0 }))
        .to.be.revertedWith("Must send KDA");
    });

    it("Should work with receive function", async function () {
      const depositAmount = ethers.parseEther("2.0");
      
      await user1.sendTransaction({
        to: await wrappedKDA.getAddress(),
        value: depositAmount
      });
      
      expect(await wrappedKDA.balanceOf(user1.address)).to.equal(depositAmount);
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      // Deposit some KDA first
      await wrappedKDA.connect(user1).deposit({ value: ethers.parseEther("2.0") });
    });

    it("Should burn wKDA and return KDA", async function () {
      const withdrawAmount = ethers.parseEther("1.0");
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      const tx = await wrappedKDA.connect(user1).withdraw(withdrawAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      expect(await wrappedKDA.balanceOf(user1.address)).to.equal(ethers.parseEther("1.0"));
      expect(await wrappedKDA.totalSupply()).to.equal(ethers.parseEther("1.0"));
      
      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance).to.be.closeTo(
        initialBalance + withdrawAmount - gasUsed,
        ethers.parseEther("0.001") // Small tolerance for gas estimation
      );
    });

    it("Should emit Withdrawal event", async function () {
      const withdrawAmount = ethers.parseEther("0.5");
      
      await expect(wrappedKDA.connect(user1).withdraw(withdrawAmount))
        .to.emit(wrappedKDA, "Withdrawal")
        .withArgs(user1.address, withdrawAmount);
    });

    it("Should revert when withdrawing more than balance", async function () {
      const withdrawAmount = ethers.parseEther("3.0");
      
      await expect(wrappedKDA.connect(user1).withdraw(withdrawAmount))
        .to.be.revertedWith("Insufficient wKDA balance");
    });

    it("Should revert when withdrawing zero amount", async function () {
      await expect(wrappedKDA.connect(user1).withdraw(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Multiple users", function () {
    it("Should handle multiple users independently", async function () {
      const amount1 = ethers.parseEther("1.0");
      const amount2 = ethers.parseEther("2.0");
      
      await wrappedKDA.connect(user1).deposit({ value: amount1 });
      await wrappedKDA.connect(user2).deposit({ value: amount2 });
      
      expect(await wrappedKDA.balanceOf(user1.address)).to.equal(amount1);
      expect(await wrappedKDA.balanceOf(user2.address)).to.equal(amount2);
      expect(await wrappedKDA.totalSupply()).to.equal(amount1 + amount2);
      expect(await wrappedKDA.totalKDABacking()).to.equal(amount1 + amount2);
    });
  });
});
