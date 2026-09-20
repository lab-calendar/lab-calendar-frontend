import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

const PARAM = 'date'

/** YYYY-MM-DD 인지. 달력을 옮길 값이므로 형식이 어긋나면 무시한다. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * 달력이 보여줄 달을 URL 에 담는다 (KAN-52).
 *
 * 컴포넌트 사이에 ref 를 넘기는 대신 URL 을 쓴다. D-Day 위젯과 달력은 형제라
 * 상태를 위로 올려야 하는데, 올린 김에 주소에 두면 새로고침해도 그 달이 남고
 * "이 마감 좀 봐" 하며 링크를 그대로 건넬 수 있다.
 *
 * 값이 없으면 달력이 알아서 이번 달을 연다.
 */
export function useFocusDate() {
  const [searchParams, setSearchParams] = useSearchParams()

  const raw = searchParams.get(PARAM)
  const focusDate = raw !== null && ISO_DATE.test(raw) ? raw : null

  const focusOn = useCallback(
    (date: string) => {
      setSearchParams(
        (previous) => {
          const params = new URLSearchParams(previous)
          params.set(PARAM, date)
          return params
        },
        // 위젯을 몇 번 눌렀다고 뒤로가기가 그만큼 쌓이면 안 된다
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return { focusDate, focusOn }
}
