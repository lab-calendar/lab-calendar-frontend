import type { ReactNode } from 'react'
import styles from './StateMessage.module.css'

type EmptyStateProps = {
  title: string
  /** 다음에 무엇을 하면 되는지 알려 준다 */
  description?: ReactNode
}

/** 보여줄 것이 없을 때의 안내. 빈 화면 대신 다음 행동을 알려 준다. */
function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className={styles.state}>
      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
    </div>
  )
}

export default EmptyState
