// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'
import { Minus as MinusIcon, Bell as BellIcon } from 'react-feather'
import { formatBalance, formatRoundsToDate, MathBN } from '../../utils'
import {
  Button,
  InlineAccount,
  MetricBox,
  Wrapper,
  UnbondTx,
} from '../../components'
import enhance from './enhance'

export type AccountDelegatingProps = {
  coinbase: GraphQLProps<Coinbase>,
  currentRound: GraphQLProps<Round>,
  delegator: GraphQLProps<Delegator>,
  unbondlocks: GraphQLProps<UnbondLock>,
  history: History,
  match: Match,
  claimEarnings: () => void,
  withdrawStake: () => void,
  withdrawFees: () => void,
}

const AccountDelegating: React.ComponentType<AccountDelegatingProps> = ({
  claimEarnings,
  coinbase,
  currentRound,
  delegator,
  history,
  match,
  withdrawFees,
  withdrawStake,
  unbondlocks,
  processRebond,
  processWithdraw,
}) => {
  const isMe = match.params.accountId === coinbase.data.coinbase
  const { accountId } = match.params
  const {
    bondedAmount,
    delegateAddress,
    delegatedAmount,
    fees,
    lastClaimRound,
    pendingFees,
    pendingStake,
    startRound,
    status,
    withdrawAmount,
    withdrawRound,
  } = delegator.data

  if (unbondlocks) {
    unbondlocks = unbondlocks.filter(item => item['withdrawRound'] !== '0')
  }

  const totalStake = MathBN.max(bondedAmount, pendingStake)
  const { lastInitializedRound } = currentRound.data
  const unclaimedRounds =
    !delegator.loading && !currentRound.loading
      ? MathBN.sub(lastInitializedRound, lastClaimRound)
      : '0'
  const hasUnclaimedRounds = unclaimedRounds !== '0'
  const earnedStake = hasUnclaimedRounds
    ? MathBN.max('0', MathBN.sub(pendingStake, bondedAmount))
    : '0'
  const earnedFees = hasUnclaimedRounds ? MathBN.sub(pendingFees, fees) : '0'
  const hasFees = fees !== '0'
  const isUnbonding = status === 'Unbonding'
  const isBonding = status === 'Pending'
  const isBonded = status === 'Bonded'
  const roundsUntilUnbonded = isUnbonding
    ? MathBN.sub(withdrawRound, lastInitializedRound)
    : ''
  const canWithdraw = !isUnbonding && withdrawAmount !== '0'

  return (
    <Wrapper>
      <MetricBox
        help="A delegator can be in one of the following states: Pending, Bonded, Unbonding or Unbonded"
        title="Status"
        value={status}
        subvalue={
          isBonded
            ? `Bonded to delegate at round #${startRound}`
            : isBonding
            ? `Bonding will complete at round #${startRound}`
            : isUnbonding
            ? `${roundsUntilUnbonded} round(s) left in the unbonding period`
            : ''
        }
      />
      <MetricBox
        help="The ETH account the delegator has bonded token to"
        title="Delegate"
        value={
          !delegateAddress ? (
            'N/A'
          ) : (
            <Link
              onClick={e => {
                if (delegateAddress === accountId) e.preventDefault()
              }}
              to={`/accounts/${delegateAddress}`}
              style={{ textDecoration: 'none' }}
            >
              <InlineAccount address={delegateAddress} border truncate={8} />
            </Link>
          )
        }
        subvalue={
          !delegateAddress ? 'Not currently bonded to any delegate' : ''
        }
      >
        <Button onClick={() => history.push('#/staking-alerts')}>
          <BellIcon size={12} />
          <span style={{ marginLeft: 8 }}>Track performance</span>
        </Button>
      </MetricBox>
      <MetricBox
        help="Total tokens earned from reward cuts each round. Includes unclaimed token rewards."
        title="Stake"
        suffix="LPT"
        value={formatBalance(totalStake, 18)}
        subvalue={
          withdrawRound === '0'
            ? ''
            : MathBN.lt(lastInitializedRound, withdrawRound)
            ? `${formatBalance(
                withdrawAmount,
                18,
              )} LPT may be withdraw approximately on ${formatRoundsToDate(
                withdrawRound - lastInitializedRound,
              )}`
            : `${formatBalance(withdrawAmount, 18)} LPT may be withdrawn`
        }
      >
        {isMe && (
          <React.Fragment>
            {/** request */}
            <Button disabled={!canWithdraw} onClick={withdrawStake}>
              <MinusIcon size={12} />
              <span style={{ marginLeft: 8 }}>withdraw stake</span>
            </Button>
          </React.Fragment>
        )}
      </MetricBox>
      <MetricBox
        help="Total ETH earned from fee shares each round"
        title="Fees"
        suffix="ETH"
        value={formatBalance(fees, 18)}
        subvalue={`${formatBalance(fees, 18, 'wei')} WEI`}
      >
        {isMe && (
          <React.Fragment>
            <Button disabled={!hasFees} onClick={withdrawFees}>
              <MinusIcon size={12} />
              <span style={{ marginLeft: 8 }}>withdraw fees</span>
            </Button>
          </React.Fragment>
        )}
      </MetricBox>
      {delegatedAmount !== '0' && (
        <MetricBox
          help="Total tokens others have bonded to this account"
          title="Delegated Amount"
          suffix="LPT"
          value={formatBalance(delegatedAmount)}
        />
      )}
      <MetricBox
        help="Stake and fees earned since the last claimed round"
        title="Unclaimed Earnings"
        width="100%"
        value={
          !delegateAddress
            ? 'N/A'
            : `${formatBalance(earnedStake, 2)} LPT / ${formatBalance(
                earnedFees,
                2,
              )} ETH`
        }
        subvalue={
          !delegateAddress ? (
            'No round-based earnings are gained when unbonded'
          ) : !hasUnclaimedRounds ? (
            `All caught up!`
          ) : (
            <span>
              {`Earned during the last ${unclaimedRounds} rounds (#${MathBN.add(
                lastClaimRound,
                '1',
              )} - #${lastInitializedRound})`}
            </span>
          )
        }
      >
        {isMe && delegateAddress && hasUnclaimedRounds && (
          <React.Fragment>
            {/** request */}
            <Button onClick={claimEarnings} disabled={unclaimedRounds === '0'}>
              claim stake & fees
            </Button>
          </React.Fragment>
        )}
      </MetricBox>

      {unbondlocks && unbondlocks.length > 0 && (
        <MetricBox
          id="unbondinglocks"
          help="List of unbonding transactions from delegator"
          title="Unbonding Transactions"
          width="100%"
        >
          <div style={{ display: 'block', width: '100%' }}>
            {unbondlocks.map(({ id, amount, withdrawRound }) => (
              <UnbondTx
                isMe={isMe}
                key={id}
                id={id}
                amount={amount}
                currentRound={lastInitializedRound}
                withdrawRound={withdrawRound}
                history={history}
                accountId={accountId}
                processRebond={processRebond}
                processWithdraw={processWithdraw}
                initialValues={{
                  accountId,
                  hash: '',
                }}
              />
            ))}
          </div>
        </MetricBox>
      )}
    </Wrapper>
  )
}

export default enhance(AccountDelegating)
