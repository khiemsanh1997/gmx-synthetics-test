import { ethers, network } from "hardhat";
import { getContractDataStore, getContractDepositVault, getContractExchangeRouter, getContractOrderHandler, getContractReader, getContractRouter, getContractTokenErc20, getWOKB9 } from "../constants/contracts";
import { addresses } from "../constants/addresses";
import * as keys from "../utils/keys";
import { OracleUtils } from "../../typechain-types/contracts/exchange/OrderHandler";
import { MyTokenUSDCMarketToken } from "../constants/markets";
import { tokens } from "../constants/tokens";

/**
 * Increase position of WNT + Stablecoin
 */
async function main() {

  const networkName = network.name;
  const [wallet, , keeper] = await ethers.getSigners();
  const marketToken = MyTokenUSDCMarketToken;

  const exchangeRouter = await getContractExchangeRouter(networkName);
  const exchangeAddress = await exchangeRouter.getAddress();

  const reader = await getContractReader(networkName);
  const dataStore = await getContractDataStore(networkName);
  const router = await getContractRouter(networkName);
  const orderHandler = await getContractOrderHandler(networkName);
  const market = await reader.getMarket(addresses[networkName].DataStore, marketToken.marketToken);


  const longToken = await getContractTokenErc20(market[2]); // MyToken
  const shortToken = await getContractTokenErc20(market[3]); // MyUSDC
  const wnt = await getWOKB9(networkName); // wrap okb
  
  const longTokenPriceFeed = tokens[networkName].MyToken.priceFeed;
  const shortTokenPriceFeed = tokens[networkName].USDC.priceFeed;

  // Get deposit of account
  // const totalOrderOfAccount = await dataStore.getBytes32Count(keys.accountOrderListKey(wallet.address));

  const orderKeys = await dataStore.getBytes32ValuesAt(keys.accountOrderListKey(wallet.address), 0, 10000);


  const params: OracleUtils.SetPricesParamsStruct = {
    signerInfo: 0,
    tokens: [longToken.target, shortToken.target],
    compactedMinOracleBlockNumbers: [],
    compactedMaxOracleBlockNumbers: [],
    compactedOracleTimestamps: [],
    compactedDecimals: [],
    compactedMinPrices: [],
    compactedMinPricesIndexes: [],
    compactedMaxPrices: [],
    compactedMaxPricesIndexes: [],
    signatures: [],
    priceFeedTokens: [longTokenPriceFeed || "", shortTokenPriceFeed || ""],
    realtimeFeedTokens: [longToken.target, shortToken.target],
    realtimeFeedData: [ethers.ZeroHash],
  }
  console.log("🚀 ~ file: execute-order.ts:54 ~ main ~ params:", params)
  const latestKey = orderKeys[orderKeys.length - 1];
  const orderInfo = await reader.getOrder(dataStore.target, latestKey);
  console.log("🚀 ~ Order Market Token", orderInfo.addresses.market);
  console.log("🚀 ~ Order Info type", orderInfo.numbers.orderType);
  console.log("🚀 ~ Order Info acceptablePrice", orderInfo.numbers.acceptablePrice);

  const executeTx = await orderHandler.executeOrder(latestKey, params);
  console.log("🚀 ~ file: execute-order.ts:58 ~ forawait ~ executeTx:", executeTx)
  


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
