// const { expect } = require("chai");
// const { ethers, network } = require("hardhat");
// const BN = require("ethers").BigNumber;

// describe("tokenContract testing ", () => {
//   beforeEach(async () => {
//     [owner, signer1, signer2, admin] = await ethers.getSigners();

//     const TokenContract = await ethers.getContractFactory("TokenContract");
//     _token = await TokenContract.deploy();
//     await _token.deployed();

//     // await _token.initialize(
//     //   "GNEXSolu",
//     //   "Gnex",
//     //   BN.from("1000000").mul(BN.from("10").pow("18")),
//     //   18
//     // );

//     const FactoryContract = await ethers.getContractFactory("FactoryContract");
//     factory1 = await FactoryContract.deploy();
//     await factory1.deployed();

//     const Proxy = await ethers.getContractFactory("OwnedUpgradeabilityProxy");
//     proxy = await Proxy.deploy();
//     await proxy.upgradeTo(factory1.address);

//     factory = await FactoryContract.attach(proxy.address);

//     await factory.initialize(_token.address, owner.address);
//     await factory.connect(owner).addAdminRole(admin.address);

//     const tokenAddress = await factory
//       .connect(admin)
//       .createToken("OneSolutions", "onex", 18, 10000000000000);
//     let receipt = await tokenAddress.wait();
//     const event = receipt.events?.filter((x) => {
//       return x.event == "TokenCreated";
//     });
//     token = await _token.attach(event[0].args.tokenAddress);

//     // await token.adminRole(owner.address);
//   });

//   it("check basic functions", async () => {
//     expect(await token.name()).to.equal("OneSolutions");
//     expect(await token.symbol()).to.equal("onex");
//     expect(await token.totalSupply()).to.equal(10000000000000);
//     // console.log('totalSupply()', await token.totalSupply())
//   });
//   //mint function

//   it("checking mint ", async () => {
//     await token.mint(signer1.address, 100);
//     // console.log('balance :>> ', await token.balanceOf(signer1.address));
//     expect(await token.balanceOf(signer1.address)).to.equal(
//       BN.from("100").mul(BN.from("10").pow("18"))
//     );
//   });

//   it("mint function if user blacklisted", async () => {
//     await token.addBlackList(signer1.address, true);

//     expect(token.mint(signer1.address, 100)).to.be.revertedWith(
//       "Blacklistable: account is blacklisted"
//     );

//     await token.addBlackListBatch([owner.address, signer2.address]);

//     expect(token.mint(signer1.address, 100)).to.be.revertedWith(
//       "Blacklistable: account is blacklisted"
//     );
//   });

//   it("mint function only admin", async () => {
    

//     expect(token.connect(owner).mint(signer1.address, 100)).to.be.revertedWith(
//       "onlyAdmin"
//     );
//   });

//   //burn functions

//   it("checking burn ", async () => {
//     await token.mint(signer1.address, 100);
//     await token.burn(signer1.address, 50);
//     expect(await token.balanceOf(signer1.address)).to.equal(
//       BN.from("50").mul(BN.from("10").pow("18"))
//     );
//   });

//   it("burn function if user blacklisted", async () => {
//     await token.addBlackList(signer1.address, true);

//     expect(token.burn(signer1.address, 100)).to.be.revertedWith(
//       "Blacklistable: account is blacklisted"
//     );

//     await token.addBlackListBatch([owner.address, signer2.address]);

//     expect(token.burn(signer1.address, 100)).to.be.revertedWith(
//       "Blacklistable: account is blacklisted"
//     );
//   });

//   it("burn function only admin", async () => {
//     expect(
//       token.connect(signer1).burn(signer1.address, 100)
//     ).to.be.revertedWith("onlyAdmin");
//   });
//   //transfer functionality
//   it("transfer Function ", async () => {
//     await token.mint(owner.address, 1000);

//     await token.transfer(signer1.address, 100);
//     expect(await token.balanceOf(signer1.address)).to.be.equal(100);
//   });

//   it("transfer Function if user blacklisted", async () => {
//     await token.mint(owner.address, 1000);

//     await token.addBlackList(signer1.address, true);

