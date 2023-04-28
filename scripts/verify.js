const Hre = require("hardhat");
async function main() {
  await Hre.run("verify:verify", {
    //Deployed contract Exchange address
    address: "0xC9A0f03060a3DbC3919a7C1f076b41b36A6E084a",
    //Path of your main contract.
    contract: "contracts/FactoryContractV5.sol:FactoryContractV5",
  });

  await Hre.run("verify:verify", {
    //Deployed contract OwnedUpgradeabilityProxy address
    address: "0x49bEa7fC6047ABC719021e0EAf8B78E5a7aA784c",
    //Path of your main contract.
    contract: "contracts/TokenContract.sol:TokenContract",
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
