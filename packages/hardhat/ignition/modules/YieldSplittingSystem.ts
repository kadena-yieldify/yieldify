import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const YieldSplittingSystemModule = buildModule("YieldSplittingSystemModule", (m) => {
  // Deploy WrappedKDA first
  const wrappedKDA = m.contract("WrappedKDA");

  // Deploy YieldSplitter with 1 year maturity (365 days)
  const maturityDuration = 365 * 24 * 60 * 60; // 1 year in seconds
  const yieldSplitter = m.contract("YieldSplitter", [wrappedKDA, maturityDuration]);

  // Deploy DIA Oracle Price Feed
  const diaOracle = m.contract("DIAOracle");

  return { 
    wrappedKDA, 
    yieldSplitter,
    diaOracle,
    // PT and YT are deployed automatically by YieldSplitter
    // MockAMM will be deployed separately after getting PT/YT addresses
  };
});

export default YieldSplittingSystemModule;
