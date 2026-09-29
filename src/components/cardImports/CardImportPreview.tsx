import type { CardImportResult } from '../../types/domain'
import styles from './CardImportPreview.module.css'

type CardImportPreviewProps = {
  result: CardImportResult
}

/**
 * 반영하면 무엇이 달라지는지 (KAN-54 설계 §3, §6.3).
 *
 * 달마다 추가·사라짐·그대로를 보여준다. **사라짐이 있는 달을 눈에 띄게** 하는 것이
 * 이 표의 핵심이다 — 파일에서 지워진 행은 반영과 함께 달력에서도 사라지므로,
 * 시트를 잘못 편집한 채 올리면 지난 기록이 통째로 없어질 수 있다.
 *
 * 오류가 있는 달은 서버가 통째로 보존한다. 그 달만 빼고 나머지는 반영되므로,
 * 어느 달이 왜 빠졌는지 여기서 알려 주지 않으면 반영 후에도 눈치채지 못한다.
 */
function CardImportPreview({ result }: CardImportPreviewProps) {
  const { months, skippedSheets, problems, totals } = result

  return (
    <div className={styles.preview}>
      <h3 className={styles.heading}>{result.fileName}</h3>

      <p className={styles.summary}>
        추가 {totals.added}건 · 사라짐 {totals.removed}건 · 그대로{' '}
        {totals.unchanged}건
        {totals.blockedMonths > 0
          ? ` · 오류로 보존한 달 ${totals.blockedMonths}개`
          : ''}
      </p>

      {months.length > 0 ? (
        <table className={styles.table}>
          <caption className="sr-only">달별 반영 예정 내역</caption>
          <thead>
            <tr>
              <th scope="col">달</th>
              <th scope="col">추가</th>
              <th scope="col">사라짐</th>
              <th scope="col">그대로</th>
              <th scope="col">상태</th>
            </tr>
          </thead>
          <tbody>
            {months.map((month) => (
              <tr
                key={month.month}
                data-status={month.status}
                data-removes={month.removed > 0 ? 'yes' : 'no'}
              >
                <th scope="row">{formatMonth(month.month)}</th>
                <td>{month.status === 'BLOCKED' ? '—' : month.added}</td>
                <td className={styles.removed}>
                  {month.status === 'BLOCKED' ? '—' : month.removed}
                </td>
                <td>{month.status === 'BLOCKED' ? '—' : month.unchanged}</td>
                <td>
                  {month.status === 'BLOCKED' ? (
                    <span className={styles.blocked}>
                      오류로 해당 월 전체 유지
                    </span>
                  ) : (
                    '반영'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={styles.empty}>파일에서 읽을 수 있는 월 시트가 없습니다.</p>
      )}

      {problems.length > 0 ? (
        <section className={styles.problems} aria-labelledby="card-import-problems">
          <h4 id="card-import-problems" className={styles.subheading}>
            문제 행 {problems.length}건
          </h4>
          <ul className={styles.problemList}>
            {problems.map((problem) => (
              <li
                key={`${problem.sheet}-${problem.row}-${problem.code}`}
                data-level={problem.level}
              >
                <span className={styles.problemWhere}>
                  {problem.sheet} {problem.row}행
                </span>{' '}
                {problem.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {skippedSheets.length > 0 ? (
        <section
          className={styles.skipped}
          aria-labelledby="card-import-skipped"
        >
          <h4 id="card-import-skipped" className={styles.subheading}>
            건너뛴 시트 {skippedSheets.length}개
          </h4>
          {/*
            건너뛴 시트는 오류가 아니다 — 양식 복사용 시트나 연도가 없는 옛 시트라
            읽지 않을 뿐이다. 다만 올린 사람은 "왜 그 달이 없지" 하게 되므로 적어 둔다.
          */}
          <ul className={styles.skippedList}>
            {skippedSheets.map((sheet) => (
              <li key={sheet.sheet}>
                {sheet.sheet} — {describeSkip(sheet.reason)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

/** `2026-09` → `2026년 9월` */
function formatMonth(month: string): string {
  const [year, monthPart] = month.split('-')
  return `${year}년 ${Number(monthPart)}월`
}

/** 서버 코드에 우리말을 붙인다. 모르는 코드는 그대로 보여준다. */
function describeSkip(reason: string): string {
  const REASONS: Record<string, string> = {
    YEAR_MISSING: '시트 이름에 연도가 없습니다',
    NOT_MONTH_SHEET: '월 시트가 아닙니다',
  }
  return REASONS[reason] ?? reason
}

export default CardImportPreview
