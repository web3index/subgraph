import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
} from "@graphprotocol/graph-ts";
import {
  convertToDecimal,
  createOrLoadDay,
  createOrLoadProtocol,
  exponentToBigDecimal,
  ZERO_BD,
} from "../helpers";
import { WinningTicketRedeemed } from "../../generated/livepeer/TicketBroker";
import { AggregatorV3Interface } from "../../generated/livepeer/AggregatorV3Interface";

/**
 * Converts redeemed ticket face value into USD revenue for the Livepeer protocol
 * and accrues it to the appropriate protocol + day buckets.
 */
export function winningTicketRedeemed(event: WinningTicketRedeemed): void {
  let protocol = createOrLoadProtocol("livepeer");
  let day = createOrLoadDay("livepeer", event.block.timestamp.toI32());
  let fees = convertToDecimal(event.params.faceValue);
  let ethPrice = getEthPriceUSD();
  if (ethPrice.equals(ZERO_BD)) {
    return;
  }

  protocol.revenueUSD = protocol.revenueUSD.plus(fees.times(ethPrice));
  protocol.save();

  day.revenueUSD = day.revenueUSD.plus(fees.times(ethPrice));
  day.save();
}

/**
 * Reads the Chainlink ETH/USD feed for the current network so a single mapping
 * works for both the Arbitrum and mainnet manifests.
 */
function getEthPriceUSD(): BigDecimal {
  let network = dataSource.network();
  let feedAddress =
    network == "mainnet"
      ? Address.fromString("0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419")
      : Address.fromString("0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612");

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
