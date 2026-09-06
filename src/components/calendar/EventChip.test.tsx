import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventChip from './EventChip'

function renderChip(onActivate = vi.fn()) {
  render(
    <EventChip
      title="정기 주간 랩미팅 (홍길동)"
      categoryKey="lab"
      categoryName="랩실 주기적 일정"
      onActivate={onActivate}
    />,
  )
  return onActivate
}

describe('EventChip', () => {
  it('키보드로 닿을 수 있는 버튼이다', () => {
    renderChip()

    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0')
  })

  it('Enter 로 상세를 연다', async () => {
    const user = userEvent.setup()
    const onActivate = renderChip()

    screen.getByRole('button').focus()
    await user.keyboard('{Enter}')

    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('Space 로도 상세를 연다', async () => {
    const user = userEvent.setup()
    const onActivate = renderChip()

    screen.getByRole('button').focus()
    await user.keyboard(' ')

    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('다른 키에는 반응하지 않는다', async () => {
    const user = userEvent.setup()
    const onActivate = renderChip()

    screen.getByRole('button').focus()
    await user.keyboard('{ArrowRight}')

    expect(onActivate).not.toHaveBeenCalled()
  })

  it('스크린 리더가 카테고리를 읽을 수 있게 이름에 넣는다', () => {
    renderChip()

    // 모양 표식은 aria-hidden 이라 이름에 섞이지 않는다
    expect(
      screen.getByRole('button', {
        name: '랩실 주기적 일정,정기 주간 랩미팅 (홍길동)',
      }),
    ).toBeInTheDocument()
  })

  it('색 없이도 구분되도록 카테고리 표식을 함께 그린다', () => {
    renderChip()

    expect(screen.getByRole('button')).toHaveTextContent('●')
  })
})
