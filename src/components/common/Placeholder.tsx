import styles from './Placeholder.module.css'

type PlaceholderProps = {
  /** 이 자리에 들어올 기능 이름 */
  title: string
  /** 해당 기능을 구현하는 Jira 이슈 키 */
  issue: string
  description?: string
}

/** 후속 이슈에서 구현될 영역임을 화면에 표시한다. */
function Placeholder({ title, issue, description }: PlaceholderProps) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.title}>{title}</span>
      {description ? (
        <span className={styles.description}>{description}</span>
      ) : null}
      <span className={styles.issue}>{issue}</span>
    </div>
  )
}

export default Placeholder
