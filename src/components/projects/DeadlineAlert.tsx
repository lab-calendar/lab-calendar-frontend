import { useEffect, useRef } from 'react'
import { useDailyNotice } from '../../hooks/useDailyNotice'
import { useFocusDate } from '../../hooks/useFocusDate'
import { useProjects } from '../../queries/useProjects'
import { formatEventPeriod } from '../../utils/date'
import { formatDDay } from './dDay'
import { attentionNeeded, urgencyOf } from './deadlineUrgency'
import styles from './DeadlineAlert.module.css'

const STORAGE_KEY = 'lab-calendar:deadline-alert-dismissed-on'

/**
 * 마감이 임박한 과제를 캘린더에 들어올 때 한 번 알린다 (KAN-53).
 *
 * 기획서 3.1 — "마감 직전 주간에는 빨간색 하이라이팅 및 알림 팝업을 전송한다".
 * 하이라이팅은 화면을 보고 있어야 눈에 들어오지만, 팝업은 보고 있지 않아도 앞을
 * 막아선다. 그래서 하루 한 번으로 제한한다 — 들어올 때마다 뜨면 닫는 동작이
 * 반사가 되어 결국 읽히지 않는다.
 *
 * 알릴 것이 없으면 아무것도 그리지 않는다.
 */
function DeadlineAlert() {
  const { data: projects } = useProjects()
  const { shouldShow, dismiss } = useDailyNotice(STORAGE_KEY)
  const { focusOn } = useFocusDate()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const urgent = projects ? attentionNeeded(projects) : []
  const open = shouldShow && urgent.length > 0

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  /*
   * 닫히는 경로가 여럿이다 — 버튼, ESC, 백드롭. 어느 쪽으로 닫히든 오늘은 다시
   * 뜨지 않아야 하므로 dialog 의 close 이벤트 한 곳에서 받는다. close 는 버블링
   * 하지 않아 React 의 onClose prop 으로는 잡히지 않는다.
   */
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !open) return

    dialog.addEventListener('close', dismiss)
    return () => dialog.removeEventListener('close', dismiss)
  }, [open, dismiss])

  if (!open) return null

  const handleGoTo = (endDate: string) => {
    focusOn(endDate)
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="deadline-alert-title"
      // 백드롭을 누르면 dialog 자신이 이벤트 대상이 된다
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) {
          dialogRef.current?.close()
        }
      }}
    >
      <div className={styles.content}>
        <h2 id="deadline-alert-title" className={styles.title}>
          마감이 임박한 과제가 {urgent.length}건 있습니다
        </h2>

        <ul className={styles.list}>
          {urgent.map((project) => (
            <li key={project.id} className={styles.item}>
              <button
                type="button"
                className={styles.itemButton}
                data-urgency={urgencyOf(project.dDay)}
                onClick={() => handleGoTo(project.endDate)}
              >
                <span className={styles.dDay}>
                  <span aria-hidden="true">{formatDDay(project.dDay)}</span>
                  <span className="sr-only">
                    {project.dDay < 0
                      ? `마감이 ${-project.dDay}일 지남`
                      : project.dDay === 0
                        ? '오늘 마감'
                        : `마감까지 ${project.dDay}일 남음`}
                  </span>
                </span>

                <span className={styles.body}>
                  <span className={styles.name}>
                    {project.name}
                    {project.submissionStage
                      ? ` (${project.submissionStage})`
                      : ''}
                  </span>
                  <span className={styles.period}>
                    준비 기간{' '}
                    {formatEventPeriod(
                      project.preparationStartDate,
                      project.endDate,
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <p className={styles.note}>오늘은 다시 표시하지 않습니다.</p>
          <button
            type="button"
            className={styles.confirm}
            onClick={() => dialogRef.current?.close()}
          >
            확인
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default DeadlineAlert
