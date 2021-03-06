// Import types and APIs from graph-ts
import { Address, store, BigInt, log } from '@graphprotocol/graph-ts'

// Import event types from the registrar contract ABIs
import {
  BondingManager,
  WithdrawStake,
  Bond,
  Unbond,
  Rebond
} from '../types/BondingManager_LIP11/BondingManager'
import { RoundsManager } from '../types/RoundsManager/RoundsManager'

// Import entity types generated from the GraphQL schema
import {
  Transcoder,
  Delegator,
  UnbondingLock,
  BondEvent,
  UnbondEvent,
  WithdrawStakeEvent,
  RebondEvent
} from '../types/schema'

import { makeUnbondingLockId } from './util'

// Bind RoundsManager contract
let roundsManager = RoundsManager.bind(
  Address.fromString('3984fc4ceeef1739135476f625d36d6c35c40dc3')
)

export function bond(event: Bond): void {
  let bondingManager = BondingManager.bind(event.address)
  let newDelegateAddress = event.params.newDelegate
  let oldDelegateAddress = event.params.oldDelegate
  let delegatorAddress = event.params.delegator
  let additionalAmount = event.params.additionalAmount
  let transcoderTotalStake = bondingManager.transcoderTotalStake(
    newDelegateAddress
  )
  let currentRound = roundsManager.currentRound()
  let delegatorData = bondingManager.getDelegator(delegatorAddress)
  let EMPTY_ADDRESS = Address.fromString(
    '0000000000000000000000000000000000000000'
  )

  let transcoder = Transcoder.load(newDelegateAddress.toHex())
  if (transcoder == null) {
    transcoder = new Transcoder(newDelegateAddress.toHex())
  }

  let delegate = Delegator.load(newDelegateAddress.toHex())
  if (delegate == null) {
    delegate = new Delegator(newDelegateAddress.toHex())
  }

  let delegator = Delegator.load(delegatorAddress.toHex())
  if (delegator == null) {
    delegator = new Delegator(delegatorAddress.toHex())
  }

  if (transcoder.delegators == null) {
    transcoder.delegators = new Array<string>()
  }

  // If self delegating, assign reference to self
  if (delegatorAddress.toHex() == newDelegateAddress.toHex()) {
    transcoder.delegator = delegatorAddress.toHex()
  }

  // Changing delegate
  if (
    oldDelegateAddress.toHex() != EMPTY_ADDRESS.toHex() &&
    oldDelegateAddress.toHex() != newDelegateAddress.toHex()
  ) {
    let oldTranscoder = Transcoder.load(oldDelegateAddress.toHex())
    let oldDelegate = Delegator.load(oldDelegateAddress.toHex())
    let oldTranscoderTotalStake = bondingManager.transcoderTotalStake(
      oldDelegateAddress
    )

    oldTranscoder.totalStake = oldTranscoderTotalStake
    oldDelegate.delegatedAmount = oldTranscoderTotalStake

    // remove from old transcoder's array of delegators
    let oldTranscoderDelegators = oldTranscoder.delegators
    if (oldTranscoderDelegators.length) {
      let i = oldTranscoderDelegators.indexOf(delegatorAddress.toHex())
      oldTranscoderDelegators.splice(i, 1)
      oldTranscoder.delegators = oldTranscoderDelegators
    }

    oldDelegate.save()
    oldTranscoder.save()
  }

  // Update transcoder / delegate
  let delegators = transcoder.delegators
  let i = delegators.indexOf(delegatorAddress.toHex())
  if (i == -1) {
    delegators.push(delegatorAddress.toHex())
    transcoder.delegators = delegators
  }
  transcoder.totalStake = transcoderTotalStake
  delegate.delegatedAmount = transcoderTotalStake

  delegator.delegate = newDelegateAddress.toHex()
  delegator.lastClaimRound = currentRound.toString()
  delegator.bondedAmount = delegatorData.value0
  delegator.fees = delegatorData.value1
  delegator.startRound = delegatorData.value4
  delegator.principal = delegator.principal.plus(additionalAmount)

  delegate.save()
  delegator.save()
  transcoder.save()

  // Store transaction info
  let bondEvent = new BondEvent(event.transaction.hash.toHex() + '-Bond')
  bondEvent.hash = event.transaction.hash.toHex()
  bondEvent.blockNumber = event.block.number
  bondEvent.gasUsed = event.transaction.gasUsed
  bondEvent.gasPrice = event.transaction.gasPrice
  bondEvent.timestamp = event.block.timestamp
  bondEvent.from = event.transaction.from.toHex()
  bondEvent.to = event.transaction.to.toHex()
  bondEvent.round = currentRound.toString()
  bondEvent.newDelegate = newDelegateAddress.toHex()
  bondEvent.oldDelegate = oldDelegateAddress.toHex()
  bondEvent.delegator = delegatorAddress.toHex()
  bondEvent.additionalAmount = additionalAmount
  bondEvent.save()
}

