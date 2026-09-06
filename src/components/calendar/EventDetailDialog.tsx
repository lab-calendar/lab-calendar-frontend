import { useEffect, useRef, useState } from 'react'
import { useCategories } from '../../queries/useCategories'
import { isEditableEvent, type CalendarEvent } from '../../types/domain'
import { formatEventPeriod } from '../../utils/date'
import styles from './EventDetailDialog.module.css'

type EventDetailDialogProps = {
  /** null 이면 닫힌 상태 */
  event: CalendarEvent | null
  onClose: () => void
  /** 넘기지 않으면 수정 버튼을 보여주지 않는다 */
  onEdit?: (event: CalendarEvent) => void
  /** 넘기지 않으면 삭제 버튼을 보여주지 않는다 */
  onDelete?: (event: CalendarEvent) => void
  isDeleting?: boolean
}

/** 카드/경비는 '사용 목적', 나머지는 카테고리별 의미가 다르다 (기획서 2.2) */
const DETAIL_LABELS: Record<CalendarEvent['categoryKey'], string> = {
  project: '제출 단계',
  lab: '담당 연구원',
  card: '사용 목적',
}

/** 사람이 못 고치는 일정은 어디서 바꿔야 하는지까지 알려준다 */
const SOURCE_NOTICES: Partial<Record<CalendarEvent['source'], string>> = {
  AUTO_GENERATED:
    '과제 종료일에서 역산해 자동 생성된 일정입니다. 여기서 고쳐도 다음 배치에서 되돌아가므로, 과제 관리에서 종료일이나 리드타임을 바꿔 주세요.',
  GOOGLE_SYNC:
    '구글 공유 문서에서 동기화된 일정입니다. 여기서 고쳐도 다음 동기화에서 되돌아가므로, 원본 문서를 수정해 주세요.',
}

/**
 * 일정 상세 팝업 (기획서 2.1 "개별 일정 클릭 시 참석 인원 및 세부 메모 팝업 출력").
 *
 * 네이티브 `<dialog>` 를 쓴다. 포커스 트랩과 ESC 닫기를 브라우저가 처리하므로
 * 직접 구현하지 않는다.
 */
function EventDetailDialog({
  event,
  onClose,
  onEdit,
  onDelete,
  isDeleting = false,
}: EventDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // 삭제는 되돌릴 수 없으니 같은 자리에서 한 번 더 확인받는다.
  // 중첩 모달 대신 버튼 자리를 바꾸는 방식이라 포커스가 튀지 않는다.
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [confirmingEventId, setConfirmingEventId] = useState<string | null>(null)

  if (confirmingEventId !== (event?.id ?? null)) {
    setConfirmingEventId(event?.id ?? null)
    setIsConfirmingDelete(false)
  }

  const canModify = event ? isEditableEvent(event) : false

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (event && !dialog.open) dialog.showModal()
    if (!event && dialog.open) dialog.close()
  }, [event])

  /*
   * 열림 여부의 기준은 `event` 상태 하나다. dialog 가 스스로 닫히면 상태와 어긋나
   * 같은 일정을 다시 눌러도 열리지 않으므로, 닫히는 경로를 모두 상태로 되돌린다.
   *
   * - close 이벤트는 버블링하지 않아 React 의 onClose prop 으로는 잡히지 않는다.
   * - ESC 는 브라우저가 dialog 를 직접 닫으므로 keydown 도 함께 듣는다.
   *   두 경로가 겹쳐도 onClose 는 상태를 비우기만 해서 문제가 없다.
   */
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !event) return

    const handleKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') onClose()
    }

    dialog.addEventListener('close', onClose)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      dialog.removeEventListener('close', onClose)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [event, onClose])

  const { data: categories } = useCategories()
  const categoryName = event
    ? (categories?.find((category) => category.key === event.categoryKey)
        ?.name ?? '')
    : ''

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="event-detail-title"
      // 백드롭을 누르면 dialog 자신이 이벤트 대상이 된다
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) onClose()
      }}
    >
      {event ? (
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.heading}>
              <span className={styles.categoryTag} data-category={event.categoryKey}>
                {categoryName}
              </span>
              <h2 id="event-detail-title" className={styles.title}>
                {event.title}
              </h2>
            </div>

            <button
              type="button"
              className={styles.closeButton}
              aria-label="닫기"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <dl className={styles.rows}>
            <div className={styles.row}>
              <dt className={styles.rowLabel}>기간</dt>
              <dd className={styles.rowValue}>
                {formatEventPeriod(event.startDate, event.endDate)}
              </dd>
            </div>

            {event.detail ? (
              <div className={styles.row}>
                <dt className={styles.rowLabel}>
                  {DETAIL_LABELS[event.categoryKey]}
                </dt>
                <dd className={styles.rowValue}>{event.detail}</dd>
              </div>
            ) : null}

            {event.participants.length > 0 ? (
              <div className={styles.row}>
                <dt className={styles.rowLabel}>참석 인원</dt>
                <dd className={styles.rowValue}>
                  {event.participants.join(', ')}{' '}
                  <span className={styles.participantCount}>
                    · 총 {event.participants.length}명
                  </span>
                </dd>
              </div>
            ) : null}

            {event.memo ? (
              <div className={styles.row}>
                <dt className={styles.rowLabel}>메모</dt>
                <dd className={styles.rowValue}>{event.memo}</dd>
              </div>
            ) : null}
          </dl>

          {SOURCE_NOTICES[event.source] ? (
            <p className={styles.autoNotice}>{SOURCE_NOTICES[event.source]}</p>
          ) : null}

          {canModify && (onEdit || onDelete) ? (
            <div className={styles.actions}>
              {isConfirmingDelete ? (
                <>
                  <span className={styles.confirmText}>삭제할까요?</span>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setIsConfirmingDelete(false)}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    disabled={isDeleting}
                    onClick={() => onDelete?.(event)}
                  >
                    {isDeleting ? '삭제 중…' : '삭제'}
                  </button>
                </>
              ) : (
                <>
                  {onDelete ? (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setIsConfirmingDelete(true)}
                    >
                      삭제
                    </button>
                  ) : null}
                  {onEdit ? (
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => onEdit(event)}
                    >
                      수정
                    </button>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  )
}

export default EventDetailDialog
