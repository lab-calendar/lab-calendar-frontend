import { useCallback, useEffect, useState } from 'react'
import {
  applyTheme,
  nextChoice,
  rememberChoice,
  storedChoice,
  systemPrefersDark,
  type ResolvedTheme,
  type ThemeChoice,
} from './theme'

type Theme = {
  choice: ThemeChoice
  resolved: ResolvedTheme
  cycle: () => void
}

/**
 * 고른 테마를 들고 있다가 문서에 적는다 (KAN-106).
 *
 * 처음 값은 `index.html` 의 선행 스크립트가 읽은 것과 같은 곳에서 읽는다. 둘이
 * 어긋나면 첫 그림과 앱이 다른 테마를 가리켜 한 번 번쩍인다.
 */
export function useTheme(): Theme {
  const [choice, setChoice] = useState<ThemeChoice>(storedChoice)
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark)

  /*
   * 렌더 중에 계산한다. 효과 안에서 또 상태를 바꾸면 그릴 때마다 렌더가 한 번씩
   * 더 돈다 — 여기서 필요한 것은 두 값에서 나오는 결과일 뿐이다.
   */
  const resolved: ResolvedTheme =
    choice === 'system' ? (systemDark ? 'dark' : 'light') : choice

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  useEffect(() => {
    rememberChoice(choice)
  }, [choice])

  /*
   * 기기 설정이 바뀌는 것을 듣는다 — 해 질 녘에 저절로 어두워지는 기기가 있다.
   *
   * 고정해 둔 동안에도 듣기만 한다. 값은 들고 있되 위에서 무시되므로, 나중에
   * "기기 설정" 으로 돌아왔을 때 묵은 값으로 한 번 잘못 칠하는 일이 없다.
   */
  useEffect(() => {
    if (typeof matchMedia !== 'function') return

    const query = matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const cycle = useCallback(() => setChoice(nextChoice), [])

  return { choice, resolved, cycle }
}