// Handler for Unbond events
export function unbond(event: Unbond): void {
  let bondingManager = BondingManager.bind(event.address)
  let delegateAddress = event.params.delegate
  let delegatorAddress = event.params.delegator
  let unbondingLockId = event.params.unbondingLockId
  let uniqueUnbondingLockId = makeUnbondingLockId(
    delegatorAddress,
    unbondingLockId
  )
  let withdrawRound = event.params.withdrawRound
  let amount = event.params.amount
  let delegator = Delegator.load(delegatorAddress.toHex())
  let totalStake = bondingManager.transcoderTotalStake(delegateAddress)
  let currentRound = roundsManager.currentRound()

  let transcoder = Transcoder.load(delegateAddress.toHex())
  if (transcoder == null) {
    transcoder = new Transcoder(delegateAddress.toHex())
  }

  let delegate = Delegator.load(delegateAddress.toHex())
  if (delegate == null) {
    delegate = new Delegator(delegateAddress.toHex())
  }

  let unbondingLock = UnbondingLock.load(uniqueUnbondingLockId)
  if (unbondingLock == null) {
    unbondingLock = new UnbondingLock(uniqueUnbondingLockId)
  }

  delegate.delegatedAmount = totalStake
  transcoder.totalStake = totalStake

  let delegatorData = bondingManager.getDelegator(delegatorAddress)
  delegator.lastClaimRound = currentRound.toString()
  delegator.bondedAmount = delegatorData.value0
  delegator.fees = delegatorData.value1
  delegator.startRound = delegatorData.value4
  delegator.unbonded = delegator.unbonded.plus(amount)

  // Delegator no longer delegated to anyone if it does not have a bonded amount
  // so remove it from delegate
  if (delegatorData.value0.isZero()) {
    let delegators = transcoder.delegators
    if (delegators != null) {
      let i = delegators.indexOf(delegatorAddress.toHex())
      delegators.splice(i, 1)
      transcoder.delegators = delegators
    }

    // Update delegator's delegate
    delegator.delegate = null
  }

  unbondingLock.unbondingLockId = unbondingLockId.toI32()
  unbondingLock.delegator = delegatorAddress.toHex()
  unbondingLock.delegate = delegateAddress.toHex()
  unbondingLock.withdrawRound = withdrawRound
  unbondingLock.amount = amount

  // Apply store updates
  delegate.save()
  transcoder.save()
  unbondingLock.save()
  delegator.save()

  // Store transaction info
  let unbondEvent = new UnbondEvent(event.transaction.hash.toHex() + '-Unbond')
  unbondEvent.hash = event.transaction.hash.toHex()
  unbondEvent.blockNumber = event.block.number
  unbondEvent.gasUsed = event.transaction.gasUsed
  unbondEvent.gasPrice = event.transaction.gasPrice
  unbondEvent.timestamp = event.block.timestamp
  unbondEvent.from = event.transaction.from.toHex()
  unbondEvent.to = event.transaction.to.toHex()
  unbondEvent.round = currentRound.toString()
  unbondEvent.amount = amount
  unbondEvent.withdrawRound = unbondingLock.withdrawRound
  unbondEvent.unbondingLockId = unbondingLock.unbondingLockId
  unbondEvent.delegate = delegateAddress.toHex()
  unbondEvent.delegator = delegator.id
  unbondEvent.save()
}

