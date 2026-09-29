import { useCallback, useState } from 'react'

const STORAGE_KEY = 'lab-calendar:sidebar-collapsed'

/**
 * 데스크톱에서 제어 영역을 접어 둔 상태 (KAN-81).
 *
 * 브라우저에 적어 둔다. 달력을 넓게 보려고 접은 사람은 다음에 들어와도 넓은 화면을
 * 기대하는데, 새로고침마다 도로 펴지면 매번 다시 접어야 한다.
 *
 * 적어 두는 곳은 이 브라우저의 localStorage 다. 사용자 계정이 없는 서비스라 서버에
 * 둘 자리가 없고, 굳이 둘 만큼 중요한 값도 아니다 — 지워지면 펴진 채로 시작할 뿐이다.
 * 그래서 읽기·쓰기가 모두 실패해도 그냥 넘어간다.
 */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(read)

  const change = useCallback((next: boolean) => {
    setCollapsed(next)
    write(next)
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((previous) => {
      write(!previous)
      return !previous
    })
  }, [])

  return { collapsed, toggle, setCollapsed: change }
}

function read(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    // 저장소를 못 읽으면 펴진 상태로 둔다. 있는 줄 모르는 화면보다 낫다.
    return false
  }
}

function write(collapsed: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed))
  } catch {
    // 못 적어도 이번 방문에서는 상태로 유지된다. 다음 방문에 펴져 있을 뿐이다.
  }
}
