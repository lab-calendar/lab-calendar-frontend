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

describe('EventChip 말풍선 (KAN-61)', () => {
  it('마우스를 올렸을 때 참석 인원이 보인다', () => {
    render(
      <EventChip
        title="BRL 과제: 저녁"
        hoverText={'BRL 과제: 저녁\n참석 홍길동, 김철수 · 총 2명'}
        categoryKey="card"
        categoryName="카드/경비 사용"
        onActivate={vi.fn()}
      />,
    )

    expect(screen.getByRole('button')).toHaveAttribute(
      'title',
      'BRL 과제: 저녁\n참석 홍길동, 김철수 · 총 2명',
    )
  })

  it('말풍선 문구가 없으면 칩 문구를 그대로 쓴다', () => {
    renderChip()

    expect(screen.getByRole('button')).toHaveAttribute(
      'title',
      '정기 주간 랩미팅 (홍길동)',
    )
  })

  it('칩에 보이는 글은 그대로다 — 말풍선이 이름을 대신하지 않는다', () => {
    // 스크린 리더는 칩 안의 글을 읽는다. title 을 이름으로 삼으면 참석자 명단이
    // 일정 이름처럼 읽혀 목록을 훑기 어려워진다.
    render(
      <EventChip
        title="BRL 과제: 저녁"
        hoverText={'BRL 과제: 저녁\n참석 홍길동 · 총 1명'}
        categoryKey="card"
        categoryName="카드/경비 사용"
        onActivate={vi.fn()}
      />,
    )

    const chip = screen.getByRole('button')
    expect(chip).toHaveAccessibleName(/카드\/경비 사용,\s*BRL 과제: 저녁/)
    expect(chip).not.toHaveAccessibleName(/참석/)
  })
})
