import { useId, useState } from 'react'
import type { CategoryKey } from '../../constants/categories'
import { useEventForm } from '../../contexts/EventFormContext'
import { useCategories } from '../../queries/useCategories'
import { useSaveEvent } from '../../queries/useEventMutations'
import type { CalendarEvent } from '../../types/domain'
import { todayIso } from '../../utils/date'
import styles from './EventForm.module.css'
import {
  parseParticipants,
  validateEventForm,
  type EventFormErrors,
  type EventFormValues,
} from './eventFormValidation'

/** 카테고리마다 부가 정보의 의미가 다르다 (기획서 2.2) */
const DETAIL_FIELDS: Record<CategoryKey, { label: string; hint: string }> = {
  project: { label: '제출 단계', hint: '예: 연차보고서, 최종보고서' },
  lab: { label: '담당 연구원', hint: '예: 홍길동' },
  card: { label: '사용 목적', hint: '예: 다과비' },
}


function emptyValues(): EventFormValues {
  const today = todayIso()
  return {
    categoryKey: 'project',
    title: '',
    detail: '',
    startDate: today,
    endDate: today,
    participants: '',
    memo: '',
  }
}

function valuesFrom(event: CalendarEvent): EventFormValues {
  return {
    categoryKey: event.categoryKey,
    title: event.title,
    detail: event.detail ?? '',
    startDate: event.startDate,
    endDate: event.endDate,
    participants: event.participants.join(', '),
    memo: event.memo ?? '',
  }
}

/**
 * 일정 등록 · 수정 폼 (기획서 2.1 좌측 제어 영역).
 * 등록과 수정이 같은 폼을 쓴다. 수정 대상은 상세 팝업에서 넘어온다.
 */
function EventForm() {
  const { editingEvent, startCreate } = useEventForm()
  const { data: categories } = useCategories()
  const saveEvent = useSaveEvent()
  const fieldId = useId()

  // 수정 대상이 바뀌면 폼을 그 일정으로 다시 채운다.
  // effect 로 처리하면 렌더가 한 번 더 돌아 이전 값이 잠깐 보이므로 렌더 중에 맞춘다.
  const [editingEventId, setEditingEventId] = useState(editingEvent?.id ?? null)
  const [values, setValues] = useState<EventFormValues>(() =>
    editingEvent ? valuesFrom(editingEvent) : emptyValues(),
  )
  const [errors, setErrors] = useState<EventFormErrors>({})

  if ((editingEvent?.id ?? null) !== editingEventId) {
    setEditingEventId(editingEvent?.id ?? null)
    setValues(editingEvent ? valuesFrom(editingEvent) : emptyValues())
    setErrors({})
  }

  const detailField = DETAIL_FIELDS[values.categoryKey]

  function update<K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }))
  }

  function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault()

    const nextErrors = validateEventForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    saveEvent.mutate(
      {
        id: editingEvent?.id ?? null,
        input: {
          title: values.title.trim(),
          detail: values.detail.trim() || undefined,
          startDate: values.startDate,
          endDate: values.endDate,
          categoryKey: values.categoryKey,
          participants: parseParticipants(values.participants),
          memo: values.memo.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          startCreate()
          setValues(emptyValues())
        },
      },
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.mode}>
        <span className={styles.modeLabel}>
          {editingEvent ? '일정 수정' : '새 일정'}
        </span>
        {editingEvent ? (
          <button
            type="button"
            className={styles.resetButton}
            onClick={startCreate}
          >
            새 일정으로
          </button>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${fieldId}-category`}>
          항목 유형
        </label>
        <select
          id={`${fieldId}-category`}
          className={styles.select}
          value={values.categoryKey}
          onChange={(changeEvent) =>
            update('categoryKey', changeEvent.target.value as CategoryKey)
          }
        >
          {(categories ?? []).map((category) => (
            <option key={category.id} value={category.key}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${fieldId}-title`}>
          제목
        </label>
        <input
          id={`${fieldId}-title`}
          className={
            errors.title ? `${styles.input} ${styles.invalid}` : styles.input
          }
          value={values.title}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? `${fieldId}-title-error` : undefined}
          onChange={(changeEvent) => update('title', changeEvent.target.value)}
        />
        {errors.title ? (
          <p id={`${fieldId}-title-error`} className={styles.error}>
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${fieldId}-detail`}>
          {detailField.label}
        </label>
        <input
          id={`${fieldId}-detail`}
          className={styles.input}
          value={values.detail}
          placeholder={detailField.hint}
          onChange={(changeEvent) => update('detail', changeEvent.target.value)}
        />
      </div>

      <div className={styles.dateRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${fieldId}-start`}>
            시작일
          </label>
          <input
            id={`${fieldId}-start`}
            type="date"
            className={
              errors.startDate
                ? `${styles.input} ${styles.invalid}`
                : styles.input
            }
            value={values.startDate}
            aria-invalid={Boolean(errors.startDate)}
            aria-describedby={
              errors.startDate ? `${fieldId}-start-error` : undefined
            }
            onChange={(changeEvent) =>
              update('startDate', changeEvent.target.value)
            }
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${fieldId}-end`}>
            종료일
          </label>
          <input
            id={`${fieldId}-end`}
            type="date"
            className={
              errors.endDate ? `${styles.input} ${styles.invalid}` : styles.input
            }
            value={values.endDate}
            aria-invalid={Boolean(errors.endDate)}
            aria-describedby={
              errors.endDate ? `${fieldId}-end-error` : undefined
            }
            onChange={(changeEvent) =>
              update('endDate', changeEvent.target.value)
            }
          />
        </div>
      </div>

      {errors.startDate ? (
        <p id={`${fieldId}-start-error`} className={styles.error}>
          {errors.startDate}
        </p>
      ) : null}
      {errors.endDate ? (
        <p id={`${fieldId}-end-error`} className={styles.error}>
          {errors.endDate}
        </p>
      ) : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${fieldId}-participants`}>
          참석 인원
        </label>
        <input
          id={`${fieldId}-participants`}
          className={styles.input}
          value={values.participants}
          placeholder="홍길동, 김철수"
          aria-describedby={`${fieldId}-participants-hint`}
          onChange={(changeEvent) =>
            update('participants', changeEvent.target.value)
          }
        />
        {/* 연구원 목록에서 고르는 방식은 KAN-41 이후 */}
        <p id={`${fieldId}-participants-hint`} className={styles.hint}>
          쉼표로 구분해 입력합니다.
        </p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${fieldId}-memo`}>
          메모
        </label>
        <textarea
          id={`${fieldId}-memo`}
          className={styles.textarea}
          value={values.memo}
          onChange={(changeEvent) => update('memo', changeEvent.target.value)}
        />
      </div>

      <button
        type="submit"
        className={styles.submit}
        disabled={saveEvent.isPending}
      >
        {saveEvent.isPending ? '저장 중…' : editingEvent ? '수정' : '등록'}
      </button>
    </form>
  )
}

export default EventForm
