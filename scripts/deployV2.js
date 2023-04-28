const { ethers, upgrades } = require("hardhat");

const PROXY = "0x5F552d94efD5066e93269A61b38eFb8374aA6dc9";

async function main() {
 const FactoryV5 = await ethers.getContractFactory("FactoryContractV5");
 console.log("Upgrading Factory...");
 await upgrades.upgradeProxy(PROXY, FactoryV5);
 console.log("Factory upgraded successfully to FactoryV2");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });