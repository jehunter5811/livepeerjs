/** @jsx jsx */
import React from 'react'
import { jsx, Styled } from 'theme-ui'
import Button from '../Button'

export default ({ goTo, nextStep }) => {
  return (
    <div sx={{ py: 1 }}>
      <Styled.h2 sx={{ mb: 2 }}>Choose Orchestrator</Styled.h2>
      <Styled.p>
        Click on other orchestrator rows to compare projected rewards and choose
        one you want to stake toward.
      </Styled.p>
      <Styled.p>
        To further evaluate an orchestrator, click on the title in the row to go
        to the details page. Click “Next” when you’ve chosen.
      </Styled.p>
      <Button
        onClick={() => {
          goTo(nextStep)
        }}
        sx={{ position: 'absolute', right: 30, bottom: 16 }}
      >
        Next
      </Button>
    </div>
  )
}
