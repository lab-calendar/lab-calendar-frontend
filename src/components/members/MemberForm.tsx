import { useId, useState } from 'react'
import { useSaveMember } from '../../queries/useMemberMutations'
import type { Member } from '../../types/domain'
import styles from './MemberForm.module.css'
import {
  toMemberInputFromForm,
  validateMemberForm,
  type MemberFormErrors,
  type MemberFormValues,
} from './memberFormValidation'

function emptyValues(): MemberFormValues {
  return { name: '', active: true }
}

function valuesFrom(member: Member): MemberFormValues {
  return { name: member.name, active: member.active }
}

type MemberFormProps = {
  /** 수정 중인 구성원. 없으면 새 구성원 등록이다. */
  editingMember: Member | null
  /** 저장했거나 수정을 그만둘 때 — 목록 쪽 선택을 푼다. */
  onDone: () => void
}

/** 구성원 등록 · 수정 폼 (KAN-74). */
function MemberForm({ editingMember, onDone }: MemberFormProps) {
  const saveMember = useSaveMember()
  const fieldId = useId()

  // 수정 대상이 바뀌면 폼을 다시 채운다. effect 로 하면 렌더가 한 번 더 돌아
  // 이전 사람의 이름이 잠깐 보인다 (ProjectForm 과 같은 방식).
  const [editingId, setEditingId] = useState(editingMember?.id ?? null)
  const [values, setValues] = useState<MemberFormValues>(() =>
    editingMember ? valuesFrom(editingMember) : emptyValues(),
  )
  const [errors, setErrors] = useState<MemberFormErrors>({})

  if ((editingMember?.id ?? null) !== editingId) {
    setEditingId(editingMember?.id ?? null)
    setValues(editingMember ? valuesFrom(editingMember) : emptyValues())
    setErrors({})
  }

  function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault()

    const nextErrors = validateMemberForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    saveMember.mutate(
      { id: editingMember?.id ?? null, input: toMemberInputFromForm(values) },
      {
        onSuccess: () => {
          setValues(emptyValues())
          onDone()
        },
      },
    )
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      aria-label="구성원 등록"
      noValidate
    >
      <div className={styles.mode}>
        <h2 className={styles.modeLabel}>
          {editingMember ? '구성원 수정' : '새 구성원'}
        </h2>
        {editingMember ? (
          <button type="button" className={styles.resetButton} onClick={onDone}>
            새 구성원으로
          </button>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${fieldId}-name`}>
          이름
        </label>
        <input
          id={`${fieldId}-name`}
          className={
            errors.name ? `${styles.input} ${styles.invalid}` : styles.input
          }
          value={values.name}
          placeholder="예: 홍길동"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${fieldId}-name-error` : undefined}
          onChange={(changeEvent) =>
            setValues((previous) => ({
              ...previous,
              name: changeEvent.target.value,
            }))
          }
        />
        {errors.name ? (
          <p id={`${fieldId}-name-error`} className={styles.error}>
            {errors.name}
          </p>
        ) : null}
      </div>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={values.active}
          onChange={(changeEvent) =>
            setValues((previous) => ({
              ...previous,
              active: changeEvent.target.checked,
            }))
          }
        />
        재직 중
      </label>

      <p className={styles.hint}>
        재직 중인 사람만 일정의 참석자·담당자 후보로 올라갑니다. 떠난 사람은 지우지
        말고 재직 여부를 꺼 두세요 — 지난 일정의 기록은 그대로 남습니다.
      </p>

      <button
        type="submit"
        className={styles.submit}
        disabled={saveMember.isPending}
      >
        {saveMember.isPending ? '저장 중…' : editingMember ? '수정' : '등록'}
      </button>
    </form>
  )
}

export default MemberForm
