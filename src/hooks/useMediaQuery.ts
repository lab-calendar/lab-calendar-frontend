import { useCallback, useSyncExternalStore } from 'react'

/**
 * 미디어 쿼리 일치 여부를 구독한다.
 * 브레이크포인트 값은 tokens.css 의 레이아웃 주석을 참고한다.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQueryList = window.matchMedia(query)
      mediaQueryList.addEventListener('change', onStoreChange)
      return () => mediaQueryList.removeEventListener('change', onStoreChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // 서버 렌더링 시에는 데스크톱을 기준으로 둔다
    () => false,
  )
}
