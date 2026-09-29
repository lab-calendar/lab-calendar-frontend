import { useCanEdit } from '../../contexts/AuthContext'
import { useCardSync, useSyncCardExpenses } from '../../queries/useCardSync'
import type { CardSync } from '../../types/domain'
import { formatDateTime } from '../../utils/date'
import styles from './CardSyncStatus.module.css'

/**
 * 카드 내역 동기화 상태와 수동 동기화 버튼 (KAN-61).
 *
 * 카드 지출은 사람이 달력에 넣지 않는다 — 구글 장부를 서버가 주기적으로 읽어 온다
 * (KAN-59, 기본 1시간). 그래서 "달력에 안 보인다"는 말이 두 가지를 뜻할 수 있다:
 * 아직 읽어 갈 때가 안 됐거나, 동기화가 실패해 멈춰 있거나. 둘을 구분해 주지 않으면
 * 장부를 고친 사람은 무엇을 기다려야 하는지 알 수 없다.
 *
 * 조회 등급에게는 카드 지출 자체가 내려오지 않으므로(KAN-35) 이 줄도 보이지 않는다.
 */
function CardSyncStatus() {
  const canEdit = useCanEdit()
  const { data: sync, isError } = useCardSync(canEdit)
  const syncNow = useSyncCardExpenses()

  if (!canEdit) return null

  /*
   * 상태를 못 받아 온 것과 동기화가 실패한 것은 다르다. 앞쪽은 이 줄이 할 말이 없는
   * 상태라 조용히 빠지고(달력 본체가 이미 오류를 알린다), 실패는 배너로 남는다.
   */
  if (isError || !sync) return null

  const hasFailed = sync.status === 'FAILED'

  return (
    <section
      className={styles.bar}
      data-state={hasFailed ? 'failed' : 'normal'}
      aria-label="카드 내역 동기화"
    >
      <p className={styles.status}>
        {hasFailed ? (
          // 실패는 스크린 리더에게도 즉시 알린다. 나머지 문구는 조용히 갱신된다.
          <span role="alert">
            카드 내역을 가져오지 못했습니다. {failureHint(sync)}
          </span>
        ) : (
          describeLastSync(sync)
        )}
      </p>

      <button
        type="button"
        className={styles.syncButton}
        disabled={syncNow.isPending}
        onClick={() => syncNow.mutate()}
      >
        {syncNow.isPending ? '동기화 중…' : '지금 동기화'}
      </button>

      {/* 진행 상황은 버튼 글자만으로는 읽어 주지 않는다 */}
      <span className="sr-only" role="status">
        {syncNow.isPending ? '카드 내역을 동기화하는 중입니다' : ''}
      </span>
    </section>
  )
}

/**
 * 실패 사유. 서버가 준 문구를 그대로 쓰고, 없으면 다음에 할 일을 알려준다.
 *
 * 양식이 깨졌는지 권한이 바뀐 것인지는 서버만 안다. 사유가 없을 때 프론트가 원인을
 * 추측해 적으면 엉뚱한 곳을 뒤지게 만든다.
 */
function failureHint(sync: CardSync): string {
  if (sync.message) return sync.message
  return '원본 문서의 양식과 공유 권한을 확인한 뒤 다시 시도해 주세요.'
}

/** 마지막으로 언제 들어왔는지. 건너뛴 행이 있으면 그 사실까지 함께 말한다. */
function describeLastSync(sync: CardSync): string {
  if (sync.status === 'NEVER_RUN' || !sync.lastSyncedAt) {
    return '카드 내역을 아직 가져오지 않았습니다.'
  }

  const when = `카드 내역 최신 기준 ${formatDateTime(sync.lastSyncedAt)}`
  return sync.skippedCount > 0
    ? `${when} · 양식이 맞지 않아 건너뛴 행 ${sync.skippedCount}건`
    : when
}

export default CardSyncStatus
