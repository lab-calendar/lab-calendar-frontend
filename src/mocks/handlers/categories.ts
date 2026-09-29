import { http } from 'msw'
import { currentTier } from '../data/db'
import { MOCK_CATEGORIES } from '../data/fixtures'
import { failIfScenario, guard, ok } from './respond'

/**
 * 카테고리 (KAN-38).
 *
 * 조회 등급에게는 카드/경비를 빼고 내려준다. 목록에서 빼는 것까지 서버가 하는 이유는,
 * 프론트가 등급을 몰라도 되게 하기 위해서다 — 받은 목록을 그대로 그리면 된다.
 */
export const categoryHandlers = [
  http.get('/api/categories', async ({ request }) => {
    const denied = await guard(request.method)
    if (denied) return denied

    const failure = await failIfScenario('categories')
    if (failure) return failure

    const categories =
      currentTier() === 'VIEWER'
        ? MOCK_CATEGORIES.filter((category) => category.key !== 'card')
        : MOCK_CATEGORIES

    return ok(categories)
  }),
]
