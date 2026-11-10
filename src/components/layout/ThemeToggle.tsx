import { CHOICE_LABELS, nextChoice } from '../../theme/theme'
import { useTheme } from '../../theme/useTheme'
import styles from './AppHeader.module.css'

/** 해 — 밝게 */
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="3.2" fill="currentColor" />
      <path
        d="M8 1v1.6M8 13.4V15M15 8h-1.6M2.6 8H1m11-5l-1.1 1.1M5.1 10.9L4 12m8 0l-1.1-1.1M5.1 5.1L4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** 달 — 어둡게 */
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M13.2 9.6A5.6 5.6 0 016.4 2.8a5.6 5.6 0 106.8 6.8z"
        fill="currentColor"
      />
    </svg>
  )
}

/** 해 반, 달 반 — 기기 설정을 따라가는 중 */
function AutoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M8 3a5 5 0 010 10z" fill="currentColor" />
    </svg>
  )
}

const ICONS = {
  system: AutoIcon,
  light: SunIcon,
  dark: MoonIcon,
}

/**
 * 테마 전환 버튼 (KAN-106).
 *
 * 누를 때마다 기기 설정 → 밝게 → 어둡게 로 돌고 다시 처음으로 온다. 고리로 둔
 * 이유는 **기기 설정으로 돌아올 길**이 있어야 하기 때문이다.
 *
 * 아이콘만으로는 지금 무엇이 켜져 있는지 소리로 알 수 없다. 그래서 현재 상태와
 * 다음에 무엇이 되는지를 이름에 담는다 — 아이콘은 장식으로 빼 둔다.
 */
function ThemeToggle() {
  const { choice, cycle } = useTheme()
  const Icon = ICONS[choice]

  return (
    <button
      type="button"
      className={styles.themeButton}
      onClick={cycle}
      aria-label={`화면 테마: ${CHOICE_LABELS[choice]}. 누르면 ${CHOICE_LABELS[nextChoice(choice)]}`}
      title={`화면 테마: ${CHOICE_LABELS[choice]}`}
    >
      <Icon />
    </button>
  )
}

export default ThemeToggle
