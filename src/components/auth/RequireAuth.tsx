import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingState from '../common/LoadingState'
import { ROUTES } from '../../router/routes'
import styles from './RequireAuth.module.css'

/**
 * 인증된 사용자만 통과시킨다 (KAN-36).
 *
 * 세션을 확인하는 동안에는 리다이렉트하지 않는다. 확인 전에 내보내면 재방문할
 * 때마다 비밀번호 화면이 한 번 스쳐 지나간다.
 */
function RequireAuth() {
  const { session, isRestoring } = useAuth()
  const location = useLocation()

  if (isRestoring) {
    return (
      <div className={styles.restoring}>
        <LoadingState label="세션을 확인하는 중입니다" lines={1} lineHeight="1.25rem" />
      </div>
    )
  }

  if (!session?.authenticated) {
    // 보려던 곳을 기억해 두면 로그인 후 그 자리로 돌려보낼 수 있다.
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }

  return <Outlet />
}

export default RequireAuth
