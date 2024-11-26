import { BigInt } from "@graphprotocol/graph-ts";
import {
  createOrLoadDay,
  createOrLoadProtocol,
  getGRTPriceInUSD,
} from "../helpers";
import { TokensPulled } from "../generated/thegraph/Billing";

export function handleTokensPulled(event: TokensPulled): void {
  let protocol = createOrLoadProtocol("thegraph");
  let day = createOrLoadDay("thegraph", event.block.timestamp.toI32());
  let grtPrice = getGRTPriceInUSD();

  protocol.revenueUSD = protocol.revenueUSD.plus(
    event.params.amount
      .toBigDecimal()
      .times(grtPrice)
      .div(BigInt.fromI32(10).pow(18).toBigDecimal())
  );
  protocol.save();

  day.revenueUSD = day.revenueUSD.plus(
    event.params.amount
      .toBigDecimal()
      .times(grtPrice)
      .div(BigInt.fromI32(10).pow(18).toBigDecimal())
  );
  day.save();
}