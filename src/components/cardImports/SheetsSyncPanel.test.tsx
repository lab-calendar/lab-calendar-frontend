import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '../../test/renderWithRouter'
import { setUpMockApi } from '../../test/mockApi'
import { setSheetsSyncCase } from '../../mocks/scenario'
import SheetsSyncPanel from './SheetsSyncPanel'

/**
 * 시트에서 지금 가져오기 (KAN-88).
 *
 * 서버가 "반영하지 않았다"고 답하는 경우가 화면의 핵심이다 — 안전장치가 막았거나
 * 권한이 끊겼을 때, 눌러 놓고 아무 말도 없으면 반영된 줄 알게 된다.
 *
 * 토스트가 같은 문장을 한 번 더 내므로 확인은 패널 안으로 좁힌다. 토스트는 지나가고
 * 패널에 남는 쪽이 나중에 다시 읽을 수 있는 기록이다.
 */
describe('SheetsSyncPanel', () => {
  setUpMockApi({ tier: 'EDITOR' })

  const panel = () => within(screen.getByRole('region', { name: '시트에서 가져오기' }))

  const press = async (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getByRole('button', { name: '지금 가져오기' }))

  it('가져온 결과를 건수로 보여준다', async () => {
    const user = userEvent.setup()
    renderWithRouter(<SheetsSyncPanel />)

    await press(user)

    expect(await panel().findByText(/추가 5건/)).toBeInTheDocument()
    expect(panel().getByText(/사라짐 1건/)).toBeInTheDocument()
  })

  it('안전장치가 건너뛴 달을 숫자와 함께 따로 알린다', async () => {
    setSheetsSyncCase('braked')
    const user = userEvent.setup()
    renderWithRouter(<SheetsSyncPanel />)

    await press(user)

    expect(
      await panel().findByText(/안전장치가 1개 달을 건너뛰었습니다/),
    ).toBeInTheDocument()
    // 무엇이 반영되지 않았는지가 반영된 건수보다 중요하다
    expect(
      panel().getByText(/2026-08 — 34건 중 31건이 사라질 뻔해 그대로 두었습니다/),
    ).toBeInTheDocument()
  })

  it('권한이 끊겼으면 무엇을 해야 하는지까지 알린다', async () => {
    setSheetsSyncCase('denied')
    const user = userEvent.setup()
    renderWithRouter(<SheetsSyncPanel />)

    await press(user)

    const alert = await panel().findByRole('alert')
    expect(alert).toHaveTextContent('시트를 볼 권한이 없습니다')
    expect(alert).toHaveTextContent('공유가 해제되었거나')
  })

  it('반영하지 않았을 때는 건수를 내지 않는다', async () => {
    setSheetsSyncCase('denied')
    const user = userEvent.setup()
    renderWithRouter(<SheetsSyncPanel />)

    await press(user)
    await panel().findByRole('alert')

    // 0건 추가라고 적으면 "돌았고 바뀐 게 없다"로 읽힌다 — 실제로는 못 읽었다
    expect(panel().queryByText(/추가 0건/)).not.toBeInTheDocument()
  })

  it('서버에 켜져 있지 않으면 고장이 아니라 설정이라고 말한다', async () => {
    setSheetsSyncCase('disabled')
    const user = userEvent.setup()
    renderWithRouter(<SheetsSyncPanel />)

    await press(user)

    expect(
      await panel().findByText(/자동 동기화가 아직 켜져 있지 않습니다/),
    ).toBeInTheDocument()
    // 눌러 봐야 같은 답만 오는 버튼은 남겨 두지 않는다
    expect(
      panel().queryByRole('button', { name: '지금 가져오기' }),
    ).not.toBeInTheDocument()
  })
})
