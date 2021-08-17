import { BPoolRegistered } from '../types/Factory/Factory'
import { Pool as PoolContract } from '../types/templates/ocean/Pool'

export function handleNewPool(event: BPoolRegistered): void {
  PoolContract.create(event.params.bpoolAddress)
}
