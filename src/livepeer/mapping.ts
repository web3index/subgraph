import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  convertToDecimal,
  sqrtPriceX96ToTokenPrices,
  ZERO_BD,
} from "../helpers";
import { createOrLoadDay, createOrLoadProtocol } from "../helpers";
import { WinningTicketRedeemed } from "../generated/livepeer/TicketBroker"; 
import { UniswapV3Pool } from "../generated/livepeer/UniswapV3Pool";

export function winningTicketRedeemed(event: WinningTicketRedeemed): void {
  let protocol = createOrLoadProtocol("livepeer");
  let day = createOrLoadDay("livepeer", event.block.timestamp.toI32());
  let fees = convertToDecimal(event.params.faceValue);
  let ethPrice = ZERO_BD;

  let daiEthPool = UniswapV3Pool.bind(
    Address.fromString("0xa961f0473da4864c5ed28e00fcc53a3aab056c1b")
  );
  let slot0 = daiEthPool.slot0();
  let sqrtPriceX96 = slot0.value0;
  let prices = sqrtPriceX96ToTokenPrices(
    sqrtPriceX96,
    BigInt.fromI32(18),
    BigInt.fromI32(18)
  );
  ethPrice = prices[1];

  protocol.revenueUSD = protocol.revenueUSD.plus(fees.times(ethPrice));
  protocol.save();

  day.revenueUSD = day.revenueUSD.plus(fees.times(ethPrice));
  day.save();
}
