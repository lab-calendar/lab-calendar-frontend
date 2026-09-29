import { useCallback, useState } from 'react'
import { todayIso } from '../utils/date'

/**
 * 하루에 한 번만 보여주는 알림 (KAN-53).
 *
 * 마감 알림은 들어올 때마다 뜨면 곧 닫는 동작이 반사가 되어 읽히지 않는다. 날짜를
 * 하나 적어 두고 그 날짜가 오늘이면 건너뛴다.
 *
 * 적어 두는 곳은 이 브라우저의 localStorage 다. 사용자 계정이 없는 서비스라
 * 서버에 둘 자리가 없고, 굳이 둘 만큼 중요한 값도 아니다 — 지워지면 한 번 더
 * 뜰 뿐이다. 그래서 읽기·쓰기가 모두 실패해도 그냥 넘어간다: 시크릿 창이나
 * 사이트 데이터를 막아 둔 브라우저에서는 접근 자체가 예외를 던진다.
 */
export function useDailyNotice(storageKey: string) {
  const [dismissedOn, setDismissedOn] = useState(() => read(storageKey))

  const dismiss = useCallback(() => {
    const today = todayIso()
    setDismissedOn(today)
    write(storageKey, today)
  }, [storageKey])

  return { shouldShow: dismissedOn !== todayIso(), dismiss }
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    // 저장소를 못 읽으면 "본 적 없음" 으로 둔다. 알림이 한 번 더 뜨는 쪽이
    // 마감을 놓치는 것보다 낫다.
    return null
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // 못 적어도 이번 방문에서는 상태로 닫혀 있다. 다음 방문에 다시 뜰 뿐이다.
  }
}
