import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useToast } from '../../contexts/ToastContext'
import ToastProvider from './ToastProvider'

function Trigger() {
  const { showToast } = useToast()

  return (
    <>
      <button type="button" onClick={() => showToast('저장했습니다.')}>
        성공 알림
      </button>
      <button
        type="button"
        onClick={() => showToast('저장하지 못했습니다.', 'error')}
      >
        실패 알림
      </button>
    </>
  )
}

function renderProvider() {
  return render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  )
}

describe('ToastProvider', () => {
  it('알림이 없으면 아무것도 그리지 않는다', () => {
    renderProvider()

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('성공 알림은 status 로 알린다', async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole('button', { name: '성공 알림' }))

    expect(screen.getByRole('status')).toHaveTextContent('저장했습니다.')
  })

  it('실패 알림은 읽던 것을 끊고 먼저 읽도록 alert 로 알린다', async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole('button', { name: '실패 알림' }))

    expect(screen.getByRole('alert')).toHaveTextContent('저장하지 못했습니다.')
  })

  it('닫기 버튼을 누르면 사라진다', async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole('button', { name: '성공 알림' }))
    await user.click(screen.getByRole('button', { name: '알림 닫기' }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('여러 개를 띄우면 쌓인다', async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole('button', { name: '성공 알림' }))
    await user.click(screen.getByRole('button', { name: '실패 알림' }))

    expect(screen.getAllByRole('button', { name: '알림 닫기' })).toHaveLength(2)
  })

  it('시간이 지나면 저절로 사라진다', async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole('button', { name: '성공 알림' }))
    expect(screen.getByRole('status')).toBeInTheDocument()

    await waitFor(
      () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
      { timeout: 5000 },
    )
  })
})

describe('useToast', () => {
  it('Provider 밖에서 쓰면 바로 알려 준다', () => {
    expect(() => render(<Trigger />)).toThrow(/ToastProvider/)
  })
})
