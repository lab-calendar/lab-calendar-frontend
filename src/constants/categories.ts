/**
 * 카테고리 키.
 *
 * 이 키는 tokens.css 의 `[data-category]` 셀렉터와 1:1로 대응하며, 요소에
 * `data-category={key}` 를 지정하면 `--category-color` 계열 변수가 매핑된다.
 * URL 필터 파라미터(`?categories=`)에 쓰이는 값이기도 하다.
 *
 * 표시 이름은 `GET /api/categories` 가 내려준다(KAN-38). 키는 서버와 프론트가
 * 공유하는 계약이므로 서버 응답에도 동일한 키가 포함되어야 한다.
 */
export const CATEGORY_KEYS = ['project', 'lab', 'card'] as const

export type CategoryKey = (typeof CATEGORY_KEYS)[number]

export function isCategoryKey(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value)
}

/**
 * 카테고리를 색 없이도 가려낼 수 있게 하는 표식 (KAN-64).
 *
 * 기획서상 외부 자문 위원까지 쓰는 서비스라 색각 이상을 가정해야 한다.
 * 적록색약이 있으면 과제(빨강)와 랩실(초록) 칩을 색으로는 구분할 수 없다.
 * 모양이 서로 다른 글리프를 색과 함께 붙여 둘 중 하나만으로도 구분되게 한다.
 */
export const CATEGORY_MARKS: Record<CategoryKey, string> = {
  project: '◆',
  lab: '●',
  card: '■',
}
