import { Link } from 'react-router-dom'
import { ROUTES } from '../router/routes'
import styles from './Page.module.css'

function NotFoundPage() {
  return (
    <div className={styles.centered}>
      <h1 className={styles.title}>페이지를 찾을 수 없습니다</h1>
      <p className={styles.subtitle}>주소가 올바른지 확인해 주세요.</p>
      <Link to={ROUTES.calendar} className={styles.link}>
        캘린더로 돌아가기
      </Link>
    </div>
  )
}

export default NotFoundPage
