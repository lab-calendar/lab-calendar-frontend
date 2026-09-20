import { useNavigate } from 'react-router-dom'
import { useFocusDate } from '../../hooks/useFocusDate'
import { useProjects } from '../../queries/useProjects'
import { ROUTES } from '../../router/routes'
import type { Project } from '../../types/domain'
import ErrorState from '../common/ErrorState'
import LoadingState from '../common/LoadingState'
import { formatDDay } from './dDay'
import styles from './UpcomingDeadlines.module.css'

/** 한 줄에 들어가고 훑어볼 만한 수. 더 늘리면 달력이 밀린다. */
const LIMIT = 3

/**
 * 가장 급한 마감 몇 건 (KAN-52).
 *
 * 캘린더를 열자마자 눈에 들어와야 하는 것은 "다음에 뭘 준비해야 하나" 하나다.
 * 과제 관리 화면까지 들어가야 알 수 있으면 아무도 보지 않는다.
 *
 * D-Day 는 서버가 계산한 값을 그대로 쓴다. 브라우저에서 다시 세면 기기 시계가
 * 틀어졌거나 타임존이 다를 때 사람마다 다른 숫자를 보게 된다.
 */
function UpcomingDeadlines() {
  const { data: projects, isPending, isError, error, refetch, isFetching } =
    useProjects()
  const { focusOn } = useFocusDate()
  const navigate = useNavigate()

  if (isPending) {
    return (
      <div className={styles.widget}>
        <LoadingState
          label="다가오는 마감을 불러오는 중입니다"
          lines={1}
          lineHeight="3.5rem"
        />
      </div>
    )
  }

  if (isError) {
    return (
      <div className={styles.widget}>
        <ErrorState
          title="다가오는 마감을 불러오지 못했습니다."
          error={error}
          onRetry={() => void refetch()}
          isRetrying={isFetching}
          compact
        />
      </div>
    )
  }

  const upcoming = pickUpcoming(projects)

  if (upcoming.length === 0) {
    return (
      <p className={styles.empty}>
        다가오는 과제 마감이 없습니다.{' '}
        <button
          type="button"
          className={styles.link}
          onClick={() => void navigate(ROUTES.projects)}
        >
          과제 관리
        </button>
        에서 등록하면 여기에 표시됩니다.
      </p>
    )
  }

  return (
    <section className={styles.widget} aria-labelledby="upcoming-deadlines">
      <h2 id="upcoming-deadlines" className="sr-only">
        다가오는 과제 마감
      </h2>

      <ul className={styles.list}>
        {upcoming.map((project) => (
          <li key={project.id}>
            <button
              type="button"
              className={styles.item}
              data-overdue={project.dDay < 0 ? '' : undefined}
              onClick={() => focusOn(project.endDate)}
            >
              <span className={styles.dDay}>
                {/* 화면에는 D-10 만 보이지만, 읽어 주는 쪽에는 무슨 뜻인지 풀어 준다 */}
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
    </section>
  )
}

/**
 * 보여줄 과제를 고른다.
 *
 * 숨긴 과제는 뺀다 — 캘린더에서 내리려고 끈 것을 위젯이 다시 들이밀면 끈 의미가 없다.
 *
 * 마감이 지난 과제는 남긴다. 아직 켜져 있다는 것은 끝나지 않았다는 뜻이고, 지난
 * 마감은 다가오는 것보다 더 급하다. 그래서 목록 맨 앞에 온다.
 *
 * 정렬은 서버가 마감 임박 순으로 해 준 것을 그대로 따른다.
 */
function pickUpcoming(projects: Project[]): Project[] {
  return projects.filter((project) => project.active).slice(0, LIMIT)
}

/** `D-10` 은 눈으로는 읽히지만 소리로는 "디 마이너스 십" 이 된다. */
function describeDDay(dDay: number): string {
  if (dDay === 0) return '오늘 마감'
  return dDay > 0 ? `마감까지 ${dDay}일 남음` : `마감이 ${-dDay}일 지남`
}

export default UpcomingDeadlines
