/** @jsx jsx */
import React, { useState, useEffect } from 'react'
import { jsx, Styled, Flex } from 'theme-ui'
import { DialogOverlay, DialogContent } from '@reach/dialog'
import Button from '../Button'
import dynamic from 'next/dynamic'
import Router, { useRouter } from 'next/router'
import { useWeb3Context } from 'web3-react'
import { useAccount } from '../../hooks'
import Utils from 'web3-utils'
import Copy from '../../static/img/copy.svg'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { useCookies } from 'react-cookie'
import { useApproveMutation } from '../../hooks'
import Step5 from './Step5'
const Tour: any = dynamic(() => import('reactour'), { ssr: false })
const tourStyles = {
  backgroundColor: '#131418',
}

const accentColor = '#E926BE'

export default ({ children }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [tourKey, setTourKey] = useState(0)
  const context = useWeb3Context()
  const { account } = useAccount()
  const [nextStep, setNextStep] = useState(1)
  const inititalSteps = []
  const [steps, setSteps] = useState([...inititalSteps])
  const [copied, setCopied] = useState(false)
  const [cookies, setCookie, removeCookie] = useCookies(['connector'])

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false)
      }, 4000)
    }
  }, [copied])

  useEffect(() => {
    setSteps([
      {
        selector: '.connectWallet',
        content: ({ goTo }) => {
          Router.events.on('routeChangeComplete', url => {
            if (url == '/connect-wallet') goTo(nextStep)
          })
          return (
            <div>
              <Styled.h2 sx={{ mb: 2 }}>Connect Wallet</Styled.h2>
              <Styled.p>
                First things first. Let's connect your wallet.
              </Styled.p>
            </div>
          )
        },
        title: 'Connect Wallet',
        style: tourStyles,
      },
      {
        selector: '.chooseProvider',
        content: ({ goTo }) => {
          Router.events.on('routeChangeComplete', url => {
            if (url == '/connect-wallet?connected=true') goTo(nextStep)
          })
          return (
            <div>
              <Styled.h2 sx={{ mb: 2 }}>Choose Provider</Styled.h2>
              <Styled.p>
                Select your preferred wallet. You can change your selected
                wallet or address later.
              </Styled.p>
            </div>
          )
        },
        title: 'Choose Provider',
        style: tourStyles,
      },

      {
        selector: '.getLPTLink',
        content: ({ goTo }) => {
          Router.events.on('routeChangeComplete', url => {
            if (url.includes('openExchange=true')) {
              goTo(nextStep)
            }
          })
          return (
            <div>
              <Styled.h2 sx={{ mb: 2 }}>Get LPT</Styled.h2>
              <Styled.p>
                You'll need LPT to stake. Let's swap some ETH for LPT on
                Uniswap.
              </Styled.p>
            </div>
          )
        },
        title: 'Get LPT',
        style: tourStyles,
      },
      {
        selector: '.getLPT',
        content: ({ goTo }) => {
          return (
            <div sx={{ pb: 1 }}>
              <Styled.h2 sx={{ mb: 2 }}>Swap ETH for LPT</Styled.h2>
              <div sx={{ lineHeight: 1.5 }}>
                Connect to Uniswap and swap ETH for LPT. Don't have ETH? Get
                some on Coinbase and send to this address:
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
                        {context.account.replace(
                          context.account.slice(7, 37),
                          '…',
                        )}
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
                  {copied && (
                    <span sx={{ fontSize: 12, color: 'text' }}>Copied</span>
                  )}
                </div>
              </div>

              <div sx={{ fontFamily: 'monospace', mb: 1 }}>
                ETH Balance:{' '}
                <span sx={{ fontWeight: 'bold' }}>
                  {account &&
                    parseFloat(Utils.fromWei(account.ethBalance)).toFixed(2)}
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
                  await Router.push(router.pathname) // remove query param
                  if (account.allowance === '0') {
                    goTo(nextStep)
                  } else {
                    goTo(nextStep + 1)
                  }
                }}
              >
                Next
              </Button>
            </div>
          )
        },
        title: 'Get LPT',
        style: tourStyles,
      },
      {
        title: 'Set Permissions',
        style: tourStyles,
        content: ({ goTo }) => {
          return <Step5 goTo={goTo} nextStep={nextStep} />
        },
      },
      {
        selector: '.orchestratorsList',
        content: 'Orchestrators List',
        title: 'Choose Orchestrator',
        style: tourStyles,
      },
    ])
  }, [account, context.active, nextStep, copied])

  return (
    <>
      <Button
        sx={{ mt: 2, width: '100%' }}
        variant="rainbow"
        onClick={async () => {
          setOpen(true)
        }}
      >
        {children}
      </Button>

      <Tour
        disableDotsNavigation={true}
        disableKeyboardNavigation={['right', 'left']}
        key={tourKey}
        showButtons={false}
        accentColor={accentColor}
        maskSpace={10}
        startAt={cookies.connector ? 2 : 0}
        isOpen={tourOpen}
        nextButton={<Button>Next</Button>}
        closeWithMask={false}
        onRequestClose={() => {
          setTourOpen(false)
          setTourKey(tourKey + 1)
        }}
        getCurrentStep={curr => {
          setNextStep(curr + 1)
        }}
        steps={steps}
      />

      {open && (
        <Styled.div
          as={DialogOverlay}
          sx={{ background: 'rgba(0, 0, 0, 0.7)' }}
          onDismiss={() => setOpen(false)}
        >
          <Flex
            as={DialogContent}
            sx={{ p: 0, bg: 'surface', borderRadius: 2 }}
          >
            <Flex
              sx={{
                background: 'linear-gradient(180deg, #00ED6D 0%, #2C785F 100%)',
                minWidth: 220,
                width: 220,
                flexDirection: 'column',
                px: 3,
                py: 4,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {[
                'Connect Wallet',
                'Get LPT',
                'Set Permissions',
                'Choose Orchestrator',
                'Stake',
              ].map((title, i) => (
                <Flex
                  key={i}
                  sx={{ flexDirection: 'column', alignItems: 'center' }}
                >
                  <Flex
                    sx={{
                      color: 'rgba(255, 255, 255, .5)',
                      border: '4px solid',
                      borderRadius: 1000,
                      borderColor: 'rgba(255, 255, 255, .5)',
                      width: '40px',
                      height: '40px',
                      fontWeight: 500,
                      fontSize: 3,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {i}
                  </Flex>
                  <div
                    sx={{
                      lineHeight: '24px',
                      textAlign: 'center',
                      fontWeight: 500,
                      mt: 1,
                      mb: i == 4 ? 0 : 1,
                    }}
                  >
                    {title}
                  </div>
                  {!(i == 4) && (
                    <div
                      sx={{
                        width: 1,
                        mb: 2,
                        height: 18,
                        backgroundColor: 'rgba(255, 255, 255, .5)',
                      }}
                    />
                  )}
                </Flex>
              ))}
            </Flex>
            <Flex
              sx={{
                width: '100%',
                p: 5,
                alignItems: 'flex-start',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Styled.h1 as="h2" sx={{ mb: 2 }}>
                Welcome to the Livepeer Staking Guide
              </Styled.h1>
              <Styled.p>
                Not sure how to get started? No worries, we’ve got you covered.
              </Styled.p>
              <Styled.p>
                Our staking guide takes you step-by-step through the process of
                staking your first Livepeer tokens.
              </Styled.p>
              <Button
                sx={{ justifySelf: 'flex-start', mt: 2 }}
                variant="secondary"
                onClick={() => {
                  setOpen(false)
                  setTourOpen(true)
                }}
              >
                Let's Get Started
              </Button>
            </Flex>
          </Flex>
        </Styled.div>
      )}
    </>
  )
}
