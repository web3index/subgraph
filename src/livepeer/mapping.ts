import { Address, BigInt, dataSource } from "@graphprotocol/graph-ts";
import {
  convertToDecimal,
  sqrtPriceX96ToTokenPrices,
  ZERO_BD,
} from "../helpers";
import { createOrLoadDay, createOrLoadProtocol } from "../helpers";
import { WinningTicketRedeemed } from "../types/livepeer/TicketBroker";
import { UniswapExchange } from "../types/livepeer/UniswapExchange";
import { UniswapV2Pair } from "../types/livepeer/UniswapV2Pair";
import { UniswapV3Pool } from "../types/livepeer/UniswapV3Pool";

export function winningTicketRedeemed(event: WinningTicketRedeemed): void {
  let protocol = createOrLoadProtocol("livepeer");
  let day = createOrLoadDay("livepeer", event.block.timestamp.toI32());
  let fees = convertToDecimal(event.params.faceValue);
  let ethPrice = ZERO_BD;

  if (dataSource.network() == "arbitrum-one") {
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
  }

  if (dataSource.network() == "mainnet") {
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
  }

  protocol.revenueUSD = protocol.revenueUSD.plus(fees.times(ethPrice));
  protocol.save();

  day.revenueUSD = day.revenueUSD.plus(fees.times(ethPrice));
  day.save();
}
