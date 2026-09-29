import { useState } from 'react'
import ErrorState from '../components/common/ErrorState'
import LoadingState from '../components/common/LoadingState'
import MemberForm from '../components/members/MemberForm'
import MemberList from '../components/members/MemberList'
import { useCanEdit } from '../contexts/AuthContext'
import { useMembers } from '../queries/useMembers'
import type { Member } from '../types/domain'
import styles from './Page.module.css'

/** 랩실 구성원 관리 화면 (KAN-74). */
function MembersPage() {
  const {
    data: members,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useMembers()
  const [editingId, setEditingId] = useState<string | null>(null)
  const canEdit = useCanEdit()

  // 목록을 다시 받아도 수정 중인 사람을 잃지 않도록 id 로 다시 찾는다.
  const editingMember = members?.find((m) => m.id === editingId) ?? null

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>구성원</h1>
        <p className={styles.subtitle}>
          {canEdit
            ? '이름을 등록해 두면 일정을 만들 때 참석자와 담당 연구원을 명단에서 골라 넣을 수 있습니다.'
            : '랩실 구성원 명단을 확인합니다.'}
        </p>
      </div>

      {/* 조회 등급에는 등록 폼을 내리고 명단만 남긴다 (KAN-36) */}
      <div className={canEdit ? styles.split : undefined}>
        {canEdit ? (
          <section className={styles.panel}>
            <MemberForm
              editingMember={editingMember}
              onDone={() => setEditingId(null)}
            />
          </section>
        ) : null}

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>등록된 구성원</h2>

          {isPending ? (
            <LoadingState
              label="구성원을 불러오는 중입니다"
              lines={4}
              lineHeight="3rem"
            />
          ) : isError ? (
            <ErrorState
              title="구성원을 불러오지 못했습니다."
              error={error}
              onRetry={() => void refetch()}
              isRetrying={isFetching}
            />
          ) : (
            <MemberList
              members={members}
              editingId={editingId}
              onEdit={(member: Member) => setEditingId(member.id)}
              onEditingRemoved={() => setEditingId(null)}
            />
          )}
        </section>
      </div>
    </div>
  )
}

export default MembersPage
