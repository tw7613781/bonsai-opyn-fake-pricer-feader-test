const {
  time,
  loadFixture,
  setBalance
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("ChainlinkPricer", function () {
  async function deployOneYearLockFixture() {
    let busdAddr = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
    let busdPriceFeederAddr = "0xcb54EEcef88028ED89Bb815dee47Ab130F945e29";
    let curBusdPriceFeederAddr = "0xcBb98864Ef56E9042e7d2efef76141f15731B82f";
    let busdChainlinkPricerAddr = "0x8Dd19E0d579Ec89A1394d99942c5958e20234d79";
    let curBusdChainlinkPricerAddr = "0x10cbE549814CD8Ef4365f4c9A2de5Aa875Eb6496";
    let oracleAddr = "0x52f15AfEeb8C7cC6349e9feB54816f85B5f82F0c";
    let oracleAdminAddr = "0x5c481c791f215A17Bd73A87ee1e113e4EE0baB4E";
    let botAddr = "0x8Ed6DBCE3315Fe9B4335d2601A0e4B42b7642e60";

    const oracleOwner = await ethers.getImpersonatedSigner(oracleAdminAddr);
    const bot = await ethers.getImpersonatedSigner(botAddr);
    await setBalance(oracleOwner.address, 100n ** 18n);
    await setBalance(bot.address, 100n ** 18n);

    const oracle = await ethers.getContractAt("Oracle", oracleAddr, oracleOwner);
    const busdChainlinkPricer = await ethers.getContractAt("ChainLinkPricer", busdChainlinkPricerAddr, oracleOwner);
    const curBusdChainlinkPricer = await ethers.getContractAt("ChainLinkPricer", curBusdChainlinkPricerAddr, oracleOwner);

    return { oracle, oracleOwner, busdChainlinkPricer, curBusdChainlinkPricer, busdAddr, curBusdChainlinkPricerAddr, curBusdPriceFeederAddr, busdPriceFeederAddr, bot };
  }

  it("Check current settings", async function () {
    const { oracle, oracleOwner, busdChainlinkPricer, curBusdChainlinkPricer, busdAddr, curBusdChainlinkPricerAddr, curBusdPriceFeederAddr, busdPriceFeederAddr, bot } = await loadFixture(deployOneYearLockFixture);

    // cur oracle
    expect(await oracle.owner()).to.equal(oracleOwner.address);
    expect(await oracle.getPricer(busdAddr)).to.equal(curBusdChainlinkPricerAddr);

    // cur busd chainlink pricer
    expect(await curBusdChainlinkPricer.asset()).to.equal(busdAddr);
    expect(await curBusdChainlinkPricer.aggregator()).to.equal(curBusdPriceFeederAddr);
    expect(await curBusdChainlinkPricer.oracle()).to.equal(await oracle.getAddress());
    expect(await curBusdChainlinkPricer.bot()).to.equal(bot.address);

    // busd chainlink pricer
    expect(await busdChainlinkPricer.asset()).to.equal(busdAddr);
    expect(await busdChainlinkPricer.aggregator()).to.equal(busdPriceFeederAddr);
    expect(await busdChainlinkPricer.oracle()).to.equal(await oracle.getAddress());
    expect(await busdChainlinkPricer.bot()).to.equal(bot.address);
  });

  it("time travel to test setExpiryPriceInOracle", async function () {
    const { bot, busdChainlinkPricer, oracle, oracleOwner, busdAddr } = await loadFixture(deployOneYearLockFixture);

    // set new busd pricer at oracle
    let busdChainlinkPricerAddr = await busdChainlinkPricer.getAddress();
    await oracle.connect(oracleOwner).setAssetPricer(busdAddr, busdChainlinkPricerAddr);
    expect(await oracle.getPricer(busdAddr)).to.equal(busdChainlinkPricerAddr);

    // travel to today 4pm CST
    const optionExpiryTs = 1706256000
    await time.increaseTo(optionExpiryTs + 1);

    // check busd price at expiry time
    let res = await oracle.getExpiryPrice(busdAddr, optionExpiryTs);
    let price = res[0];
    expect(price, 0n);
    let finalized = res[1];
    expect(finalized, false);

    // set busd price from new chainlink pricer
    await busdChainlinkPricer.connect(bot).setExpiryPriceInOracle(optionExpiryTs, 1);
    res = await oracle.getExpiryPrice(busdAddr, optionExpiryTs);
    price = res[0];
    expect(price, 100000000n);
    finalized = res[1];
    expect(finalized, false);

    // travel abit to finalize the price
    await time.increaseTo(optionExpiryTs + 100);
    res = await oracle.getExpiryPrice(busdAddr, optionExpiryTs);
    price = res[0];
    expect(price, 100000000n);
    finalized = res[1];
    expect(finalized, true);
  });
});
