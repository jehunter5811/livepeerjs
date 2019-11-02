/** @jsx jsx */
import React, { useState, useEffect } from 'react'
import { jsx, Styled, Flex } from 'theme-ui'
import { DialogOverlay, DialogContent } from '@reach/dialog'
import Button from '../Button'
import dynamic from 'next/dynamic'
import Router, { useRouter } from 'next/router'
import { useWeb3Context } from 'web3-react'
import { useAccount } from '../../hooks'

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

  let inititalSteps = []

  let [steps, setSteps] = useState([...inititalSteps])

  useEffect(() => {
    setSteps([
      {
        selector: '.connectWallet',
        content: ({ goTo }) => {
          Router.events.on('routeChangeComplete', url => {
            if (url == '/connect-wallet') goTo(1)
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
        content: ({ goTo, inDOM }) => {
          Router.events.on('routeChangeComplete', url => {
            // TODO: if already has lpt go to 4
            if (url == '/connect-wallet?connected=true') goTo(2)
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
              goTo(3)
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
        content: ({ goTo, inDOM }) => {
          // if (account && account.tokenBalance) {

          //   goTo(5)
          // }
          // TODO: show checkmark next to eth and lpt balances
          return (
            <div>
              <Styled.h2 sx={{ mb: 2 }}>Swap ETH for LPT</Styled.h2>
              <Styled.p>
                Connect to Uniswap and swap ETH for LPT. Don't have ETH? You can
                get some on Coinbase.
              </Styled.p>
              <div>Balance: {account && account.tokenBalance}</div>
              <Button
                onClick={async () => {
                  await Router.push(router.pathname) // remove query param
                  goTo(5)
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
        content: 'Approve Livepeer tokens for staking.',
        title: 'Set Permissions',
        style: tourStyles,
      },
      {
        selector: '.my-fith-step',
        content: 'This another awesome feature!',
        title: 'Choose Orchestrator',
        style: tourStyles,
      },
      {
        selector: '.my-fith-step',
        content: 'This another awesome feature!',
        title: 'Stake',
        style: tourStyles,
      },
    ])
  }, [account])

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
        key={tourKey}
        showButtons={false}
        accentColor={accentColor}
        maskSpace={10}
        startAt={0}
        isOpen={tourOpen}
        nextButton={<Button>Next</Button>}
        onRequestClose={() => {
          setTourOpen(false)
          setTourKey(tourKey + 1)
        }}
        // getCurrentStep={curr => {
        //   setCurrentStep(curr + 1)
        // }}
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
