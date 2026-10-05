import styles from './MonthCalendar.module.css'

type Props = {
  dayNumberText: string
  holidayNames: readonly string[]
}

/** 공휴일은 일정 칩 대신 날짜 머리글에 표시한다. */
export default function HolidayDayNumber({ dayNumberText, holidayNames }: Props) {
  const label = holidayNames.join(' · ')
  return (
    <span className={styles.dayNumberContent}>
      {label ? <span className={styles.holidayName} title={label}>{label}</span> : null}
      <span>{dayNumberText}</span>
    </span>
  )
}
