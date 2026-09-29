import { useDailyNotice } from '../../hooks/useDailyNotice'
import { useFocusDate } from '../../hooks/useFocusDate'
import { useProjects } from '../../queries/useProjects'
import { formatDDay } from './dDay'
import { attentionNeeded, urgencyOf } from './deadlineUrgency'
import styles from './DeadlineNotice.module.css'

const STORAGE_KEY = 'lab-calendar:deadline-notice-dismissed-on'

/**
 * 급한 마감을 달력 위에 얹어 알린다 (KAN-80).
 *
 * 전에는 같은 내용을 두 곳에서 알렸다 — 달력 위 가로 띠와, 들어올 때 앞을 막는
 * 모달. 띠는 닫을 수 없어 급한 것이 없어도 자리를 먹었고, 모달은 달력을 보러 온
 * 사람을 한 번 멈춰 세웠다. 하나로 합치고, 닫을 수 있게 한다.
 *
 * 그래서 **급한 것이 있을 때만** 뜬다. 다가오는 마감을 늘 늘어놓는 자리가 아니라,
 * 챙길 것이 생겼을 때만 나타나는 알림이다. 마감 전체는 과제 관리 화면에 있다.
 */
function DeadlineNotice() {
  const { data: projects } = useProjects()
  const { shouldShow, dismiss } = useDailyNotice(STORAGE_KEY)
  const { focusOn } = useFocusDate()

  /*
   * 불러오지 못했으면 조용히 비운다.
   *
   * 이건 덧붙는 알림이라, 달력 위에 오류 상자를 띄우면 정작 보러 온 것을 가린다.
   * 과제를 못 불러오는 상황은 과제 관리 화면이 제대로 알려 준다.
   */
  const urgent = projects ? attentionNeeded(projects) : []
  if (!shouldShow || urgent.length === 0) return null

  return (
    <aside className={styles.notice} aria-labelledby="deadline-notice-title">
      <div className={styles.head}>
        <h2 id="deadline-notice-title" className={styles.title}>
          마감이 임박한 과제 {urgent.length}건
        </h2>
        <button
          type="button"
          className={styles.close}
          /* 화면에는 ✕ 만 보이지만, 무엇을 닫는지는 이름으로 남긴다 */
          aria-label="마감 알림 닫기"
          onClick={dismiss}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <ul className={styles.list}>
        {urgent.map((project) => (
          <li key={project.id}>
            <button
              type="button"
              className={styles.item}
              data-urgency={urgencyOf(project)}
              onClick={() => focusOn(project.endDate)}
            >
              <span className={styles.dDay}>
                {/* 화면에는 D-3 만 보이지만, 읽어 주는 쪽에는 뜻을 풀어 준다 */}
                <span aria-hidden="true">{formatDDay(project.dDay)}</span>
                <span className="sr-only">{describeDDay(project.dDay)}</span>
              </span>

              <span className={styles.body}>
                <span className={styles.name}>{project.name}</span>
                {project.submissionStage ? (
                  <span className={styles.stage}>{project.submissionStage}</span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className={styles.note}>닫으면 오늘은 다시 뜨지 않습니다.</p>
    </aside>
  )
}

/** `D-3` 은 눈으로는 읽히지만 소리로는 "디 마이너스 삼" 이 된다. */
function describeDDay(dDay: number): string {
  if (dDay === 0) return '오늘 마감'
  return dDay > 0 ? `마감까지 ${dDay}일 남음` : `마감이 ${-dDay}일 지남`
}

export default DeadlineNotice
