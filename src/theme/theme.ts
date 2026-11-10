/**
 * 테마 고르기 (KAN-106).
 *
 * 고를 수 있는 것은 셋이다. 끄고 켜는 둘만 두면 **"원래대로" 가 없어진다** —
 * 한 번 누른 뒤에는 기기 설정을 다시 따라가게 할 방법이 사라진다.
 *
 * 실제로 칠해지는 색은 둘뿐이라, `system` 은 그때그때 기기에 물어 둘 중 하나로
 * 풀린다. 고른 값과 풀린 값을 구별해 두는 것이 이 모듈의 일이다.
 */
export type ThemeChoice = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

/** 같은 키를 index.html 의 선행 스크립트도 읽는다. 바꾸면 거기도 같이 바꾼다. */
export const THEME_STORAGE_KEY = 'lab-calendar.theme'

const CHOICES: readonly ThemeChoice[] = ['system', 'light', 'dark']

/** 버튼을 누를 때마다 도는 차례. 기기 설정으로 돌아올 수 있어야 하므로 고리로 둔다. */
export function nextChoice(current: ThemeChoice): ThemeChoice {
  return CHOICES[(CHOICES.indexOf(current) + 1) % CHOICES.length]
}

export const CHOICE_LABELS: Record<ThemeChoice, string> = {
  system: '기기 설정',
  light: '밝게',
  dark: '어둡게',
}

/**
 * 저장해 둔 값을 읽는다.
 *
 * 사생활 보호 창이나 저장소를 막아 둔 브라우저에서는 읽기만 해도 예외가 난다.
 * 테마 때문에 앱이 뜨지 못하면 안 되므로 조용히 기기 설정으로 떨어진다.
 */
export function storedChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return CHOICES.includes(saved as ThemeChoice)
      ? (saved as ThemeChoice)
      : 'system'
  } catch {
    return 'system'
  }
}

export function rememberChoice(choice: ThemeChoice): void {
  try {
    if (choice === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, choice)
  } catch {
    // 기억해 두지 못해도 이번 방문에는 적용된다. 막을 이유가 없다.
  }
}

export function systemPrefersDark(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-color-scheme: dark)').matches
  )
}

export function resolve(choice: ThemeChoice): ResolvedTheme {
  if (choice !== 'system') return choice
  return systemPrefersDark() ? 'dark' : 'light'
}

/**
 * 확정된 테마를 문서에 적는다. CSS 는 이 속성 하나만 본다.
 *
 * 기기 설정을 JS 가 풀어 주는 이유는 CSS 에 선언 묶음을 재사용할 수단이 없어서다.
 * 미디어 쿼리 안과 밖에 같은 토큰 45 줄을 두 벌 두면 반드시 갈라진다.
 */
export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.dataset.theme = theme
}
