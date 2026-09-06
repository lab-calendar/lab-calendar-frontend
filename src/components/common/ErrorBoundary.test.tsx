import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/errors'
import ErrorBoundary from './ErrorBoundary'

function Boom({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new ApiError('SERVER', '서버가 응답하지 않습니다.')
  return <p>정상 화면</p>
}

/** 다시 시도하면 예외를 던지지 않도록 바꿔 주는 껍데기. */
function Harness() {
  const [shouldThrow, setShouldThrow] = useState(true)

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <p>화면을 표시하지 못했습니다</p>
          <p>{(error as Error).message}</p>
          <button
            type="button"
            onClick={() => {
              setShouldThrow(false)
              reset()
            }}
          >
            다시 시도
          </button>
        </div>
      )}
    >
      <Boom shouldThrow={shouldThrow} />
    </ErrorBoundary>
  )
}

beforeEach(() => {
  // React 가 경계에서 잡은 예외를 콘솔에도 남긴다. 테스트 출력만 조용히 한다.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('예외가 없으면 그대로 그린다', () => {
    render(
      <ErrorBoundary fallback={() => <p>대체 화면</p>}>
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('정상 화면')).toBeInTheDocument()
  })

  it('렌더 중 터지면 흰 화면 대신 안내를 보여준다', () => {
    render(
      <ErrorBoundary
        fallback={(error) => <p>{(error as Error).message}</p>}
      >
        <Boom shouldThrow />
      </ErrorBoundary>,
    )

    expect(screen.getByText('서버가 응답하지 않습니다.')).toBeInTheDocument()
  })

  it('다시 시도하면 원래 화면으로 돌아간다', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByText('화면을 표시하지 못했습니다')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(screen.getByText('정상 화면')).toBeInTheDocument()
  })
})
