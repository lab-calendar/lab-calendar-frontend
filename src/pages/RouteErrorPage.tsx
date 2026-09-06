import { Link, useRouteError } from 'react-router-dom'
import { messageFromError } from '../api/errorMessage'
import { ROUTES } from '../router/routes'
import styles from './Page.module.css'

/**
 * 라우트를 그리다 터졌을 때의 안내 (라우터 `errorElement`).
 *
 * 레이아웃 바깥에서 그려지므로 헤더 없이 단독으로 서 있는다.
 */
function RouteErrorPage() {
  const error = useRouteError()

  return (
    <div className={styles.crash}>
      <div className={styles.centered}>
        <h1 className={styles.title}>화면을 표시하지 못했습니다</h1>
        <p className={styles.subtitle}>{messageFromError(error)}</p>
        <button
          type="button"
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          새로고침
        </button>
        <Link to={ROUTES.calendar} className={styles.link}>
          캘린더로 돌아가기
        </Link>
      </div>
    </div>
  )
}

export default RouteErrorPage
