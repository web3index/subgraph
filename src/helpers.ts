import { Address, BigDecimal, BigInt, dataSource } from "@graphprotocol/graph-ts";
import { Day, Protocol } from "../generated/schema";
import { SushiPair } from "../generated/thegraph/SushiPair";

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString("0");
export let ONE_BD = BigDecimal.fromString("1");
export let BI_18 = BigInt.fromI32(18);

/**
 * Returns 10^decimals as a BigDecimal so we can rescale token amounts.
 */
export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

/**
 * Converts a raw token amount into decimals-aware BigDecimal.
 */
export function convertTokenToDecimal(
  tokenAmount: BigInt,
  exchangeDecimals: BigInt
): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal();
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}

/**
 * Converts a wei-denominated amount into ETH as BigDecimal.
 */
export function convertToDecimal(eth: BigInt): BigDecimal {
  return eth.toBigDecimal().div(exponentToBigDecimal(BI_18));
}

/**
 * Finds or creates the Protocol entity keyed by the supplied id.
 */
export function createOrLoadProtocol(id: string): Protocol {
  let protocol = Protocol.load(id);
  if (protocol == null) {
    protocol = new Protocol(id);
    protocol.revenueUSD = ZERO_BD;
    protocol.save();
  }
  return protocol as Protocol;
}

/**
 * Returns the day bucket for a protocol at the given timestamp, creating it if needed.
 */
export function createOrLoadDay(protocolID: string, timestamp: i32): Day {
  let dayID = timestamp / 86400;
  let dayStartTimestamp = dayID * 86400;
  let day = Day.load(protocolID + "-" + dayID.toString());

  if (day == null) {
    day = new Day(protocolID + "-" + dayID.toString());
    day.date = dayStartTimestamp;
    day.revenueUSD = ZERO_BD;
    day.protocol = protocolID;
    day.save();
  }
  return day as Day;
}

/**
 * Divides two BigDecimals but guards against division by zero.
 */
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(ZERO_BD)) {
    return ZERO_BD;
  } else {
    return amount0.div(amount1);
  }
}

/**
 * Returns GRT priced in USD, using network-specific pools for L1 vs Arbitrum.
 */
export function getGRTPriceInUSD(): BigDecimal {
  let network = dataSource.network();

  if (network == "mainnet") {
    let grtUsdPair = SushiPair.bind(
      Address.fromString("0xdfa42ba0130425b21a1568507b084cc246fb0c8f")
    );
    let pairReserves = grtUsdPair.getReserves();
    let usdc = convertTokenToDecimal(pairReserves.value0, BigInt.fromI32(6));
    let grt = convertTokenToDecimal(pairReserves.value1, BI_18);
    return safeDiv(usdc, grt);
  }

  let grtPriceOracle = SushiPair.bind(
    Address.fromString("0x99059b8dd38bced5a47fa2d2211de7c46eb2f1f8")
  );
  let reserve1 = grtPriceOracle.getReserves();
  let grtPriceInETH = reserve1.value1
    .toBigDecimal()
    .div(reserve1.value0.toBigDecimal());

  let ethPriceOracle = SushiPair.bind(
    Address.fromString("0x692a0b300366d1042679397e40f3d2cb4b8f7d30")
  );
  let reserve2 = ethPriceOracle.getReserves();
  let ethPriceInUSD = reserve2.value1
    .toBigDecimal()
    .div(reserve2.value0.toBigDecimal());

  return grtPriceInETH.times(ethPriceInUSD);
}
