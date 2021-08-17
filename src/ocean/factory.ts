import { BPoolRegistered } from '../types/Factory/Factory'
import { ocean as PoolContract } from '../types/templates'

export function handleNewPool(event: BPoolRegistered): void {
  PoolContract.create(event.params.bpoolAddress)
}
