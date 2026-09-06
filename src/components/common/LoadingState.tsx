import styles from './StateMessage.module.css'

type LoadingStateProps = {
  /** 스크린 리더가 읽을 문구. 화면에는 보이지 않는다. */
  label: string
  /** 표시할 스켈레톤 줄 수 */
  lines?: number
  /** 줄 하나의 높이 (CSS 길이) */
  lineHeight?: string
}

/**
 * 데이터를 기다리는 동안의 자리 표시.
 *
 * 스피너 대신 스켈레톤을 쓴다 — 내용이 들어올 자리를 미리 잡아 두면 도착했을 때
 * 화면이 덜 튄다. 화면에 글자는 두지 않고 `role="status"` 로만 알린다.
 */
function LoadingState({ label, lines = 3, lineHeight }: LoadingStateProps) {
  return (
    <div
      className={styles.skeleton}
      role="status"
      aria-busy="true"
      style={
        lineHeight
          ? ({ '--skeleton-height': lineHeight } as React.CSSProperties)
          : undefined
      }
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className={styles.bar} aria-hidden="true" />
      ))}
    </div>
  )
}

export default LoadingState
