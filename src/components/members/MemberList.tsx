import { useState } from 'react'
import { useCanEdit } from '../../contexts/AuthContext'
import {
  useDeleteMember,
  useSaveMember,
} from '../../queries/useMemberMutations'
import type { Member } from '../../types/domain'
import EmptyState from '../common/EmptyState'
import styles from './MemberList.module.css'

type MemberListProps = {
  members: Member[]
  editingId: string | null
  onEdit: (member: Member) => void
  /** 수정 중이던 구성원이 사라졌을 때 폼을 새 구성원으로 되돌린다. */
  onEditingRemoved: () => void
}

/**
 * 구성원 명단 (KAN-74).
 *
 * 순서는 서버가 정한 그대로다 — 재직 중인 사람이 먼저, 그 안에서 이름순.
 */
function MemberList({
  members,
  editingId,
  onEdit,
  onEditingRemoved,
}: MemberListProps) {
  const saveMember = useSaveMember()
  const deleteMember = useDeleteMember()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const canEdit = useCanEdit()

  if (members.length === 0) {
    return (
      <EmptyState
        title="등록된 구성원이 없습니다."
        description="이름을 등록해 두면 일정을 만들 때 참석자와 담당 연구원을 골라 넣을 수 있습니다."
      />
    )
  }

  function toggleActive(member: Member) {
    saveMember.mutate({
      id: member.id,
      input: { name: member.name, active: !member.active },
    })
  }

  /*
   * 실패해도 확인 상태를 그대로 둔다. 참석 기록이 있어 서버가 막은 경우인데, 버튼이
   * 원래 자리로 돌아가 버리면 알림에 뜬 이유가 어느 사람 이야기인지 흐려진다.
   */
  function remove(member: Member) {
    deleteMember.mutate(member.id, {
      onSuccess: () => {
        setConfirmingId(null)
        if (member.id === editingId) onEditingRemoved()
      },
    })
  }

  return (
    <ul className={styles.list}>
      {members.map((member) => (
        <li
          key={member.id}
          className={member.active ? styles.item : styles.inactiveItem}
        >
          <div className={styles.head}>
            <span className={styles.name}>{member.name}</span>
            {member.active ? null : (
              <span className={styles.inactiveBadge}>퇴사</span>
            )}
          </div>

          {/* 조회 등급에는 편집 진입점을 내린다 (KAN-36) */}
          {canEdit ? (
            confirmingId === member.id ? (
              <div className={styles.actions}>
                <span className={styles.confirmText}>
                  지난 일정의 참석 기록이 있으면 삭제되지 않습니다.
                </span>
                <button
                  type="button"
                  className={styles.dangerButton}
                  disabled={deleteMember.isPending}
                  onClick={() => remove(member)}
                >
                  {deleteMember.isPending ? '삭제 중…' : '삭제'}
                </button>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => setConfirmingId(null)}
                >
                  취소
                </button>
              </div>
            ) : (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => onEdit(member)}
                >
                  수정
                </button>
                <button
                  type="button"
                  className={styles.button}
                  disabled={saveMember.isPending}
                  onClick={() => toggleActive(member)}
                >
                  {member.active ? '퇴사로 표시' : '재직으로 표시'}
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => setConfirmingId(member.id)}
                >
                  삭제
                </button>
              </div>
            )
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export default MemberList
