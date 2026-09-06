import { CATEGORY_MARKS, type CategoryKey } from '../../constants/categories'
import styles from './MonthCalendar.module.css'

type EventChipProps = {
  title: string
  categoryKey: CategoryKey
  /** 서버가 준 카테고리 이름. 화면에는 안 보이고 스크린 리더만 읽는다. */
  categoryName: string
  onActivate: () => void
}

/**
 * 달력 칸에 놓이는 일정 칩.
 *
 * FullCalendar 가 감싸는 요소는 href 없는 `a` 라 키보드로 닿지 않는다. 칩이
 * 직접 포커스를 받고 Enter · Space 로 열리게 해야 마우스 없이 일정을 볼 수 있다
 * (KAN-64 완료 조건). 마우스 클릭은 FullCalendar 의 eventClick 이 처리한다.
 */
function EventChip({
  title,
  categoryKey,
  categoryName,
  onActivate,
}: EventChipProps) {
  return (
    <span
      className={styles.event}
      data-category={categoryKey}
      role="button"
      tabIndex={0}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key !== 'Enter' && keyEvent.key !== ' ') return
        // Space 로 화면이 스크롤되지 않게 한다
        keyEvent.preventDefault()
        onActivate()
      }}
    >
      <span className={styles.eventMark} aria-hidden="true">
        {CATEGORY_MARKS[categoryKey]}
      </span>
      {/*
        이름과 제목이 한 덩어리로 읽히지 않도록 쉼표를 함께 넣는다.
        접근 가능한 이름을 계산할 때 노드마다 공백이 잘려 나가므로,
        띄어쓰기가 아니라 문장 부호로 끊어야 한다.
      */}
      {categoryName ? (
        <span className="sr-only">{`${categoryName},`}</span>
      ) : null}
      <span className={styles.eventTitle}>{title}</span>
    </span>
  )
}

export default EventChip
