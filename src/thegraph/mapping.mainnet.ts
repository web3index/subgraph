import {
  convertToDecimal,
  createOrLoadDay,
  createOrLoadProtocol,
  getGRTPriceInUSD,
} from "../helpers";
import { AllocationCollected } from "../../generated/thegraphMainnet/Staking";

/**
 * Accounts for historical The Graph L1 fees by pricing AllocationCollected
 * events in USD and saving them to the protocol/day aggregates.
 */
export function handleAllocationCollected(event: AllocationCollected): void {
  let protocol = createOrLoadProtocol("thegraph");
  let day = createOrLoadDay("thegraph", event.block.timestamp.toI32());
  let grtPrice = getGRTPriceInUSD();
  let fees = convertToDecimal(event.params.tokens);

  protocol.revenueUSD = protocol.revenueUSD.plus(fees.times(grtPrice));
  protocol.save();

  day.revenueUSD = day.revenueUSD.plus(fees.times(grtPrice));
  day.save();
}
