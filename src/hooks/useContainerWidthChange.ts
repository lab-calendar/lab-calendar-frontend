import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * 감싼 칸의 폭이 바뀔 때 알려 준다 (KAN-92).
 *
 * 창 크기가 아니라 **그 요소**의 크기를 본다. 둘은 다르다 — 제어 영역을 접으면 창은
 * 그대로이고 본문 칸만 넓어지는데, 창에만 귀를 기울이는 쪽(FullCalendar 가 그렇다)은
 * 그때 다시 재지 않아 옛 폭으로 그려 둔 채 남는다.
 *
 * 높이 변화는 흘려보낸다. 부르는 쪽이 다시 재는 일은 대개 값싸지 않고, 높이만 흔들릴
 * 때까지 다시 재면 이득 없이 배치만 흔든다.
 *
 * 다음 프레임으로 미루지 않는다. 화면 밖에 있는 탭에서는 프레임이 돌지 않아 미뤄 둔
 * 일이 탭을 다시 볼 때까지 남는다.
 */
export function useContainerWidthChange(
  ref: RefObject<HTMLElement | null>,
  onWidthChange: () => void,
): void {
  /*
   * 콜백은 렌더마다 새로 만들어져 오는 것이 보통이다. 그대로 의존성에 넣으면 관찰을
   * 붙였다 떼기를 반복하므로, 최신 것을 상자에 담아 두고 관찰은 한 번만 건다.
   */
  const callbackRef = useRef(onWidthChange)
  useEffect(() => {
    callbackRef.current = onWidthChange
  })

  const measuredWidthRef = useRef<number | null>(null)

  useEffect(() => {
    const element = ref.current
    // 서버 렌더나 오래된 브라우저에는 없다. 없으면 창 크기 변화만으로 살아간다.
    if (!element || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      const width = Math.round(entries[0].contentRect.width)
      if (width === measuredWidthRef.current) return

      const first = measuredWidthRef.current === null
      measuredWidthRef.current = width
      // 붙자마자 오는 첫 통지는 "바뀐 것" 이 아니라 지금 크기를 알려 주는 것이다
      if (!first) callbackRef.current()
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
}
