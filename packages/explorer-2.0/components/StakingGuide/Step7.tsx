/** @jsx jsx */
import React from 'react'
import { jsx, Styled } from 'theme-ui'

export default ({ goTo, nextStep }) => {
  return (
    <div sx={{ py: 1 }}>
      <Styled.h2 sx={{ mb: 2 }}>Stake</Styled.h2>
      <Styled.p>
        To stake, click the "Stake" button on the bottom of the calculator.
      </Styled.p>
      <Styled.p>
        Once you hit stake, your wallet provider will ask you to confirm.
      </Styled.p>
    </div>
  )
}
