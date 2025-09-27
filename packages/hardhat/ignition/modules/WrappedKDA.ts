import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WrappedKDAModule = buildModule("WrappedKDAModule", (m) => {
  const wrappedKDA = m.contract("WrappedKDA");

  return { wrappedKDA };
});

export default WrappedKDAModule;
