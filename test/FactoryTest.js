const { expect, use } = require("chai");
const { ethers, network } = require("hardhat");
const BN = require("ethers").BigNumber;

describe("FactoryContract for initialize ", function () {
  // Define variables to be used in the test
  let factoryContract;
  let owner;
  let cfo;
  let masterToken;
  let pool;
  let FactoryContract;
  let signer1;

  // Deploy a new instance of the contract before each test
  beforeEach(async function () {
    [owner, cfo, pool, signer1] = await ethers.getSigners();

    FactoryContract = await ethers.getContractFactory("FactoryContract");
    factoryContract = await FactoryContract.deploy();
    const TokenContract = await ethers.getContractFactory("TokenContract");
    masterToken = await TokenContract.deploy();
    await masterToken.deployed();

    await factoryContract.deployed();
  });

  it("Should initialize contract correctly", async function () {
    // await factoryContract.initialize(masterToken.address, owner.address, cfo.address, poolAddress.address);
    proxy = await upgrades.deployProxy(
      FactoryContract,
      [masterToken.address, owner.address, cfo.address, pool.address],
      {
        initializer: "initialize",
      }
    );

    factory = await FactoryContract.attach(proxy.address);
    // Check that the contract was initialized with the correct values
    expect(await factory.masterToken()).to.equal(masterToken.address);
    expect(await factory.owner()).to.equal(owner.address);
    expect(await factory.poolAddress()).to.equal(pool.address);
    expect(
      await factory.hasRole(await factory.DEFAULT_ADMIN_ROLE(), owner.address)
    ).to.equal(true);
    expect(
      await factory.hasRole(await factory.ADMIN_ROLE(), owner.address)
    ).to.equal(true);
    expect(
      await factory.hasRole(await factory.CFO_ROLE(), cfo.address)
    ).to.equal(true);
  });
  it("Should revert if called again", async function () {
    // await factoryContract.initialize(masterToken.address, owner.address, cfo.address, poolAddress.address);
    proxy = await upgrades.deployProxy(
      FactoryContract,
      [masterToken.address, owner.address, cfo.address, pool.address],
      {
        initializer: "initialize",
      }
    );

    factory = await FactoryContract.attach(proxy.address);

    await expect(
      factory.initialize(
        masterToken.address,
        owner.address,
        cfo.address,
        pool.address
      )
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("Should revert if masterToken is a zero address", async function () {
    await expect(
      upgrades.deployProxy(
        FactoryContract,
        [
          ethers.constants.AddressZero,
          owner.address,
          cfo.address,
          pool.address,
        ],
        {
          initializer: "initialize",
        }
      )
    ).to.be.revertedWith("FC: Zero address not allowed");
  });
  it("Should revert if masterToken is not a contract", async function () {
    await expect(
      upgrades.deployProxy(
        FactoryContract,
        [signer1.address, owner.address, cfo.address, pool.address],
        {
          initializer: "initialize",
        }
      )
    ).to.be.revertedWith("FC:address is not a contract");
  });

  it("Should revert if owner is a zero address", async function () {
    // Call the initialize function and pass in a zero address for the owner parameter
    await expect(
      factoryContract.initialize(
        masterToken.address,
        ethers.constants.AddressZero,
        cfo.address,
        pool.address
      )
    ).to.be.revertedWith("FC: Zero address not allowed");
  });
  it("Should revert if owner is a zero address", async function () {
    // Call the initialize function and pass in a zero address for the owner parameter
    await expect(
      factoryContract.initialize(
        masterToken.address,
        owner.address,
        cfo.address,
        ethers.constants.AddressZero
      )
    ).to.be.revertedWith("FC: Zero address not allowed");
  });
});

describe("CHECK FACTORY CONTRACT", () => {
  let owner,
    zeroAddress,
    admin1,
    signer1,
    signer2,
    admin,
    factory,
    proxy,
    proxy1,
    pool,
    factory1,
    trustedForwarder;

  beforeEach(async () => {
    [owner, signer1, signer2, admin, admin1, cfo, pool, trustedForwarder] =
      await ethers.getSigners();

    const TokenContract = await ethers.getContractFactory("TokenContract");
    token = await TokenContract.deploy();
    await token.deployed();
    const FactoryContract = await ethers.getContractFactory("FactoryContract");
    factory1 = await FactoryContract.deploy();
    await factory1.deployed();
    proxy = await upgrades.deployProxy(
      FactoryContract,
      [token.address, owner.address, cfo.address, pool.address],
      {
        initializer: "initialize",
      }
    );

    factory = await FactoryContract.attach(proxy.address);

    await factory.connect(owner).addAdminRole(admin.address);
    zeroAddress = "0x0000000000000000000000000000000000000000";
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "TwoSolutions");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });
    tokenAttached = await token.attach(event[0].args.tokenAddress);
  });

  //<-------------------------------------------checking role functions---------------------------------------->
  describe("addAdminRole", function () {
    it("should add an admin role to an address", async function () {
      await factory.addAdminRole(cfo.address);
      const isAdmin = await factory.isAdmin(cfo.address);
      expect(isAdmin).to.equal(true);
    });

    it("should revert if called by a non-admin", async function () {
      await expect(
        factory.connect(cfo).addAdminRole(admin.address)
      ).to.be.revertedWith("FC: Caller is not an admin or Default Admin ");
    });
  });

  describe("addCFORole", function () {
    it("should add a CFO role to an address", async function () {
      const isCFO = await factory.isCFO(cfo.address);
      expect(isCFO).to.equal(true);
    });

    it("should revert if called by a non-admin", async function () {
      await expect(
        factory.connect(cfo).addCFORole(admin.address)
      ).to.be.revertedWith("FC: Caller is not an admin or Default Admin ");
    });
  });

  describe("revokeAdminRole", function () {
    it("should revoke an admin role from an address", async function () {
      await factory.addAdminRole(cfo.address);
      await factory.revokeAdminRole(cfo.address);
      const isAdmin = await factory.isAdmin(cfo.address);
      expect(isAdmin).to.equal(false);
    });

    it("should revert if called by a non-admin", async function () {
      await factory.addAdminRole(cfo.address);

      await expect(
        factory.connect(signer1).revokeAdminRole(cfo.address)
      ).to.be.revertedWith("FC: Caller is not an admin or Default Admin ");
    });
  });

  describe("isAdmin", function () {
    it("should return true if an address is an admin", async function () {
      const isAdmin = await factory.isAdmin(admin.address);
      expect(isAdmin).to.equal(true);
    });

    it("should return false if an address is not an admin", async function () {
      const isAdmin = await factory.isAdmin(cfo.address);
      expect(isAdmin).to.equal(false);
    });
  });

  describe("isCFO", function () {
    it("should return true if an address is a CFO", async function () {
      const isCFO = await factory.isCFO(cfo.address);
      expect(isCFO).to.equal(true);
    });
  });

  //  <-----------------------------create token ----------------------->
  it("testing createToken... ", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken(
        "OneSolutions",
        "onex",
        18,
        BN.from("1000").mul(BN.from("10").pow("18")),
        "TwoSolutions"
      );

    const tokenAddress2 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "TwoSolutions");

    let receipt1 = await tokenAddress1.wait();
    let receipt2 = await tokenAddress2.wait();
    const event = receipt1.events?.filter((x) => {
      return x.event == "TokenCreated";
    });
    const event1 = receipt2.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);
    tokenAttached1 = await token.attach(event1[0].args.tokenAddress);

    expect(await factory.isTokenRegistered(tokenAttached.address)).to.be.true;
    expect(await factory.isTokenRegistered(tokenAttached1.address)).to.be.true;
  });

  it("revert if initial supply is zero", async () => {
    await expect(
      factory
        .connect(admin)
        .createToken(
          "OneSolutions",
          "onex",
          18,
          BN.from("0").mul(BN.from("10").pow("18")),
          "TwoSolutions"
        )
    ).to.be.revertedWith("FC:Supply must be greater than zero");
  });
  it("revert if called by nonAdmin ", async () => {
    await expect(
      factory
        .connect(signer1)
        .createToken(
          "OneSolutions",
          "onex",
          18,
          BN.from("10").mul(BN.from("10").pow("18")),
          "OneSolutions"
        )
    ).to.be.revertedWith("FC: Caller is not an admin or Default Admin ");
  });

  it("revert if decimals entered are zero ", async () => {
    await expect(
      factory
        .connect(admin)
        .createToken(
          "OneSolutions",
          "onex",
          0,
          BN.from("10").mul(BN.from("10").pow("18")),
          ""
        )
    ).to.be.revertedWith("FC:Decimals must be greater than zero");
  });

  //-------------------------------------register----------------------------------

  it("testing register function ", async () => {
    await factory.connect(admin).registerTokens(
      {
        name: "GenxSoultion",
        symbol: "Genx",
        decimals: 18,
        initialSupply: 10000000,
        tokenAddress: token.address,
      },
      token.address
    );

    expect(await factory.isTokenRegistered(token.address)).to.be.true;
  });

  it("revert register function when called by non admin", async () => {
    await expect(
      factory.connect(signer1).registerTokens(
        {
          name: "GenxSoultion",
          symbol: "Genx",
          decimals: 18,
          initialSupply: 10000000,
          tokenAddress: token.address,
        },
        token.address
      )
    ).to.be.revertedWith("FC: Caller is not an admin or Default Admin ");
  });

  it("revert register function when passes zero address", async () => {
    await expect(
      factory.connect(admin).registerTokens(
        {
          name: "GenxSoultion",
          symbol: "Genx",
          decimals: 18,
          initialSupply: 10000000,
          tokenAddress: token.address,
        },
        zeroAddress
      )
    ).to.be.revertedWith("FC: Zero address not allowed");

    await expect(
      factory.connect(admin).registerTokens(
        {
          name: "GenxSoultion",
          symbol: "Genx",
          decimals: 18,
          initialSupply: 10000000,
          tokenAddress: "0x0000000000000000000000000000000000000000",
        },
        "0x9f1ac54BEF0DD2f6f3462EA0fa94fC62300d3a8e"
      )
    ).to.be.revertedWith("FC:address is not a contract");
  });
  it("revert if address mismatch", async () => {
    await expect(
      factory.connect(admin).registerTokens(
        {
          name: "GenxSoultion",
          symbol: "Genx",
          decimals: 18,
          initialSupply: 10000000,
          tokenAddress: signer1.address,
        },
        token.address
      )
    ).to.be.revertedWith("FC:Address mismatch");
  });

  it("revert when if token registered", async () => {
    await factory.connect(admin).registerTokens(
      {
        name: "GenxSoultion",
        symbol: "Genx",
        decimals: 18,
        initialSupply: 10000000,
        tokenAddress: token.address,
      },
      token.address
    );
    await expect(
      factory.connect(admin).registerTokens(
        {
          name: "GenxSoultion",
          symbol: "Genx",
          decimals: 18,
          initialSupply: 10000000,
          tokenAddress: token.address,
        },
        token.address
      )
    ).to.be.revertedWith("FC: Token already registered");
  });
  it("revert when if token address is not a contract", async () => {
    await expect(
      factory.connect(admin).registerTokens(
        {
          name: "GenxSoultion",
          symbol: "Genx",
          decimals: 18,
          initialSupply: 10000000,
          tokenAddress: "0x9f1ac54BEF0DD2f6f3462EA0fa94fC62300d3a8e",
        },
        "0x9f1ac54BEF0DD2f6f3462EA0fa94fC62300d3a8e"
      )
    ).to.be.revertedWith("FC:address is not a contract");
  });

  //<--------------------------------unRegister------------------------------------->

  it("testing unRegister function ", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);
    expect(await factory.isTokenRegistered(tokenAttached.address)).to.be.true;

    await factory.connect(admin).unregisterTokens(tokenAttached.address);
    expect(await factory.isTokenRegistered(tokenAttached.address)).to.be.false;
  });

  it("revert unRegister if token address is zero address ", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);
    expect(await factory.isTokenRegistered(tokenAttached.address)).to.be.true;

    await expect(
      factory.connect(admin).unregisterTokens(zeroAddress)
    ).to.be.revertedWith("FC: Token not registered");
  });

  it("check Admin role", async () => {
    await factory.connect(admin).registerTokens(
      {
        name: "GenxSoultion",
        symbol: "Genx",
        decimals: 18,
        initialSupply: 10000000,
        tokenAddress: token.address,
      },
      token.address
    );

    await expect(
      factory
        .connect(signer1)
        .unregisterTokens("0x9f1ac54BEF0DD2f6f3462EA0fa94fC62300d3a8e")
    ).to.be.revertedWith("FC: Caller is not an admin or Default Admin ");
  });
  it("not a zero address", async () => {
    await factory.connect(admin).registerTokens(
      {
        name: "GenxSoultion",
        symbol: "Genx",
        decimals: 18,
        initialSupply: 10000000,
        tokenAddress: token.address,
      },
      token.address
    );

    await expect(
      factory.connect(admin).unregisterTokens(zeroAddress)
    ).to.be.revertedWith("FC: Token not registered");
  });

  it("revert if token not registered", async () => {
    await expect(
      factory
        .connect(admin)
        .unregisterTokens("0x9f1ac54BEF0DD2f6f3462EA0fa94fC62300d3a8e")
    ).to.be.revertedWith("FC: Token not registered");
  });

  //<---------------------------------tokenMint---------------------------->

  it("testing tokenMint", async () => {
    await factory.connect(owner).addAdminRole(admin1.address);
    const tokenAddress1 = await factory
      .connect(admin1)
      .createToken(
        "TwoSolutions",
        "twox",
        18,
        BN.from("1000").mul(BN.from("10").pow("18")),
        ""
      );

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);
    await factory
      .connect(admin1)
      .tokenMint(tokenAttached.address, signer1.address, 100, "check");

    await factory
      .connect(admin1)
      .tokenMint(tokenAttached.address, signer1.address, 100, "check");
    await expect(
      factory
        .connect(admin1)
        .tokenMint(
          tokenAttached.address,
          signer1.address,
          BN.from("1000").mul(BN.from("10").pow("18")),
          "check"
        )
    ).to.be.revertedWith("TC:Amount exceeds totalSupply");
    const balance = await factory
      .connect(admin1)
      .tokenBalance(tokenAttached.address, signer1.address);

    expect(BN.from(balance).mul(BN.from("10").pow("18"))).to.be.equal(
      BN.from("200").mul(BN.from("10").pow("18"))
    );
  });

  it("testing tokenMint REVERTED if called by the non admin ", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "TwoSolutions");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);

    const check = factory
      .connect(signer2)
      .tokenMint(tokenAttached.address, signer1.address, 100, "check");

    await expect(check).to.be.revertedWith(
      "FC: Caller is not an admin or Default Admin "
    );
  });
  it("testing tokenMint REVERTED if amount is zero ", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "TwoSolutions");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);

    const check = factory
      .connect(admin)
      .tokenMint(tokenAttached.address, signer1.address, 0, "check");

    await expect(check).to.be.revertedWith(
      "FC:amount should be greater than zero"
    );
  });
  it("testing tokenMint REVERTED to address is zeroaddress ", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);

    const check = factory
      .connect(admin)
      .tokenMint(tokenAttached.address, zeroAddress, 10000000000000, "check");

    await expect(check).to.be.revertedWith("ERC20: mint to the zero address");
  });
  it("testing tokenMint REVERTED if minted more", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken(
        "TwoSolutions",
        "twox",
        18,
        BN.from("1000000").mul(BN.from("10").pow("8")),
        ""
      );

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);
    console.log("tokenAttached", await tokenAttached.maxSupply());
    const check = factory
      .connect(admin)
      .tokenMint(
        tokenAttached.address,
        signer1.address,
        BN.from("20000000000010").mul(BN.from("10").pow("18"), "check")
      );
    console.log(
      await factory.tokenBalance(tokenAttached.address, signer1.address)
    );
    // await expect(check).to.be.revertedWith("ERC20: mint to the zero address");
  });

  it("testing tokenMint REVERTED to address is zeroaddress ", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);

    const check = factory
      .connect(admin)
      .tokenMint(tokenAttached.address, zeroAddress, 100, "check");

    await expect(check).to.be.revertedWith("ERC20: mint to the zero address");
  });
  it("testing tokenMint REVERTED to address is blacklisted ", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);

    await factory.tokenBlackList(
      tokenAttached.address,
      signer1.address,
      true,
      ""
    );

    const check = factory
      .connect(admin)
      .tokenMint(tokenAttached.address, signer1.address, 100, "check");

    await expect(check).to.be.revertedWith(
      "FC: Account blacklisted for a given Token."
    );
  });
  it("testing tokenMint REVERTED to token address is not registered ", async () => {
    const check = factory
      .connect(admin)
      .tokenMint(signer1.address, signer1.address, 100, "check");

    await expect(check).to.be.revertedWith("FC: Token not registered");
  });
  //burn

  it("testing tokenBurn", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);

    // console.log(await factory.getTokenDetails(tokenAttached.address));
    await factory
      .connect(admin)
      .tokenMint(tokenAttached.address, pool.address, 100, "check");

    const balance = await factory
      .connect(admin)
      .tokenBalance(tokenAttached.address, pool.address);

    expect(BN.from(balance).mul(BN.from("10").pow("18"))).to.be.equal(
      BN.from("100").mul(BN.from("10").pow("18"))
    );

    await factory.connect(cfo).tokenBurn(tokenAttached.address, 50);

    const balance1 = await factory
      .connect(admin)
      .tokenBalance(tokenAttached.address, pool.address);

    expect(BN.from(balance1).mul(BN.from("10").pow("18"))).to.be.equal(
      BN.from("50").mul(BN.from("10").pow("18"))
    );
  });

  it("testing tokenBurn reverted", async () => {
    await expect(
      factory.connect(admin).tokenBurn(tokenAttached.address, 50)
    ).to.be.revertedWith("FC: Caller is not a CFO");
  });
  it("testing tokenBurn reverted as amount is zero", async () => {
    await expect(
      factory.connect(cfo).tokenBurn(tokenAttached.address, 0)
    ).to.be.revertedWith("FC:amount should be greater than zero");
  });

  it("testing tokenBurn reverted as token address is zero as ", async () => {
    await expect(
      factory.connect(cfo).tokenBurn(zeroAddress, 100)
    ).to.be.revertedWith("FC: Token not registered");
  });

  // <-------------------------------------------transferToken------------------------------------>

  it("testing tokenTransfer", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);

    await factory
      .connect(admin)
      .tokenMint(tokenAttached.address, signer2.address, 100, "check");

    await factory
      .connect(admin)
      .transferToken(
        tokenAttached.address,
        signer2.address,
        signer1.address,
        50,
        "check",
        12
      );

    const balance = await factory.tokenBalance(
      tokenAttached.address,
      signer1.address
    );
    const balance1 = await factory.tokenBalance(
      tokenAttached.address,
      signer2.address
    );

    expect(balance).to.be.equal(50);
    expect(balance1).to.be.equal(50);
  });

  it("testing transferToken revert if called by non admin", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);

    await expect(
      factory
        .connect(signer1)
        .transferToken(
          tokenAttached.address,
          signer2.address,
          signer1.address,
          50,
          "check",
          12
        )
    ).to.be.revertedWith("FC: Caller is not an admin or Default Admin ");
  });
  it("testing transferToken revert if token address is zero or address is not registered", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);

    await expect(
      factory
        .connect(admin)
        .transferToken(
          zeroAddress,
          signer2.address,
          signer1.address,
          50,
          "check",
          12
        )
    ).to.be.revertedWith("FC: Token not registered");
    await expect(
      factory
        .connect(admin)
        .transferToken(
          signer1.address,
          signer2.address,
          signer1.address,
          50,
          "check",
          12
        )
    ).to.be.revertedWith("FC: Token not registered");
  });
  it("testing transferToken revert if to address have Insufficient Balance", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);

    await expect(
      factory
        .connect(admin)
        .transferToken(
          tokenAttached.address,
          signer2.address,
          signer1.address,
          50,
          "check",
          12
        )
    ).to.be.revertedWith("TC:Insufficient Balance");
  });
  it("testing transferToken revert if to address is zero address ", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);

    await expect(
      factory
        .connect(admin)
        .transferToken(
          tokenAttached.address,
          signer2.address,
          zeroAddress,
          50,
          "check",
          12
        )
    ).to.be.revertedWith("TC:Insufficient Balance");
  });
  it("testing transferToken revert if amount is zero ", async () => {
    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });

    tokenAttached = await token.attach(event[0].args.tokenAddress);

    await expect(
      factory
        .connect(admin)
        .transferToken(
          tokenAttached.address,
          signer2.address,
          signer1.address,
          0,
          "check",
          12
        )
    ).to.be.revertedWith("FC:amount should be greater than zero");
  });

  //<---------------------------------------isTokenRegistered--------------------------------------->
  it("should return true for a registered token", async () => {
    expect(await factory.isTokenRegistered(tokenAttached.address)).to.be.true;
  });

  it("should return false for an unregistered token", async () => {
    // Deploy another test token contract and get its address (unregistered)
    const TestToken2 = await ethers.getContractFactory("TokenContract");
    const testToken2 = await TestToken2.deploy();
    await testToken2.deployed();
    const unregisteredTokenAddress = testToken2.address;

    expect(await factory.isTokenRegistered(unregisteredTokenAddress)).to.be
      .false;
  });

  //<------------------------------------------------ getTokenDetails------------------------------------------------->
  it("test for token details", async () => {
    // console.log(await factory.getTokenDetails(tokenAttached.address));
    let details = await factory.getTokenDetails(tokenAttached.address);

    expect(details.name).to.equal("TwoSolutions");
    expect(details.symbol).to.equal("twox");
    expect(details.decimals).to.equal(18);
    expect(details.initialSupply).to.equal(10000000000000);
  });
  it("revert if address not registered", async () => {
    // console.log(await factory.getTokenDetails(tokenAttached.address));
    let details = factory.getTokenDetails(signer1.address);

    await expect(details).to.be.revertedWith("FC: Token not registered");
  });
  //<----------------------------tokenBlackList----------------------------------------------->
  it("should add a user to the blacklist", async function () {
    await factory.tokenBlackList(
      tokenAttached.address,
      signer1.address,
      true,
      ""
    );
    const isTokenBlacklisted = await factory.isTokenBlacklisted(
      tokenAttached.address,
      signer1.address
    );
    expect(isTokenBlacklisted).to.equal(true);
  });

  it("should emit an AddressBlackListed event", async function () {
    await expect(
      factory.tokenBlackList(tokenAttached.address, signer1.address, true, "")
    )
      .to.emit(factory, "blackListedToken")
      .withArgs(tokenAttached.address, signer1.address, true, "");
  });

  it("should revert if caller is not an admin of the token", async function () {
    await expect(
      factory
        .connect(signer1)
        .tokenBlackList(tokenAttached.address, signer1.address, true, "")
    ).to.be.revertedWith("FC: Caller is not an admin or Default Admin ");
  });

  it("should revert if token is not registered", async function () {
    await expect(
      factory.tokenBlackList(signer1.address, signer1.address, true, "")
    ).to.be.revertedWith("FC: Token not registered");
  });

  it("should revert if user address is zero", async function () {
    await expect(
      factory.tokenBlackList(tokenAttached.address, zeroAddress, true, "")
    ).to.be.revertedWith("FC: Zero address not allowed");
  });

  it("should revert if user is already blacklisted", async function () {
    await factory.tokenBlackList(
      tokenAttached.address,
      signer1.address,
      true,
      ""
    );
    await expect(
      factory.tokenBlackList(tokenAttached.address, signer1.address, true, "")
    ).to.be.revertedWith(
      "FC:User already has the specified blacklist status in Token"
    );
  });

  it("should return the blacklisted status of a wallet", async function () {
    await factory.tokenBlackList(
      tokenAttached.address,
      signer1.address,
      true,
      ""
    );
    const isTokenBlacklisted = await factory.isTokenBlacklisted(
      tokenAttached.address,
      signer1.address
    );
    expect(isTokenBlacklisted).to.equal(true);
  });

  //<------------------------------------------isTokenBlacklisted------------------------------------->

  it("Should return false for non-blacklisted user", async function () {
    const isTokenBlacklisted = await factory.isTokenBlacklisted(
      tokenAttached.address,
      signer1.address
    );
    expect(isTokenBlacklisted).to.be.false;
  });

  it("Should return true for blacklisted user", async function () {
    // Blacklist the user
    await factory.tokenBlackList(
      tokenAttached.address,
      signer1.address,
      true,
      ""
    );

    const isTokenBlacklisted = await factory.isTokenBlacklisted(
      tokenAttached.address,
      signer1.address
    );

    expect(isTokenBlacklisted).to.be.true;
  });
  //<----------------------------platformBlackList----------------------------------------------->
  it("should add a user to the blacklist", async function () {
    await factory.platformBlackList(signer1.address, true, "");
    const isPlatformBlackList = await factory.isPlatformBlacklisted(
      signer1.address
    );
    expect(isPlatformBlackList).to.equal(true);
  });

  it("should emit an blackListedPlatform event", async function () {
    await expect(factory.platformBlackList(signer1.address, true, ""))
      .to.emit(factory, "blackListedPlatform")
      .withArgs(signer1.address, true, "");
  });

  it("should revert if caller is not an admin of the token", async function () {
    await expect(
      factory.connect(signer1).platformBlackList(signer1.address, true, "")
    ).to.be.revertedWith("FC: Caller is not an admin or Default Admin ");
  });

  it("should revert if user address is zero", async function () {
    await expect(
      factory.platformBlackList(zeroAddress, true, "")
    ).to.be.revertedWith("FC: Zero address not allowed");
  });

  it("should revert if user is already blacklisted", async function () {
    await factory.platformBlackList(signer1.address, true, "");
    await expect(
      factory.platformBlackList(signer1.address, true, "")
    ).to.be.revertedWith(
      "FC:User already has the specified blacklist status on Platform"
    );
  });

  it("should return the blacklisted status of a wallet", async function () {
    await factory.platformBlackList(signer1.address, true, "");
    const isPlatformBlackListed = await factory.isPlatformBlacklisted(
      signer1.address
    );
    expect(isPlatformBlackListed).to.equal(true);
  });

  //<------------------------------------------isTokenBlacklisted------------------------------------->

  it("Should return false for non-blacklisted user", async function () {
    const isPlatformBlacklisted = await factory.isPlatformBlacklisted(
      signer1.address
    );
    expect(isPlatformBlacklisted).to.be.false;
  });

  it("Should return true for blacklisted user", async function () {
    // Blacklist the user
    await factory.platformBlackList(signer1.address, true, "");

    const isPlatformBlacklisted = await factory.isPlatformBlacklisted(
      signer1.address
    );

    expect(isPlatformBlacklisted).to.be.true;
  });
  //<------------------------------------------getFrozenAmount-------------------------------->
  it("should return 0 if no tokens have been frozen", async function () {
    const frozenAmount = await factory.getFrozenAmount(
      tokenAttached.address,
      signer1.address
    );
    expect(frozenAmount).to.equal(0);
  });

  it("should return the correct frozen amount after tokens have been frozen", async function () {
    const amount = 100;

    await factory
      .connect(admin)
      .tokenMint(tokenAttached.address, signer1.address, 100, "check");

    await factory.tokenFreeze(
      tokenAttached.address,
      signer1.address,
      amount,
      ""
    );
    const frozenAmount = await factory.getFrozenAmount(
      tokenAttached.address,
      signer1.address
    );
    expect(frozenAmount).to.equal(amount);
  });

  it("revert if the frozen amount exceeds than actual balance", async function () {
    const amount = 100;

    await factory
      .connect(admin)
      .tokenMint(tokenAttached.address, signer1.address, 100, "check");

    await expect(
      factory.tokenFreeze(
        tokenAttached.address,
        signer1.address,
        amount + 1,
        ""
      )
    ).to.be.revertedWith("TC:Amount exceeds available balance");
  });

  it("should return 0 after tokens have been unfrozen", async function () {
    const amount = 100;
    await factory
      .connect(admin)
      .tokenMint(tokenAttached.address, signer1.address, 100, "check");

    await factory.tokenFreeze(
      tokenAttached.address,
      signer1.address,
      amount,
      ""
    );
    await factory.tokenUnFreeze(
      tokenAttached.address,
      signer1.address,
      amount,
      ""
    );
    const frozenAmount = await factory.getFrozenAmount(
      tokenAttached.address,
      signer1.address
    );
    expect(frozenAmount).to.equal(0);
  });

  it("should revert if the token address is not registered", async function () {
    await expect(
      factory.getFrozenAmount(signer2.address, signer1.address)
    ).to.be.revertedWith("FC: Token not registered");
  });

  it("should revert if the user address is zero", async function () {
    await expect(
      factory.getFrozenAmount(
        tokenAttached.address,
        ethers.constants.AddressZero
      )
    ).to.be.revertedWith("FC: Zero address not allowed");
  });

  //<--------------------------------------tokenFreeze---------------------------------->

  describe("TokenFreeze function", function () {
    let TokenFreeze;
    let tokenFreeze;
    let token;
    let token1;
    let owner;
    let user1;
    let user2;
    let admin;
    let factory;
    let proxy;
    let proxy1;
    let pool;
    let factory1;

    beforeEach(async function () {
      [owner, user2, user1, admin, admin1, cfo, pool] =
        await ethers.getSigners();
      const TokenContract = await ethers.getContractFactory("TokenContract");
      token1 = await TokenContract.deploy();
      await token1.deployed();
      const FactoryContract = await ethers.getContractFactory(
        "FactoryContract"
      );
      factory1 = await FactoryContract.deploy();
      await factory1.deployed();
      proxy = await upgrades.deployProxy(
        FactoryContract,
        [token1.address, owner.address, cfo.address, pool.address],
        {
          initializer: "initialize",
        }
      );

      factory = await FactoryContract.attach(proxy.address);

      await factory.connect(owner).addAdminRole(admin.address);
      zeroAddress = "0x0000000000000000000000000000000000000000";
      const tokenAddress1 = await factory
        .connect(admin)
        .createToken("TwoSolutions", "twox", 18, 10000000000000, "");

      let receipt = await tokenAddress1.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "TokenCreated";
      });
      token = await token1.attach(event[0].args.tokenAddress);
      await factory
        .connect(admin)
        .tokenMint(token.address, user1.address, 100, "check");
      await factory
        .connect(admin)
        .tokenMint(token.address, user2.address, 100, "check");
    });

    describe("tokenFreeze", function () {
      it("should freeze the specified amount of tokens for the specified user", async function () {
        const amount = 100;
        await factory.tokenFreeze(token.address, user1.address, amount, "");
        const frozenAmount = await factory.getFrozenAmount(
          token.address,
          user1.address
        );
        expect(frozenAmount).to.equal(amount);
      });

      it("should emit a TokensFrozen event", async function () {
        const amount = 100;
        await expect(
          factory.tokenFreeze(token.address, user1.address, amount, "")
        )
          .to.emit(factory, "TokensFrozen")
          .withArgs(token.address, user1.address, amount, "");
      });

      it("should revert if the amount is zero", async function () {
        await expect(
          factory.tokenFreeze("FC:amount should be greater than zero")
        );
      });

      // it("should revert if the user is blacklisted", async function () {
      //   await factory.tokenBlackList(token.address, user1.address, true,"");
      //   const amount = 100;
      //   await expect(
      //     factory.tokenFreeze(token.address, user1.address, amount, "")
      //   ).to.be.revertedWith('FC: Account blacklisted for a given Token.');
      // });

      it("should revert if the user address is zero", async function () {
        const amount = 100;
        await expect(
          factory.tokenFreeze(
            token.address,
            ethers.constants.AddressZero,
            amount,
            ""
          )
        ).to.be.revertedWith("FC: Zero address not allowed");
      });

      it("should revert if the caller is not an admin", async function () {
        const amount = 100;
        await expect(
          factory
            .connect(user1)
            .tokenFreeze(token.address, user2.address, amount, "")
        ).to.be.revertedWith("FC: Caller is not an admin or Default Admin ");
      });

      it("should revert if the amount exceeds", async function () {
        const amount = 1000;
        await expect(
          factory
            .connect(admin)
            .tokenFreeze(token.address, user2.address, amount, "")
        ).to.be.revertedWith("TC:Amount exceeds available balance");
      });
    });
  });
});

