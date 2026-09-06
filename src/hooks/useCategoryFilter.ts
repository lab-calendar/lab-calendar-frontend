import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CATEGORY_KEYS, type CategoryKey } from '../constants/categories'

const PARAM = 'categories'

/**
 * 선택 상태를 URL 쿼리 파라미터에 담는다.
 * 새로고침해도 유지되고, 필터가 걸린 화면을 그대로 공유할 수 있다.
 *
 * - 파라미터 없음 → 전체 선택 (기본값이므로 URL을 더럽히지 않는다)
 * - 빈 문자열     → 전체 해제
 * - `a,b`         → 해당 카테고리만
 */
function parseSelected(raw: string | null): CategoryKey[] {
  if (raw === null) return [...CATEGORY_KEYS]
  if (raw === '') return []

  const requested = raw.split(',')
  // 알 수 없는 값은 버리고, 항상 정의된 순서를 유지한다
  return CATEGORY_KEYS.filter((key) => requested.includes(key))
}

export function useCategoryFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get(PARAM)

  const selected = useMemo(() => parseSelected(raw), [raw])

  const toggle = useCallback(
    (key: CategoryKey) => {
      const next = selected.includes(key)
        ? selected.filter((selectedKey) => selectedKey !== key)
        : CATEGORY_KEYS.filter(
            (candidate) => candidate === key || selected.includes(candidate),
          )

      setSearchParams(
        (previous) => {
          const params = new URLSearchParams(previous)
          if (next.length === CATEGORY_KEYS.length) {
            params.delete(PARAM)
          } else {
            params.set(PARAM, next.join(','))
          }
          return params
        },
        // 필터 토글이 뒤로가기 기록에 쌓이지 않도록 한다
        { replace: true },
      )
    },
    [selected, setSearchParams],
  )

  return { selected, toggle }
}
