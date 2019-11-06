/** @jsx jsx */
import React, { useState, useEffect } from 'react'
import { jsx, Styled } from 'theme-ui'
import Router, { useRouter } from 'next/router'
import Copy from '../../static/img/copy.svg'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import Button from '../Button'
import { removeURLParameter } from '../../lib/utils'
import Utils from 'web3-utils'
import { useWeb3Context } from 'web3-react'
import { useAccount } from '../../hooks'

export default ({ goTo, nextStep }) => {
  const router = useRouter()
  const context = useWeb3Context()
  const { account } = useAccount()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false)
      }, 4000)
    }
  }, [copied])

  return (
    <div sx={{ pb: 1 }}>
      <Styled.h2 sx={{ mb: 2 }}>Swap ETH for LPT</Styled.h2>
      <div sx={{ lineHeight: 1.5 }}>
        Connect to Uniswap and swap ETH for LPT. Don't have ETH? Get some on
        Coinbase and send to this address:
        <div
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            fontFamily: 'monospace',
            mb: 3,
          }}
        >
          <CopyToClipboard
            text={context.account}
            onCopy={() => setCopied(true)}
          >
            <div>
              <span sx={{ mx: 1 }}>
                {context.account.replace(context.account.slice(7, 37), '…')}
              </span>
              <Copy
                sx={{
                  mr: 1,
                  cursor: 'pointer',
                  width: 16,
                  height: 16,
                  color: 'text',
                }}
              />
            </div>
          </CopyToClipboard>
          {copied && <span sx={{ fontSize: 12, color: 'text' }}>Copied</span>}
        </div>
      </div>

      <div sx={{ fontFamily: 'monospace', mb: 1 }}>
        ETH Balance:{' '}
        <span sx={{ fontWeight: 'bold' }}>
          {account && parseFloat(Utils.fromWei(account.ethBalance)).toFixed(2)}
        </span>
      </div>
      <div sx={{ fontFamily: 'monospace' }}>
        LPT Balance:{' '}
        <span sx={{ fontWeight: 'bold' }}>
          {account &&
            parseFloat(Utils.fromWei(account.tokenBalance)).toFixed(2)}
        </span>
      </div>
      <Button
        disabled={account && account.tokenBalance === '0'}
        sx={{ position: 'absolute', right: 30, bottom: 16 }}
        onClick={async () => {
          await Router.push(
            removeURLParameter(router.pathname, 'openExchange'),
            removeURLParameter(router.asPath, 'openExchange'),
          ) // remove query param
          if (account.allowance === '0') {
            goTo(nextStep)
          } else {
            await Router.push('/')
            goTo(nextStep + 1)
          }
        }}
      >
        Next
      </Button>
    </div>
  )
}
