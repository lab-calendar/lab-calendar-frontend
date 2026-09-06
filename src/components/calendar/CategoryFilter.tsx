import { useCategoryFilter } from '../../hooks/useCategoryFilter'
import { useCategories } from '../../queries/useCategories'
import styles from './CategoryFilter.module.css'

/**
 * 카테고리별 선택 조회 (기획서 2.1 좌측 제어 영역).
 *
 * 표시 이름은 서버에서 받고, 선택 상태는 URL 쿼리 파라미터에 유지한다.
 * 조회 등급에서는 서버가 카드/경비 카테고리를 응답에서 빼므로(KAN-35)
 * 목록에서도 자연스럽게 사라진다. 프론트는 카테고리를 하드코딩하지 않는다.
 */
function CategoryFilter() {
  const { selected, toggle } = useCategoryFilter()
  const { data: categories, isPending, isError } = useCategories()

  // 로딩·에러 상태의 본격적인 처리는 KAN-63에서 다룬다
  if (isPending) {
    return <p className={styles.status}>카테고리를 불러오는 중입니다…</p>
  }

  if (isError) {
    return <p className={styles.status}>카테고리를 불러오지 못했습니다.</p>
  }

  return (
    <div>
      <ul className={styles.list}>
        {categories.map((category) => (
          <li key={category.id}>
            <label className={styles.item} data-category={category.key}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selected.includes(category.key)}
                onChange={() => toggle(category.key)}
              />
              <span className={styles.badge} aria-hidden="true" />
              <span className={styles.label}>{category.name}</span>
            </label>
          </li>
        ))}
      </ul>

      {selected.length === 0 ? (
        <p className={styles.emptyHint}>
          표시할 카테고리를 하나 이상 선택해 주세요.
        </p>
      ) : null}
    </div>
  )
}

export default CategoryFilter