//     expect(token.transfer(signer1.address, 100)).to.be.revertedWith(
//       "Blacklistable: account is blacklisted"
//     );
//   });

//   it("transfer Function if user blacklisted", async () => {
//     await token.mint(owner.address, 1000);

//     await token.addBlackList(owner.address, true);

//     expect(
//       token.connect(owner).transfer(signer1.address, 100)
//     ).to.be.revertedWith("Blacklistable: account is blacklisted");
//   });

//   it("transfer Function Insufficient balance", async () => {
//     await token.mint(owner.address, 1000);

//     await token.freezeTokens(owner.address, 1000);

//     expect(
//       token.connect(owner).transfer(signer1.address, 100)
//     ).to.be.revertedWith("Insufficient Balance");
//   });

//   //transfer from functionality
//   it("transferfrom Function ", async () => {
//     await token.mint(owner.address, 1000);
//     await token.approve(owner.address, 1000);
//     await token
//       .connect(owner)
//       .transferFrom(owner.address, signer1.address, 100);
//     expect(await token.balanceOf(signer1.address)).to.be.equal(100);
//   });

//   it("transferFrom Function if user blacklisted", async () => {
//     await token.mint(owner.address, 1000);

//     await token.addBlackList(signer1.address, true);

//     expect(
//       token.transferFrom(owner.address, signer1.address, 100)
//     ).to.be.revertedWith("Blacklistable: account is blacklisted");
//   });

//   it("transferFrom Function if user blacklisted", async () => {
//     await token.mint(owner.address, 1000);

//     await token.addBlackList(owner.address, true);

//     expect(
//       token.connect(owner).transferFrom(owner.address, signer1.address, 100)
//     ).to.be.revertedWith("Blacklistable: account is blacklisted");
//   });

//   it("transferFrom Function Insufficient balance", async () => {
//     await token.mint(owner.address, 1000);

//     await token.freezeTokens(owner.address, 1000);

//     expect(
//       token.connect(owner).transferFrom(owner.address, signer1.address, 100)
//     ).to.be.revertedWith("Insufficient Balance");
//   });

//   //freezeTokens

//   it("testing freeze tokens function", async () => {
//     await token.mint(signer1.address, 1000);

//     await token.freezeTokens(signer1.address, 100);

//     expect(await token.getFreezeAmount(signer1.address)).to.be.equal(100);
//   });

//   it("testing freezetokens when amount exceed", async () => {
//     await token.mint(signer1.address, 1000);

//     expect(token.freezeTokens(signer1.address, 1001)).to.be.revertedWith(
//       "Amount exceeds available balance"
//     );
//   });

//   it("testing freezetokens when user blacklisted", async () => {
//     await token.mint(signer1.address, 1000);
//     await token.addBlackList(owner.address, true);

//     expect(token.freezeTokens(signer1.address, 1001)).to.be.revertedWith(
//       "Blacklistable: account is blacklisted"
//     );
//   });
//   it("testing freezetokens when msg.sender blacklisted", async () => {
//     await token.mint(signer1.address, 1000);
//     await token.addBlackList(owner.address, true);

//     expect(token.freezeTokens(signer1.address, 1001)).to.be.revertedWith(
//       "Blacklistable: account is blacklisted"
//     );
//   });
//   it("testing freezetokens when called by nonAdmin ", async () => {
//     await token.mint(signer1.address, 1000);

//     expect(
//       token.connect(signer1).freezeTokens(signer1.address, 1001)
//     ).to.be.revertedWith("onlyAdmin");
//   });

//   //unfreezeTokens

//   it("testing Unfreeze tokens function", async () => {
//     await token.mint(signer1.address, 1000);

//     await token.freezeTokens(signer1.address, 100);

//     expect(await token.getFreezeAmount(signer1.address)).to.be.equal(100);
//     await token.unfreezeTokens(signer1.address, 50);
//     expect(await token.getFreezeAmount(signer1.address)).to.be.equal(50);
//   });

