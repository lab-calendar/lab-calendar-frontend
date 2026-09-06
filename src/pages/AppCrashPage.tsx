import { messageFromError } from '../api/errorMessage'
import styles from './Page.module.css'

type AppCrashPageProps = {
  error: unknown
  onRetry: () => void
}

/**
 * 앱 전체가 뜨지 못했을 때의 안내.
 *
 * 라우터 바깥에서 그려지므로 `Link` 대신 일반 링크를 쓴다.
 */
function AppCrashPage({ error, onRetry }: AppCrashPageProps) {
  return (
    <div className={styles.crash}>
      <div className={styles.centered}>
        <h1 className={styles.title}>화면을 표시하지 못했습니다</h1>
        <p className={styles.subtitle}>{messageFromError(error)}</p>
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          다시 시도
        </button>
        <a href="/" className={styles.link}>
          캘린더로 돌아가기
        </a>
      </div>
    </div>
  )
}

export default AppCrashPage
