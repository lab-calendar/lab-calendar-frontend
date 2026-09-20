import { useId, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ApiError } from '../api/errors'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES } from '../router/routes'
import styles from './LoginPage.module.css'

type LocationState = { from?: { pathname: string } }

/**
 * 비밀번호 입력 화면 (KAN-36, KAN-21).
 *
 * 입력란은 하나다. 편집용인지 조회용인지 사용자가 고르지 않고, 입력한 비밀번호가
 * 서버에서 등급을 정한다. 고르게 두면 조회용 비밀번호를 가진 사람에게 편집 등급이
 * 있다는 사실을 알려주는 셈이기도 하다.
 */
function LoginPage() {
  const { session, isRestoring, signIn } = useAuth()
  const location = useLocation()
  const fieldId = useId()

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 이미 들어와 있으면 보던 곳으로 되돌린다.
  if (session?.authenticated) {
    const from = (location.state as LocationState | null)?.from?.pathname
    return <Navigate to={from ?? ROUTES.calendar} replace />
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!password) {
      setError('비밀번호를 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await signIn(password)
      // 성공하면 위의 Navigate 가 처리한다.
    } catch (caught) {
      /*
       * 비밀번호가 틀렸는지, 어느 등급에서 틀렸는지는 알려주지 않는다. 공용 비밀번호라
       * 힌트 하나가 그대로 추측의 단서가 된다. 서버도 같은 이유로 401 만 돌려준다.
       */
      setError(
        caught instanceof ApiError && caught.kind === 'NETWORK'
          ? caught.message
          : '비밀번호가 올바르지 않습니다.',
      )
      setPassword('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Lab Calendar</h1>
        <p className={styles.lead}>
          랩실 공용 비밀번호를 입력해 주세요.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={`${fieldId}-password`}>
              비밀번호
            </label>
            <input
              id={`${fieldId}-password`}
              className={error ? `${styles.input} ${styles.invalid}` : styles.input}
              type="password"
              // 개인 계정이 아니라 공용 비밀번호라, 브라우저가 계정으로 기억하지 않게 한다
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${fieldId}-error` : undefined}
              disabled={isSubmitting}
            />
          </div>

          {/* 실패 메시지는 읽어 주어야 한다. 입력 직후 포커스는 입력란에 남아 있다 */}
          <p
            id={`${fieldId}-error`}
            className={styles.error}
            role="alert"
            aria-live="polite"
          >
            {error ?? ''}
          </p>

          <button type="submit" className={styles.submit} disabled={isSubmitting}>
            {isSubmitting ? '확인 중…' : '입력'}
          </button>
        </form>

        <p className={styles.hint}>
          입력한 비밀번호에 따라 편집 또는 조회 전용으로 접속됩니다. 비밀번호는 랩실
          관리자에게 문의해 주세요.
        </p>
      </div>

      {/* 세션을 확인하는 중에도 화면은 이미 그려져 있다. 그 사이 입력을 막지는 않는다 */}
      {isRestoring ? <span className="sr-only">세션을 확인하는 중입니다</span> : null}
    </main>
  )
}

export default LoginPage
