import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useCategoryFilter } from './useCategoryFilter'

function wrapperFor(route: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
  }
}

function renderFilter(route: string) {
  return renderHook(() => useCategoryFilter(), { wrapper: wrapperFor(route) })
}

describe('useCategoryFilter', () => {
  it('파라미터가 없으면 전체를 선택한 것으로 본다', () => {
    const { result } = renderFilter('/')

    expect(result.current.selected).toEqual(['project', 'lab', 'card'])
  })

  it('빈 값이면 전체 해제로 본다', () => {
    const { result } = renderFilter('/?categories=')

    expect(result.current.selected).toEqual([])
  })

  it('지정된 카테고리만 선택하되 정의된 순서를 유지한다', () => {
    const { result } = renderFilter('/?categories=card,project')

    expect(result.current.selected).toEqual(['project', 'card'])
  })

  it('알 수 없는 값은 버린다', () => {
    const { result } = renderFilter('/?categories=project,bogus')

    expect(result.current.selected).toEqual(['project'])
  })

  it('선택된 항목을 토글하면 해제된다', () => {
    const { result } = renderFilter('/')

    act(() => {
      result.current.toggle('project')
    })

    expect(result.current.selected).toEqual(['lab', 'card'])
  })

  it('해제된 항목을 토글하면 정의된 순서 자리에 다시 들어간다', () => {
    const { result } = renderFilter('/?categories=card')

    act(() => {
      result.current.toggle('project')
    })

    expect(result.current.selected).toEqual(['project', 'card'])
  })

  it('마지막 하나까지 해제할 수 있다', () => {
    const { result } = renderFilter('/?categories=card')

    act(() => {
      result.current.toggle('card')
    })

    expect(result.current.selected).toEqual([])
  })
})
