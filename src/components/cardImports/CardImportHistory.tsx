import { useCardImports } from '../../queries/useCardImports'
import { formatDateTime } from '../../utils/date'
import ErrorState from '../common/ErrorState'
import LoadingState from '../common/LoadingState'
import styles from './CardImportHistory.module.css'

/** 서버가 준 상태에 우리말을 붙인다. */
const STATUS_LABELS = {
  SUCCESS: '반영',
  PARTIAL: '일부 반영',
  FAILED: '실패',
} as const

/**
 * 지난 업로드 이력 (KAN-60).
 *
 * 올리는 사람이 여럿이고 주기도 정해져 있지 않다. 누가 언제까지 올려 두었는지
 * 보이지 않으면 같은 파일을 두 번 올리거나, 한참 지난 내역을 최신으로 착각한다.
 */
function CardImportHistory() {
  const { data: imports, isPending, isError, error, refetch, isFetching } =
    useCardImports(true)

  if (isPending) {
    return (
      <section className={styles.history}>
        <LoadingState label="업로드 이력을 불러오는 중입니다" lines={2} />
      </section>
    )
  }

  if (isError) {
    return (
      <section className={styles.history}>
        <ErrorState
          title="업로드 이력을 불러오지 못했습니다."
          error={error}
          onRetry={() => void refetch()}
          isRetrying={isFetching}
          compact
        />
      </section>
    )
  }

  return (
    <section className={styles.history} aria-labelledby="card-import-history">
      <h2 id="card-import-history" className={styles.title}>
        최근 업로드
      </h2>

      {imports.length === 0 ? (
        <p className={styles.empty}>아직 올린 파일이 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {imports.map((entry) => (
            <li key={entry.id} className={styles.item} data-status={entry.status}>
              <span className={styles.when}>
                {formatDateTime(entry.importedAt)}
              </span>
              <span className={styles.fileName}>{entry.fileName}</span>
              <span className={styles.counts}>
                추가 {entry.totals.added} · 사라짐 {entry.totals.removed}
                {entry.totals.blockedMonths > 0
                  ? ` · 보존 ${entry.totals.blockedMonths}달`
                  : ''}
              </span>
              <span className={styles.status}>
                {STATUS_LABELS[entry.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default CardImportHistory
