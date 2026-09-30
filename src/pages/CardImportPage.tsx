import CardImportHistory from '../components/cardImports/CardImportHistory'
import CardImportPanel from '../components/cardImports/CardImportPanel'
import SheetsSyncPanel from '../components/cardImports/SheetsSyncPanel'
import { useCanEdit } from '../contexts/AuthContext'
import styles from './Page.module.css'

/**
 * 카드 내역 가져오기 화면 (KAN-61, KAN-54 설계 §6.3).
 *
 * 조회 등급은 카드 데이터를 아예 받지 못한다(KAN-35). 서버가 이력 조회와 업로드를
 * 모두 403 으로 막으므로 여기서 가리는 것은 편의일 뿐이지만, 눌러 봐야 거절만
 * 돌아오는 화면을 열어 두지는 않는다.
 */
function CardImportPage() {
  const canEdit = useCanEdit()

  if (!canEdit) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>카드 내역</h1>
        </div>
        <p className={styles.notice}>
          카드 내역은 편집 등급만 볼 수 있습니다.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>카드 내역</h1>
        <p className={styles.subtitle}>
          회의비 장부 파일을 올리면 달력의 카드/경비 일정이 파일 내용으로 맞춰집니다.
          오류가 있는 달은 건드리지 않습니다.
        </p>
      </div>

      {/*
        시트 쪽을 먼저 둔다 (KAN-88). 서버가 매시 스스로 하는 일이라 대부분은 여기서
        끝나고, 파일 업로드는 시트에 없는 달을 손으로 채울 때만 쓴다.
      */}
      <section className={styles.panel}>
        <SheetsSyncPanel />
      </section>

      <section className={styles.panel}>
        <CardImportPanel />
      </section>

      <section className={styles.panel}>
        <CardImportHistory />
      </section>
    </div>
  )
}

export default CardImportPage
