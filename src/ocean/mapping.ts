import {
  convertToDecimal,
  getPairPrice,
  createOrLoadDay,
  createOrLoadProtocol,
  hexToDecimal,
} from "../helpers";
import { BigInt } from "@graphprotocol/graph-ts";
import { LOG_CALL, Pool } from "../types/templates/ocean/Pool";

export function handleLog(event: LOG_CALL): void {
  let protocol = createOrLoadProtocol("ocean");
  let day = createOrLoadDay("ocean", event.block.timestamp.toI32());

  // let poolId = event.address.toHex()
  let swapFeeStr = event.params.data.toHexString().slice(-40)
  let swapFee = hexToDecimal(swapFeeStr, 18)

  // Get the ocean pair for uniswap v2 or change the helper funciton to v3
  let USDC_OCEAN_PAIR = "0xf64a9fd2aad3f45ad2da0c7aae94d2647c42fa16"
  let pairPrice = getPairPrice(USDC_OCEAN_PAIR, BigInt.fromI32(6), BigInt.fromI32(18));
  protocol.revenueUSD = protocol.revenueUSD.plus(swapFee.times(pairPrice));
  protocol.save();

  day.revenueUSD = day.revenueUSD.plus(swapFee.times(pairPrice));
  day.save();
}

