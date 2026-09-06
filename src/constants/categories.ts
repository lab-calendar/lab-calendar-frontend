/**
 * 카테고리 키.
 *
 * 이 키는 tokens.css 의 `[data-category]` 셀렉터와 1:1로 대응하며, 요소에
 * `data-category={key}` 를 지정하면 `--category-color` 계열 변수가 매핑된다.
 *
 * 카테고리의 표시 이름과 색상은 최종적으로 `GET /api/categories`(KAN-38)에서
 * 내려받는다. 아래 라벨은 API 연동(KAN-42) 전까지 쓰는 임시값이다.
 */
export const CATEGORY_KEYS = ['project', 'lab', 'card'] as const

export type CategoryKey = (typeof CATEGORY_KEYS)[number]

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  project: '과제/연구 관리',
  lab: '랩실 주기적 일정',
  card: '카드/경비 사용',
}
