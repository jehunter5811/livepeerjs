/** @jsx jsx */
import { Styled, jsx } from 'theme-ui'
import QRCode from 'qrcode.react'
import Chip from '../../components/Chip'
import { Transcoder, Delegator } from '../../@types'

interface Props {
  account: string
  role: string
  hasLivepeerToken: boolean
  delegator: Delegator
  transcoder: Transcoder
  isMyAccount: boolean
}

export default ({
  account,
  role = 'Orchestrator',
  hasLivepeerToken,
  delegator,
  transcoder,
  isMyAccount = false,
  ...props
}: Props) => {
  const isLivepeerAware =
    hasLivepeerToken || role == 'Orchestrator' || role == 'Tokenholder'

  return (
    <div {...props}>
      <div
        sx={{
          mb: 2,
          width: 70,
          height: 70,
          position: 'relative',
        }}
      >
        <QRCode
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 1000,
          }}
          fgColor={`#${account.substr(2, 6)}`}
          value={account}
        />

        {role == 'Orchestrator' && transcoder.active && (
          <div
            sx={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              backgroundColor: 'primary',
              border: '4px solid #131418',
              boxSizing: 'border-box',
              width: 18,
              height: 18,
              borderRadius: 1000,
            }}
          ></div>
        )}
      </div>
      <Styled.h1 sx={{ mb: 2 }}>
        {isMyAccount
          ? 'My Account'
          : account.replace(account.slice(7, 37), '…')}
      </Styled.h1>
      {isLivepeerAware && <Chip label={role} />}
    </div>
  )
}
