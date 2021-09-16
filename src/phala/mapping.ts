import { Address, BigInt } from "@graphprotocol/graph-ts";
import { convertToDecimal, ZERO_BD } from "../helpers";
import { createOrLoadDay, createOrLoadProtocol, getPairPrice } from "../helpers";
import { Transfer } from "../types/phala/Transfer";

export function handleTransfer(event: Transfer): void {
  let protocol = createOrLoadProtocol("phala");
  let day = createOrLoadDay("phala", event.block.timestamp.toI32());
  let USDC_PHA_PAIR = "0x479745658a6aec2de6318273944d9549457ba813"
  let pairPrice = getPairPrice(USDC_PHA_PAIR, BigInt.fromI32(6), BigInt.fromI32(18));
  let amount = convertToDecimal(event.params.amount);

  protocol.revenueUSD = protocol.revenueUSD.plus(amount.times(pairPrice));
  protocol.save();

  day.revenueUSD = day.revenueUSD.plus(amount.times(pairPrice));
  day.save();
}
