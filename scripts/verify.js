const Hre = require("hardhat");
async function main() {
  await Hre.run("verify:verify", {
    //Deployed contract Exchange address
    address: "0x02eAAca834da234C5B9d1055195cF6e5F33ddDA5",
    //Path of your main contract.
    contract: "contracts/FactoryContractV3.sol:FactoryContractV3",
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
