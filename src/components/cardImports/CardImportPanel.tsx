import { useRef, useState } from 'react'
import { isPreviewStale } from '../../api/cardImports'
import { messageFromError } from '../../api/errorMessage'
import {
  useApplyCardImport,
  usePreviewCardImport,
} from '../../queries/useCardImports'
import { hasApplicableMonth, type CardImportResult } from '../../types/domain'
import CardImportPreview from './CardImportPreview'
import styles from './CardImportPanel.module.css'

/**
 * 파일을 골라 미리보기를 보고 반영하는 흐름 (KAN-54 설계 §6.3).
 *
 * 달 단위로 기존 내역을 갈아 끼우는 작업이라, 무엇이 사라지는지 보지 않고 누르게
 * 하면 안 된다. 그래서 반영 버튼은 미리보기를 받은 뒤에만 생긴다.
 *
 * 파일과 미리보기는 한 쌍으로 다룬다 — 파일을 바꾸면 앞서 받은 미리보기는 그
 * 파일의 것이 아니므로 즉시 버린다. 서버도 토큰에 파일 해시를 묶어 두고 있어
 * 어긋난 짝으로 반영하면 409 로 거절한다.
 */
function CardImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CardImportResult | null>(null)
  const [applied, setApplied] = useState<CardImportResult | null>(null)
  const [staleNotice, setStaleNotice] = useState<string | null>(null)

  const previewImport = usePreviewCardImport()
  const applyImport = useApplyCardImport()

  const chooseFile = (chosen: File | null) => {
    setFile(chosen)
    // 앞 파일의 미리보기·결과가 새 파일의 것처럼 보이지 않게 한다
    setPreview(null)
    setApplied(null)
    setStaleNotice(null)

    if (!chosen) return

    previewImport.mutate(chosen, { onSuccess: setPreview })
  }

  const apply = () => {
    if (!file || !preview) return

    setStaleNotice(null)
    applyImport.mutate(
      { file, previewToken: preview.previewToken },
      {
        onSuccess: (result) => {
          setApplied(result)
          setPreview(null)
        },
        onError: (error) => {
          /*
           * 미리보기를 보여준 뒤에 파일이나 DB 가 바뀌면 서버가 반영을 거절한다.
           * 이때 토스트만 띄우면 사용자는 낡은 미리보기를 보며 다시 누르게 되고,
           * 같은 거절을 반복한다. 미리보기를 지워 파일부터 다시 고르게 한다.
           */
          if (isPreviewStale(error)) {
            setPreview(null)
            setStaleNotice(
              `${messageFromError(error)} 파일을 다시 선택해 미리보기를 받아 주세요.`,
            )
            return
          }

          setStaleNotice(`반영하지 못했습니다. ${messageFromError(error)}`)
        },
      },
    )
  }

  const canApply =
    preview !== null && hasApplicableMonth(preview) && !applyImport.isPending

  return (
    <section className={styles.panel} aria-labelledby="card-import-title">
      <h2 id="card-import-title" className={styles.title}>
        카드 내역 올리기
      </h2>
      <p className={styles.guide}>
        구글 시트에서 <strong>파일 → 다운로드 → Microsoft Excel(.xlsx)</strong> 로
        받은 파일을 그대로 올립니다. 시트 양식은 바꾸지 않아도 됩니다.
      </p>

      <div className={styles.picker}>
        <input
          ref={fileInputRef}
          id="card-import-file"
          className={styles.fileInput}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(changeEvent) =>
            chooseFile(changeEvent.target.files?.[0] ?? null)
          }
        />
        <label className={styles.fileLabel} htmlFor="card-import-file">
          파일 선택
        </label>
        <span className={styles.fileName}>
          {file ? file.name : '선택된 파일이 없습니다'}
        </span>
      </div>

      {previewImport.isPending ? (
        <p className={styles.status} role="status">
          파일을 읽는 중입니다…
        </p>
      ) : null}

      {staleNotice ? (
        <p className={styles.staleNotice} role="alert">
          {staleNotice}
        </p>
      ) : null}

      {preview ? (
        <>
          <CardImportPreview result={preview} />

          <div className={styles.actions}>
            {hasApplicableMonth(preview) ? null : (
              // 반영할 달이 없으면 서버도 422 로 거절한다. 누르기 전에 알린다
              <p className={styles.noApply}>
                반영할 수 있는 달이 없습니다. 오류를 고친 뒤 다시 올려 주세요.
              </p>
            )}
            <button
              type="button"
              className={styles.applyButton}
              disabled={!canApply}
              onClick={apply}
            >
              {applyImport.isPending ? '반영 중…' : '반영'}
            </button>
          </div>
        </>
      ) : null}

      {applied ? (
        <div className={styles.result}>
          <p className={styles.resultTitle} role="status">
            반영했습니다 — 추가 {applied.totals.added}건 · 사라짐{' '}
            {applied.totals.removed}건 · 그대로 {applied.totals.unchanged}건
          </p>
          {applied.totals.blockedMonths > 0 ? (
            <p className={styles.resultNote}>
              오류가 있는 {applied.totals.blockedMonths}개 달은 그대로 두었습니다.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default CardImportPanel
