import { useCardImports } from '../../queries/useCardImports'
import type { CardImportHistoryEntry } from '../../types/domain'
import { formatDateTime } from '../../utils/date'
import ErrorState from '../common/ErrorState'
import LoadingState from '../common/LoadingState'
import styles from './CardImportHistory.module.css'

/** 서버가 준 상태에 우리말을 붙인다. */
const STATUS_LABELS = {
  RUNNING: '올리는 중',
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
                {formatDateTime(entry.finishedAt ?? entry.startedAt)}
              </span>
              <span className={styles.fileName}>{entry.fileName}</span>
              <span className={styles.counts}>{describeCounts(entry)}</span>
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

/**
 * 건수 한 줄.
 *
 * 이력에는 달별 집계가 없어 회차 합만 쓴다. 사라짐을 늘 적는 이유는 달 단위로
 * 갈아 끼우는 작업이라서다 — 추가만 보이면 무엇이 없어졌는지 모르고 지나간다.
 * 끝나지 않은 회차의 숫자는 아직 0 이므로 건수 대신 상태만 말한다.
 */
function describeCounts(entry: CardImportHistoryEntry): string {
  if (entry.status === 'RUNNING') return '처리 중입니다'
  if (entry.status === 'FAILED') {
    return entry.errorCode === null
      ? '반영하지 못했습니다'
      : `반영하지 못했습니다 (${entry.errorCode})`
  }

  const parts = [`추가 ${entry.added}`, `사라짐 ${entry.removed}`]
  if (entry.skippedRows > 0) parts.push(`건너뜀 ${entry.skippedRows}행`)
  if (entry.problemCount > 0) parts.push(`문제 ${entry.problemCount}건`)

  return parts.join(' · ')
}

export default CardImportHistory