describe("unFreeze Contract", function () {
  let token;
  let token1;
  let owner;
  let user1;
  let user2;
  let admin;
  let factory;
  let proxy;
  let pool;
  let factory1;

  beforeEach(async function () {
    [owner, user2, user1, admin, admin1, cfo, pool] = await ethers.getSigners();
    const TokenContract = await ethers.getContractFactory("TokenContract");
    token1 = await TokenContract.deploy();
    await token1.deployed();
    const FactoryContract = await ethers.getContractFactory("FactoryContract");
    factory1 = await FactoryContract.deploy();
    await factory1.deployed();
    proxy = await upgrades.deployProxy(
      FactoryContract,
      [token1.address, owner.address, cfo.address, pool.address],
      {
        initializer: "initialize",
      }
    );

    factory = await FactoryContract.attach(proxy.address);

    await factory.connect(owner).addAdminRole(admin.address);

    const tokenAddress1 = await factory
      .connect(admin)
      .createToken("TwoSolutions", "twox", 18, 10000000000000, "TwoSolutions");

    let receipt = await tokenAddress1.wait();
    const event = receipt.events?.filter((x) => {
      return x.event == "TokenCreated";
    });
    token = await token1.attach(event[0].args.tokenAddress);
    await factory
      .connect(admin)
      .tokenMint(token.address, user1.address, 100, "check");
    await factory
      .connect(admin)
      .tokenMint(token.address, user2.address, 100, "check");
  });

  describe("tokenUnFreeze", function () {
    it("should unfreeze tokens for a user", async function () {
      const amountToFreeze = 100;
      const amountToUnfreeze = 50;
      await factory.tokenFreeze(
        token.address,
        user1.address,
        amountToFreeze,
        ""
      );

      await factory.tokenUnFreeze(
        token.address,
        user1.address,
        amountToUnfreeze,
        ""
      );

      const frozenAmount = await factory.getFrozenAmount(
        token.address,
        user1.address
      );
      expect(frozenAmount).to.equal(amountToFreeze - amountToUnfreeze);
    });

    it("should emit TokensUnfrozen event", async function () {
      // set up
      const amountToFreeze = 100;
      const amountToUnfreeze = 50;
      await factory.tokenFreeze(
        token.address,
        user1.address,
        amountToFreeze,
        ""
      );

      // action
      const tx = await factory.tokenUnFreeze(
        token.address,
        user1.address,
        amountToUnfreeze,
        ""
      );

      // assert
      expect(tx)
        .to.emit(factory, "TokensUnfrozen")
        .withArgs(token.address, user1.address, amountToUnfreeze);
    });

    it("should fail if amount is greater than the frozen amount", async function () {
      // set up
      const amountToFreeze = 100;
      const amountToUnfreeze = 101;
      await factory.tokenFreeze(
        token.address,
        user1.address,
        amountToFreeze,
        ""
      );

      // action and assert
      await expect(
        factory.tokenUnFreeze(
          token.address,
          user1.address,
          amountToUnfreeze,
          ""
        )
      ).to.be.revertedWith(
        "TC:Amount should be less than or equal to frozen tokens"
      );
    });

    it("should fail if not called by an admin", async function () {
      const amountToFreeze = 100;
      const amountToUnfreeze = 101;
      await factory.tokenFreeze(
        token.address,
        user1.address,
        amountToFreeze,
        ""
      );

      // action and assert

      await expect(
        factory
          .connect(user1)
          .tokenUnFreeze(token.address, user1.address, amountToUnfreeze, "")
      ).to.be.revertedWith("FC: Caller is not an admin or Default Admin ");
    });

    it("should fail if token address is not registered", async function () {
      const amountToFreeze = 100;
      const amountToUnfreeze = 101;
      await factory.tokenFreeze(
        token.address,
        user1.address,
        amountToFreeze,
        ""
      );

      // action and assert
      await expect(
        factory.tokenUnFreeze(
          user2.address,
          user1.address,
          amountToUnfreeze,
          ""
        )
      ).to.be.revertedWith("FC: Token not registered");
    });
    it("should fail if amount entered is zero", async function () {
      const amountToFreeze = 100;
      const amountToUnfreeze = 0;
      await factory.tokenFreeze(
        token.address,
        user1.address,
        amountToFreeze,
        ""
      );

      // action and assert
      await expect(
        factory.tokenUnFreeze(
          token.address,
          user1.address,
          amountToUnfreeze,
          ""
        )
      ).to.be.revertedWith("FC:amount should be greater than zero");
    });
    it("should fail if address zero", async function () {
      const amountToFreeze = 100;
      const amountToUnfreeze = 50;
      await factory.tokenFreeze(
        token.address,
        user1.address,
        amountToFreeze,
        ""
      );

      // action and assert
      await expect(
        factory.tokenUnFreeze(
          token.address,
          ethers.constants.AddressZero,
          amountToUnfreeze,
          ""
        )
      ).to.be.revertedWith("FC: Zero address not allowed");
    });
    // it("should fail if account blacklisted", async function () {
    //   const amountToFreeze = 100;
    //   const amountToUnfreeze = 50;
    //   await factory.tokenFreeze(
    //     token.address,
    //     user1.address,
    //     amountToFreeze,
    //     ""
    //   );
    //   await factory.tokenBlackList(token.address, user1.address, true,"");

    //   // action and assert
    //   await expect(
    //     factory.tokenUnFreeze(
    //       token.address,
    //       user1.address,
    //       amountToUnfreeze,
    //       ""
    //     )
    //   ).to.be.revertedWith('FC: Account blacklisted for a given Token.');
    // });
  });
});
