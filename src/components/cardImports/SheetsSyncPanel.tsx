import { useState } from 'react'
import { describeSyncFailure, isSheetsSyncDisabled } from '../../api/sheetsSync'
import { useSheetsSync } from '../../queries/useSheetsSync'
import type { SheetsSyncResult } from '../../types/domain'
import styles from './SheetsSyncPanel.module.css'

/**
 * 시트에서 지금 가져오기 (KAN-88).
 *
 * 서버는 매시 스스로 시트를 읽는다. 이 버튼은 그 회차를 당겨 쓰는 것이다 — 시트를
 * 고친 사람이 다음 정각까지 "반영됐나?" 하고 기다리지 않아도 되게.
 *
 * 파일 업로드와 달리 미리보기가 없다. 자동 회차와 똑같은 길을 타야 결과도 같고,
 * 위험한 삭제는 사람의 확인이 아니라 서버의 안전장치가 막는다.
 */
function SheetsSyncPanel() {
  const sync = useSheetsSync()
  const [result, setResult] = useState<SheetsSyncResult | null>(null)
  const [disabled, setDisabled] = useState(false)

  const run = () => {
    setResult(null)
    sync.mutate(undefined, {
      onSuccess: setResult,
      onError: (error) => {
        // 켜지지 않은 것은 고장이 아니다. 버튼을 내리고 이유를 남긴다.
        if (isSheetsSyncDisabled(error)) setDisabled(true)
      },
    })
  }

  return (
    <section className={styles.panel} aria-labelledby="sheets-sync-title">
      <h2 id="sheets-sync-title" className={styles.title}>
        시트에서 가져오기
      </h2>

      {disabled ? (
        <p className={styles.note} role="status">
          자동 동기화가 아직 켜져 있지 않습니다. 서버 설정을 켠 뒤에 쓸 수 있습니다.
        </p>
      ) : (
        <>
          <p className={styles.guide}>
            회의록 시트를 읽어 카드/경비 일정을 맞춥니다. 서버가 매시 스스로 하는
            일이며, 시트를 방금 고쳤다면 이 버튼으로 당겨 올 수 있습니다.
          </p>

          <button
            type="button"
            className={styles.button}
            disabled={sync.isPending}
            onClick={run}
          >
            {sync.isPending ? '가져오는 중…' : '지금 가져오기'}
          </button>

          {sync.isPending ? (
            <p className={styles.status} role="status">
              시트를 읽고 있습니다…
            </p>
          ) : null}
        </>
      )}

      {result?.applied ? (
        <div className={styles.result}>
          <p className={styles.resultTitle} role="status">
            가져왔습니다 — 추가 {result.added}건 · 사라짐 {result.removed}건 · 그대로{' '}
            {result.unchanged}건
          </p>

          {result.braked.length > 0 ? (
            <>
              {/*
                건너뛴 달은 결과 한 줄에 묻으면 안 된다. "무엇이 반영되지 않았는가"는
                반영된 건수보다 더 챙겨 봐야 하는 숫자다.
              */}
              <p className={styles.brakedTitle}>
                안전장치가 {result.braked.length}개 달을 건너뛰었습니다
              </p>
              <ul className={styles.brakedList}>
                {result.braked.map((month) => (
                  <li key={month.month}>
                    {month.month} — {month.active}건 중 {month.wouldRemove}건이
                    사라질 뻔해 그대로 두었습니다
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      {result && !result.applied ? (
        <p className={styles.failure} role="alert">
          {describeSyncFailure(result.failure)}
        </p>
      ) : null}
    </section>
  )
}

export default SheetsSyncPanel
