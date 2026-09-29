import type { Member } from '../../types/domain'
import styles from './MemberPicker.module.css'

type MemberPickerProps = {
  /** 고를 수 있는 사람들. 재직 중인 사람만 넘긴다 (`activeMembers`). */
  members: Member[]
  /** 지금 참석자로 들어가 있는 이름들 */
  selectedNames: string[]
  onToggle: (name: string) => void
  /** 누른 것이 무엇을 바꾸는지 설명하는 요소의 id */
  describedById?: string
}

/**
 * 명단에서 참석자를 골라 넣는다 (KAN-74).
 *
 * 자유 입력 칸을 없애지 않고 거들기만 한다. 명단에 없는 외부 인원이 실제로 들어오고,
 * 그 사람 때문에 일정을 못 만들게 되면 안 된다.
 *
 * 토글 버튼이라 한 번 더 누르면 빠진다. 체크박스로 만들면 같은 이름이 입력칸과 목록
 * 양쪽에 생겨, 손으로 지운 이름이 체크된 채 남는 상태가 나온다.
 */
function MemberPicker({
  members,
  selectedNames,
  onToggle,
  describedById,
}: MemberPickerProps) {
  if (members.length === 0) return null

  return (
    <div
      className={styles.picker}
      role="group"
      aria-label="명단에서 고르기"
      aria-describedby={describedById}
    >
      {members.map((member) => {
        const selected = selectedNames.includes(member.name)

        return (
          <button
            key={member.id}
            type="button"
            className={styles.chip}
            /*
             * 눌린 상태를 색으로만 알리지 않는다. 스크린 리더는 aria-pressed 로
             * "선택됨"을 읽고, 색을 구분하기 어려운 사람에게는 앞의 표시가 남는다.
             */
            aria-pressed={selected}
            onClick={() => onToggle(member.name)}
          >
            <span aria-hidden="true">{selected ? '✓' : '+'}</span>
            {member.name}
          </button>
        )
      })}
    </div>
  )
}

export default MemberPicker
