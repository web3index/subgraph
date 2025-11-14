import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
} from "@graphprotocol/graph-ts";
import { Day, Protocol } from "../generated/schema";
import { AggregatorV3Interface } from "../generated/thegraph/AggregatorV3Interface";

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
 * Returns the USD price of GRT using Chainlink feeds on each supported network.
 */
export function getGRTPriceInUSD(): BigDecimal {
  let feedAddress = getGRTFeedAddress(dataSource.network());
  if (feedAddress.equals(Address.zero())) {
    return ZERO_BD;
  }

  let aggregator = AggregatorV3Interface.bind(feedAddress);
  let priceResult = aggregator.try_latestRoundData();
  if (priceResult.reverted) {
    return ZERO_BD;
  }

  let decimalsResult = aggregator.try_decimals();
  let decimals = decimalsResult.reverted ? 8 : decimalsResult.value;
  let scale = exponentToBigDecimal(BigInt.fromI32(decimals));

  return priceResult.value.value1.toBigDecimal().div(scale);
}

/**
 * Returns the Chainlink feed address for GRT/USD on each supported network.
 */
function getGRTFeedAddress(network: string): Address {
  if (network == "mainnet") {
    return Address.fromString("0x86cF33a451dE9dc61a2862FD94FF4ad4Bd65A5d2");
  }
  if (network == "arbitrum-one") {
    return Address.fromString("0x0F38D86FceF4955B705F35c9e41d1A16e0637c73");
  }
  if (network == "matic") {
    return Address.fromString("0x3FabBfb300B1e2D7c9B84512fe9D30aeDF24C410");
  }

  return Address.zero();
}
