import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMembers } from '../../queries/useMembers'
import { useSaveMember } from '../../queries/useMemberMutations'
import { ROUTES } from '../../router/routes'
import type { Member } from '../../types/domain'
import { validateMemberForm } from './memberFormValidation'
import styles from './RosterEditor.module.css'

/**
 * 일정 등록 폼 안에서 명단을 고친다 (KAN-85).
 *
 * 명단을 건드리는 때는 대개 "일정을 넣다가 없는 사람을 발견했을 때"다. 그때마다
 * 다른 화면으로 갔다가 돌아오면 쓰던 일정이 사라진다. 그래서 고르는 자리 바로
 * 아래에 둔다.
 *
 * 평소에는 접혀 있다. 등록 폼은 이미 길고, 명단을 고치는 일은 일정을 넣는 일보다
 * 훨씬 드물다.
 *
 * 폼 안에 폼을 둘 수는 없어(HTML 이 허용하지 않는다) 안쪽은 버튼과 입력만으로
 * 만든다. 버튼은 모두 `type="button"` 이라 바깥 일정 폼을 제출하지 않고,
 * 입력에서 Enter 를 눌렀을 때도 여기서 받아 처리한다.
 */
function RosterEditor() {
  const { data: members } = useMembers()
  const saveMember = useSaveMember()

  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const panelId = useId()
  const roster = members ?? []

  function add() {
    const error = validateMemberForm({ name: newName, active: true }).name
    setAddError(error ?? null)
    if (error) return

    saveMember.mutate(
      { id: null, input: { name: newName.trim(), active: true } },
      { onSuccess: () => setNewName('') },
    )
  }

  function startEdit(member: Member) {
    setEditingId(member.id)
    setEditingName(member.name)
    setEditError(null)
  }

  function saveEdit(member: Member) {
    const error = validateMemberForm({ name: editingName, active: true }).name
    setEditError(error ?? null)
    if (error) return

    saveMember.mutate(
      { id: member.id, input: { name: editingName.trim(), active: member.active } },
      { onSuccess: () => setEditingId(null) },
    )
  }

  /**
   * 지우지 않고 재직 여부만 끈다.
   *
   * 지난 일정의 참석 기록이 사라지면 안 되고, 서버도 참석 기록이 있는 사람은
   * 409 로 막는다. 꺼 두면 고르는 자리에서만 빠진다.
   */
  function toggleActive(member: Member) {
    saveMember.mutate({
      id: member.id,
      input: { name: member.name, active: !member.active },
    })
  }

  return (
    <div className={styles.roster}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((previous) => !previous)}
      >
        <span aria-hidden="true">{open ? '−' : '+'}</span> 명단 고치기
      </button>

      {open ? (
        <div id={panelId} className={styles.panel}>
          <div className={styles.addRow}>
            <label className="sr-only" htmlFor={`${panelId}-new`}>
              추가할 이름
            </label>
            <input
              id={`${panelId}-new`}
              className={styles.input}
              value={newName}
              placeholder="예: 홍길동"
              aria-invalid={Boolean(addError)}
              aria-describedby={addError ? `${panelId}-add-error` : undefined}
              onChange={(changeEvent) => setNewName(changeEvent.target.value)}
              /* 바깥 일정 폼이 대신 제출되지 않게 여기서 가로챈다 */
              onKeyDown={(keyEvent) => {
                if (keyEvent.key !== 'Enter') return
                keyEvent.preventDefault()
                add()
              }}
            />
            <button
              type="button"
              className={styles.action}
              disabled={saveMember.isPending}
              onClick={add}
            >
              추가
            </button>
          </div>

          {addError ? (
            <p id={`${panelId}-add-error`} className={styles.error}>
              {addError}
            </p>
          ) : null}

          <ul className={styles.list}>
            {roster.map((member) => (
              <li key={member.id} className={styles.item}>
                {editingId === member.id ? (
                  <>
                    <label className="sr-only" htmlFor={`${panelId}-${member.id}`}>
                      {member.name} 의 새 이름
                    </label>
                    <input
                      id={`${panelId}-${member.id}`}
                      className={styles.input}
                      value={editingName}
                      aria-invalid={Boolean(editError)}
                      onChange={(changeEvent) =>
                        setEditingName(changeEvent.target.value)
                      }
                      onKeyDown={(keyEvent) => {
                        if (keyEvent.key !== 'Enter') return
                        keyEvent.preventDefault()
                        saveEdit(member)
                      }}
                    />
                    <button
                      type="button"
                      className={styles.action}
                      disabled={saveMember.isPending}
                      onClick={() => saveEdit(member)}
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      className={styles.action}
                      onClick={() => setEditingId(null)}
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <span className={styles.name} data-inactive={!member.active}>
                      {member.name}
                      {member.active ? null : (
                        <span className={styles.tag}>재직 종료</span>
                      )}
                    </span>
                    <button
                      type="button"
                      className={styles.action}
                      onClick={() => startEdit(member)}
                    >
                      이름 수정
                    </button>
                    <button
                      type="button"
                      className={styles.action}
                      disabled={saveMember.isPending}
                      onClick={() => toggleActive(member)}
                    >
                      {member.active ? '재직 종료' : '다시 재직'}
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>

          {editError ? <p className={styles.error}>{editError}</p> : null}

          <p className={styles.hint}>
            재직 중인 사람만 위의 고르는 자리에 올라갑니다. 떠난 사람은 지우지 말고
            재직 여부를 꺼 두세요 — 지난 일정의 기록은 그대로 남습니다.{' '}
            <Link to={ROUTES.members} className={styles.link}>
              구성원 화면
            </Link>
            에서 한 번에 정리할 수도 있습니다.
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default RosterEditor
