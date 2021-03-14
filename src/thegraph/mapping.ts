import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  convertToDecimal,
  getPairPrice,
  createOrLoadDay,
  createOrLoadProtocol,
} from "../helpers";
import { AllocationCollected } from "../types/thegraph/Staking";

export function handleAllocationCollected(event: AllocationCollected): void {
  let protocol = createOrLoadProtocol("thegraph");
  let day = createOrLoadDay("thegraph", event.block.timestamp.toI32());
  let USDC_GRT_PAIR = "0xdfa42ba0130425b21a1568507b084cc246fb0c8f"
  let pairPrice = getPairPrice(USDC_GRT_PAIR, BigInt.fromI32(6), BigInt.fromI32(18));
  let fees = convertToDecimal(event.params.tokens);

  protocol.revenueUSD = protocol.revenueUSD.plus(fees.times(pairPrice));
  protocol.save();

  day.revenueUSD = day.revenueUSD.plus(fees.times(pairPrice));
  day.save();
}
