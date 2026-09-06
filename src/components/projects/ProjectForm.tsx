import { useId, useState } from 'react'
import { useSaveProject } from '../../queries/useProjectMutations'
import type { Project } from '../../types/domain'
import { todayIso } from '../../utils/date'
import styles from './ProjectForm.module.css'
import {
  DEFAULT_LEAD_TIME_WEEKS,
  toProjectInputFromForm,
  validateProjectForm,
  type ProjectFormErrors,
  type ProjectFormValues,
} from './projectFormValidation'

function emptyValues(): ProjectFormValues {
  return {
    name: '',
    submissionStage: '',
    endDate: todayIso(),
    leadTimeWeeks: String(DEFAULT_LEAD_TIME_WEEKS),
    active: true,
  }
}

function valuesFrom(project: Project): ProjectFormValues {
  return {
    name: project.name,
    submissionStage: project.submissionStage ?? '',
    endDate: project.endDate,
    leadTimeWeeks: String(project.leadTimeWeeks),
    active: project.active,
  }
}

type ProjectFormProps = {
  /** 수정 중인 과제. 없으면 새 과제 등록이다. */
  editingProject: Project | null
  /** 저장했거나 수정을 그만둘 때 — 목록 쪽 선택을 푼다. */
  onDone: () => void
}

/** 과제 등록 · 수정 폼 (기획서 3.1). */
function ProjectForm({ editingProject, onDone }: ProjectFormProps) {
  const saveProject = useSaveProject()
  const fieldId = useId()

  // 수정 대상이 바뀌면 폼을 다시 채운다. effect 로 하면 렌더가 한 번 더 돌아
  // 이전 과제 값이 잠깐 보이므로 렌더 중에 맞춘다 (EventForm 과 같은 방식).
  const [editingId, setEditingId] = useState(editingProject?.id ?? null)
  const [values, setValues] = useState<ProjectFormValues>(() =>
    editingProject ? valuesFrom(editingProject) : emptyValues(),
  )
  const [errors, setErrors] = useState<ProjectFormErrors>({})

  if ((editingProject?.id ?? null) !== editingId) {
    setEditingId(editingProject?.id ?? null)
    setValues(editingProject ? valuesFrom(editingProject) : emptyValues())
    setErrors({})
  }

  function update<K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }))
  }

  function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault()

    const nextErrors = validateProjectForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    saveProject.mutate(
      {
        id: editingProject?.id ?? null,
        input: toProjectInputFromForm(values),
      },
      {
        onSuccess: () => {
          setValues(emptyValues())
          onDone()
        },
      },
    )
  }

  // noValidate: 준비 기간 input 의 min/max 를 브라우저가 먼저 막으면 네이티브
  // 말풍선만 뜨고 우리 인라인 메시지는 나오지 않는다. 검증을 한 곳으로 모은다.
  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      aria-label="과제 등록"
      noValidate
    >
      <div className={styles.mode}>
        <h2 className={styles.modeLabel}>
          {editingProject ? '과제 수정' : '새 과제'}
        </h2>
        {editingProject ? (
          <button type="button" className={styles.resetButton} onClick={onDone}>
            새 과제로
          </button>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${fieldId}-name`}>
          과제명
        </label>
        <input
          id={`${fieldId}-name`}
          className={
            errors.name ? `${styles.input} ${styles.invalid}` : styles.input
          }
          value={values.name}
          placeholder="예: BRL 과제"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${fieldId}-name-error` : undefined}
          onChange={(changeEvent) => update('name', changeEvent.target.value)}
        />
        {errors.name ? (
          <p id={`${fieldId}-name-error`} className={styles.error}>
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${fieldId}-stage`}>
          제출 단계
        </label>
        <input
          id={`${fieldId}-stage`}
          className={styles.input}
          value={values.submissionStage}
          placeholder="예: 연차보고서, 최종보고서"
          onChange={(changeEvent) =>
            update('submissionStage', changeEvent.target.value)
          }
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${fieldId}-end`}>
            제출 마감일
          </label>
          <input
            id={`${fieldId}-end`}
            type="date"
            className={
              errors.endDate ? `${styles.input} ${styles.invalid}` : styles.input
            }
            value={values.endDate}
            aria-invalid={Boolean(errors.endDate)}
            aria-describedby={errors.endDate ? `${fieldId}-end-error` : undefined}
            onChange={(changeEvent) =>
              update('endDate', changeEvent.target.value)
            }
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${fieldId}-lead`}>
            준비 기간 (주)
          </label>
          <input
            id={`${fieldId}-lead`}
            type="number"
            min={1}
            max={26}
            className={
              errors.leadTimeWeeks
                ? `${styles.input} ${styles.invalid}`
                : styles.input
            }
            value={values.leadTimeWeeks}
            aria-invalid={Boolean(errors.leadTimeWeeks)}
            aria-describedby={
              [
                `${fieldId}-lead-hint`,
                errors.leadTimeWeeks ? `${fieldId}-lead-error` : null,
              ]
                .filter(Boolean)
                .join(" ")
            }
            onChange={(changeEvent) =>
              update('leadTimeWeeks', changeEvent.target.value)
            }
          />
        </div>
      </div>

      {errors.endDate ? (
        <p id={`${fieldId}-end-error`} className={styles.error}>
          {errors.endDate}
        </p>
      ) : null}
      {errors.leadTimeWeeks ? (
        <p id={`${fieldId}-lead-error`} className={styles.error}>
          {errors.leadTimeWeeks}
        </p>
      ) : null}

      <p id={`${fieldId}-lead-hint`} className={styles.hint}>
        마감일에서 준비 기간만큼 거슬러 올라간 날부터 캘린더에 준비 기간 일정이
        자동으로 표시됩니다.
      </p>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={values.active}
          onChange={(changeEvent) =>
            update('active', changeEvent.target.checked)
          }
        />
        캘린더에 표시
      </label>

      <button
        type="submit"
        className={styles.submit}
        disabled={saveProject.isPending}
      >
        {saveProject.isPending ? '저장 중…' : editingProject ? '수정' : '등록'}
      </button>
    </form>
  )
}

export default ProjectForm
