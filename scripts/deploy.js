const BN = require("ethers").BigNumber;
const { ethers, upgrades } = require("hardhat");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function main() {
  // const [deployer] = await ethers.getSigners();
  // const { chainId } = await ethers.provider.getNetwork();

  const owner = "0x14ef97a0a27EeDDFd9A1499FD7ef99b52F8C7452";
  const cfo = "0x14ef97a0a27EeDDFd9A1499FD7ef99b52F8C7452";
  const poolAddress = "0x14ef97a0a27EeDDFd9A1499FD7ef99b52F8C7452";

  const FactoryContract = await ethers.getContractFactory("FactoryContract");

  const TokenContract = await ethers.getContractFactory("TokenContract");

  let token = await TokenContract.deploy();
  console.log("TokenContract address", token.address);
  await sleep(3000);

  let factory = await upgrades.deployProxy(
    FactoryContract,
    [token.address, owner, cfo, poolAddress],
    {
      initializer: "initialize",
    }
  );
  await factory.deployed();
  console.log("FactoryContract address", factory.address);
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
