/**
 * 서버가 내려준 D-Day 값을 표시 문구로 바꾼다.
 *
 * 값 자체는 서버가 계산한다 (KAN-52). 여기서는 부호만 보고 표기를 고른다.
 */
export function formatDDay(dDay: number): string {
  if (dDay === 0) return 'D-DAY'
  return dDay > 0 ? `D-${dDay}` : `D+${-dDay}`
}