// Handler for Rebond events
export function rebond(event: Rebond): void {
  let bondingManager = BondingManager.bind(event.address)
  let delegateAddress = event.params.delegate
  let delegatorAddress = event.params.delegator
  let amount = event.params.amount
  let unbondingLockId = event.params.unbondingLockId
  let uniqueUnbondingLockId = makeUnbondingLockId(
    delegatorAddress,
    unbondingLockId
  )
  let transcoder = Transcoder.load(delegateAddress.toHex())
  let delegate = Delegator.load(delegateAddress.toHex())
  let delegator = Delegator.load(delegatorAddress.toHex())
  let totalStake = bondingManager.transcoderTotalStake(delegateAddress)
  let currentRound = roundsManager.currentRound()

  // update delegator
  let delegatorData = bondingManager.getDelegator(delegatorAddress)
  delegator.delegate = delegateAddress.toHex()
  delegator.startRound = delegatorData.value4
  delegator.lastClaimRound = currentRound.toString()
  delegator.bondedAmount = delegatorData.value0
  delegator.fees = delegatorData.value1
  delegator.unbonded = delegator.unbonded.minus(amount)

  // update delegate
  delegate.delegatedAmount = totalStake
  transcoder.totalStake = totalStake

  // Apply store updates
  delegate.save()
  transcoder.save()
  delegator.save()
  store.remove('UnbondingLock', uniqueUnbondingLockId)

  // Store transaction info
  let rebondEvent = new RebondEvent(event.transaction.hash.toHex() + 'Rebond')
  rebondEvent.hash = event.transaction.hash.toHex()
  rebondEvent.blockNumber = event.block.number
  rebondEvent.gasUsed = event.transaction.gasUsed
  rebondEvent.gasPrice = event.transaction.gasPrice
  rebondEvent.timestamp = event.block.timestamp
  rebondEvent.from = event.transaction.from.toHex()
  rebondEvent.to = event.transaction.to.toHex()
  rebondEvent.round = currentRound.toString()
  rebondEvent.delegator = delegator.id
  rebondEvent.delegate = delegate.id
  rebondEvent.amount = amount
  rebondEvent.unbondingLockId = unbondingLockId.toI32()
  rebondEvent.save()
}

// Handler for WithdrawStake events
export function withdrawStake(event: WithdrawStake): void {
  let delegatorAddress = event.params.delegator
  let unbondingLockId = event.params.unbondingLockId
  let amount = event.params.amount
  let currentRound = roundsManager.currentRound()
  let uniqueUnbondingLockId = makeUnbondingLockId(
    delegatorAddress,
    unbondingLockId
  )
  store.remove('UnbondingLock', uniqueUnbondingLockId)

  // Store transaction info
  let withdrawStakeEvent = new WithdrawStakeEvent(
    event.transaction.hash.toHex() + 'WithdrawStake'
  )
  withdrawStakeEvent.hash = event.transaction.hash.toHex()
  withdrawStakeEvent.blockNumber = event.block.number
  withdrawStakeEvent.gasUsed = event.transaction.gasUsed
  withdrawStakeEvent.gasPrice = event.transaction.gasPrice
  withdrawStakeEvent.timestamp = event.block.timestamp
  withdrawStakeEvent.from = event.transaction.from.toHex()
  withdrawStakeEvent.to = event.transaction.to.toHex()
  withdrawStakeEvent.round = currentRound.toString()
  withdrawStakeEvent.amount = amount
  withdrawStakeEvent.unbondingLockId = unbondingLockId.toI32()
  withdrawStakeEvent.delegator = delegatorAddress.toHex()
  withdrawStakeEvent.save()
}
