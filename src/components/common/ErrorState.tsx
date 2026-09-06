import { messageFromError } from '../../api/errorMessage'
import styles from './StateMessage.module.css'

type ErrorStateProps = {
  /** 무엇을 못 불러왔는지 — 예: "일정을 불러오지 못했습니다." */
  title: string
  error: unknown
  /** 있으면 다시 시도 버튼을 보여준다 */
  onRetry?: () => void
  isRetrying?: boolean
  /** 사이드바처럼 좁은 자리에 들어갈 때 여백을 줄인다 */
  compact?: boolean
}

/**
 * 조회 실패 안내.
 *
 * 원인 문구는 `ApiError` 가 들고 있는 것을 그대로 쓴다. 그 밖의 예외는 내부
 * 메시지가 새어 나가지 않도록 공통 문구로 덮는다 (`api/errorMessage.ts`).
 */
function ErrorState({
  title,
  error,
  onRetry,
  isRetrying,
  compact,
}: ErrorStateProps) {
  return (
    <div
      className={compact ? `${styles.state} ${styles.compact}` : styles.state}
      role="alert"
    >
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{messageFromError(error)}</p>
      {onRetry ? (
        <button
          type="button"
          className={styles.retry}
          disabled={isRetrying}
          onClick={onRetry}
        >
          {isRetrying ? '다시 불러오는 중…' : '다시 시도'}
        </button>
      ) : null}
    </div>
  )
}

export default ErrorState
