import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Day, Protocol } from "./types/schema";
import { UniswapV2Pair } from "./types/livepeer/UniswapV2Pair";
import { SushiPair } from "./types/thegraph/SushiPair";

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString("0");
export let ONE_BD = BigDecimal.fromString("1");
export let BI_18 = BigInt.fromI32(18);

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

export function convertTokenToDecimal(
  tokenAmount: BigInt,
  exchangeDecimals: BigInt
): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal();
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}

export function convertToDecimal(eth: BigInt): BigDecimal {
  return eth.toBigDecimal().div(exponentToBigDecimal(BI_18));
}

export function createOrLoadProtocol(id: string): Protocol {
  let protocol = Protocol.load(id);
  if (protocol == null) {
    protocol = new Protocol(id);
    protocol.revenueUSD = ZERO_BD;
    protocol.save();
  }
  return protocol as Protocol;
}

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

export function getPairPrice(
  pairAddress: string,
  reserve0Decimals: BigInt,
  reserve1Decimals: BigInt
): BigDecimal {
  let pair = UniswapV2Pair.bind(Address.fromString(pairAddress));
  let pairReserves = pair.getReserves();
  return convertTokenToDecimal(pairReserves.value0, reserve0Decimals).div(
    convertTokenToDecimal(pairReserves.value1, reserve1Decimals)
  );
}

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(ZERO_BD)) {
    return ZERO_BD;
  } else {
    return amount0.div(amount1);
  }
}

let Q192 = BigInt.fromString("2").pow(192);
export function sqrtPriceX96ToTokenPrices(
  sqrtPriceX96: BigInt,
  token0Decimals: BigInt,
  token1Decimals: BigInt
): BigDecimal[] {
  let num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal();
  let denom = BigDecimal.fromString(Q192.toString());

  let price1 = num
    .div(denom)
    .times(exponentToBigDecimal(token0Decimals))
    .div(exponentToBigDecimal(token1Decimals));

  let price0 = safeDiv(BigDecimal.fromString("1"), price1);
  return [price0, price1];
}

export function getGRTPriceInUSD(): BigDecimal {
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