//   it("testing unfreezetokens when amount exceed", async () => {
//     await token.mint(signer1.address, 1000);
//     await token.freezeTokens(signer1.address, 100);
//     expect(token.unfreezeTokens(signer1.address, 101)).to.be.revertedWith(
//       "Amount should be less than or equal to frozen tokens"
//     );
//   });

//   it("testing unfreezetokens when user blacklisted", async () => {
//     await token.mint(signer1.address, 1000);
//     await token.addBlackList(signer1.address, true);

//     expect(token.unfreezeTokens(signer1.address, 10)).to.be.revertedWith(
//       "Blacklistable: account is blacklisted"
//     );
//   });
//   it("testing freezetokens when msg.sender blacklisted", async () => {
//     await token.mint(signer1.address, 1000);
//     await token.addBlackList(owner.address, true);

//     expect(token.unfreezeTokens(signer1.address, 1001)).to.be.revertedWith(
//       "Blacklistable: account is blacklisted"
//     );
//   });
//   it("testing unfreezetokens when called by nonAdmin ", async () => {
//     await token.mint(signer1.address, 1000);

//     expect(
//       token.connect(signer1).freezeTokens(signer1.address, 10)
//     ).to.be.revertedWith("onlyAdmin");
//   });

//   //getFreezeAmount

//   it("testing getFreezeAmount tokens function", async () => {
//     await token.mint(signer1.address, 1000);

//     await token.freezeTokens(signer1.address, 100);

//     expect(await token.getFreezeAmount(signer1.address)).to.be.equal(100);
//   });

//   //addBlackList

//   it("check addBlackList ", async () => {
//     await token.addBlackList(signer1.address, true);
//     expect(await token.isBlacklisted(signer1.address)).to.be.true;
//   });

//   it("check addBlacklist with user blacklisted", async () => {
//     await token.addBlackList(signer1.address, true);
//     expect(token.addBlackList(signer1.address, true)).to.be.revertedWith(
//       "Blacklistable: account is blacklisted"
//     );

//     await token.addBlackList(owner.address, true);
//     expect(token.addBlackList(signer2.address, true)).to.be.revertedWith(
//       "Blacklistable: account is blacklisted"
//     );
//   });
//   it("check blacklisted user trying to removing the blacklist", async () => {
//     await token.addBlackList(signer1.address, true);
//     expect(
//       token.connect(signer1).addBlackList(signer1.address, true)
//     ).to.be.revertedWith("Blacklistable: account is blacklisted");
//   });

//   //addBlackListBatch
//   it("check addBlackListBatch with user blacklisted", async () => {
//     await token.addBlackListBatch([owner.address, signer1.address]);
//     expect(token.addBlackList(signer2.address, true)).to.be.revertedWith(
//       "Blacklistable: account is blacklisted"
//     );
//     expect(
//       token.connect(signer1).addBlackListBatch([signer2.address])
//     ).to.be.revertedWith("Blacklistable: account is blacklisted");
//   });

//   it("check addBlackListBatch with user already blacklisted", async () => {
//     await token.addBlackListBatch([signer2.address, signer1.address]);
//     expect(token.addBlackListBatch([signer2.address])).to.be.revertedWith(
//       "address already blacklisted"
//     );
//     expect(
//       token.connect(signer1).addBlackListBatch([signer1.address])
//     ).to.be.revertedWith("address already blacklisted");
//   });

//   //removeBlackkListBatch

//   it("check removeBlackkListBatch with user blacklisted", async () => {
//     await token.addBlackListBatch([signer2.address, signer1.address]);
//     await token.removeBlackListBatch([signer2.address]);
//     expect(
//       await token.connect(signer1).isBlacklisted(signer2.address)
//     ).to.be.equal(false);
//   });

//   it("check removeBlackkListBatch with user blacklisted", async () => {
//     expect(token.removeBlackListBatch([signer2.address])).to.be.revertedWith(
//       "address not blacklisted"
//     );
//   });
//   it("check blacklisted user trying to removing the blacklist", async () => {
//     await token.addBlackList(signer1.address, true);
//     expect(
//       token.connect(signer1).removeBlackListBatch(signer1.address)
//     ).to.be.revertedWith("Blacklistable: account is blacklisted");
//   });
// });
