import { Address, BigInt } from "@graphprotocol/graph-ts";
import { convertToDecimal, ZERO_BD } from "../helpers";
import { createOrLoadDay, createOrLoadProtocol } from "../helpers";
import { WinningTicketRedeemed } from "../types/livepeer/TicketBroker";
import { UniswapExchange } from "../types/livepeer/UniswapExchange";
import { UniswapV2Pair } from "../types/livepeer/UniswapV2Pair";

export function winningTicketRedeemed(event: WinningTicketRedeemed): void {
  let protocol = createOrLoadProtocol("livepeer");
  let day = createOrLoadDay("livepeer", event.block.timestamp.toI32());
  let fees = convertToDecimal(event.params.faceValue);
  let ethPrice = ZERO_BD;

  if (event.block.number.gt(BigInt.fromI32(10095742))) {
    let daiEthPair = UniswapV2Pair.bind(
      Address.fromString("0xa478c2975ab1ea89e8196811f51a7b7ade33eb11")
    );
    let daiEthPairReserves = daiEthPair.getReserves();
    ethPrice = convertToDecimal(daiEthPairReserves.value0).div(
      convertToDecimal(daiEthPairReserves.value1)
    );
  } else {
    let daiEthExchange = UniswapExchange.bind(
      Address.fromString("0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667")
    );
    ethPrice = convertToDecimal(
      daiEthExchange.getTokenToEthOutputPrice(BigInt.fromI32(10).pow(18))
    );
  }

  protocol.revenueUSD = protocol.revenueUSD.plus(fees.times(ethPrice));
  protocol.save();

  day.revenueUSD = day.revenueUSD.plus(fees.times(ethPrice));
  day.save();
}
