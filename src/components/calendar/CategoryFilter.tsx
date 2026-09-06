import { CATEGORY_KEYS, CATEGORY_LABELS } from '../../constants/categories'
import { useCategoryFilter } from '../../hooks/useCategoryFilter'
import styles from './CategoryFilter.module.css'

/**
 * 카테고리별 선택 조회 (기획서 2.1 좌측 제어 영역).
 * 선택 상태는 URL 쿼리 파라미터에 유지된다.
 */
function CategoryFilter() {
  const { selected, toggle } = useCategoryFilter()

  return (
    <div>
      <ul className={styles.list}>
        {CATEGORY_KEYS.map((key) => (
          <li key={key}>
            <label className={styles.item} data-category={key}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selected.includes(key)}
                onChange={() => toggle(key)}
              />
              <span className={styles.badge} aria-hidden="true" />
              <span className={styles.label}>{CATEGORY_LABELS[key]}</span>
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
