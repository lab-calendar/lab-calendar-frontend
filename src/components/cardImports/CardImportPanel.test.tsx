import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyCardImport, previewCardImport } from '../../api/cardImports'
import { ApiError } from '../../api/errors'
import { renderWithRouter } from '../../test/renderWithRouter'
import type { CardImportResult } from '../../types/domain'
import CardImportPanel from './CardImportPanel'

vi.mock('../../api/cardImports', async (importOriginal) => {
  // isPreviewStale 은 진짜를 쓴다 — 에러를 갈라내는 규칙까지 흉내 내면 검증이 헐거워진다
  const actual = await importOriginal<typeof import('../../api/cardImports')>()
  return {
    ...actual,
    previewCardImport: vi.fn(),
    applyCardImport: vi.fn(),
    fetchCardImports: vi.fn().mockResolvedValue([]),
  }
})

function result(overrides: Partial<CardImportResult> = {}): CardImportResult {
  return {
    dryRun: true,
    previewToken: 'token-1',
    fileName: '회의록 인원.xlsx',
    months: [
      { month: '2026-09', status: 'READY', added: 3, removed: 0, unchanged: 12 },
    ],
    skippedSheets: [],
    problems: [],
    totals: {
      added: 3,
      removed: 0,
      unchanged: 12,
      skippedRows: 0,
      blockedMonths: 0,
    },
    ...overrides,
  }
}

function xlsx(name = '회의록 인원.xlsx'): File {
  return new File(['xlsx'], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

async function chooseFile(file = xlsx()) {
  await userEvent.upload(screen.getByLabelText('파일 선택'), file)
}

describe('CardImportPanel (KAN-61)', () => {
  // `mockImplementationOnce` 로 쌓아 둔 것이 다음 테스트로 새지 않게 비운다
  beforeEach(() => {
    vi.mocked(previewCardImport).mockReset()
    vi.mocked(applyCardImport).mockReset()
  })

  it('파일을 고르면 미리보기를 받아 무엇이 달라지는지 보여준다', async () => {
    vi.mocked(previewCardImport).mockResolvedValue(result())
    renderWithRouter(<CardImportPanel />)

    await chooseFile()

    expect(await screen.findByText('2026년 9월')).toBeInTheDocument()
    expect(screen.getByText(/추가 3건/)).toBeInTheDocument()
  })

  it('미리보기를 받기 전에는 반영할 수 없다', async () => {
    renderWithRouter(<CardImportPanel />)

    expect(screen.queryByRole('button', { name: '반영' })).not.toBeInTheDocument()
  })

  it('반영할 달이 없으면 반영 버튼이 잠긴다', async () => {
    // 모든 달이 막히면 서버도 422 로 거절한다. 누르기 전에 막는다
    vi.mocked(previewCardImport).mockResolvedValue(
      result({
        months: [
          { month: '2026-09', status: 'BLOCKED', added: 0, removed: 0, unchanged: 0 },
        ],
        totals: {
          added: 0,
          removed: 0,
          unchanged: 0,
          skippedRows: 2,
          blockedMonths: 1,
        },
      }),
    )
    renderWithRouter(<CardImportPanel />)

    await chooseFile()

    expect(await screen.findByRole('button', { name: '반영' })).toBeDisabled()
    expect(screen.getByText(/반영할 수 있는 달이 없습니다/)).toBeInTheDocument()
  })

  it('파일을 바꾸면 앞 파일의 미리보기를 버린다', async () => {
    // 짝이 맞지 않는 미리보기로 반영하면 서버가 409 로 거절한다. 그 전에 지운다
    vi.mocked(previewCardImport)
      .mockResolvedValueOnce(result({ fileName: '첫 파일.xlsx' }))
      .mockImplementationOnce(() => new Promise(() => {}))
    renderWithRouter(<CardImportPanel />)

    await chooseFile(xlsx('첫 파일.xlsx'))
    // 파일 이름은 선택 표시에도 나오므로 미리보기 제목으로 좁혀서 본다
    expect(
      await screen.findByRole('heading', { name: '첫 파일.xlsx' }),
    ).toBeInTheDocument()

    await chooseFile(xlsx('두 번째 파일.xlsx'))

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: '첫 파일.xlsx' }),
      ).not.toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: '반영' })).not.toBeInTheDocument()
  })

  it('반영하면 결과 건수를 남긴다', async () => {
    vi.mocked(previewCardImport).mockResolvedValue(result())
    vi.mocked(applyCardImport).mockResolvedValue(
      result({
        dryRun: false,
        totals: {
          added: 3,
          removed: 1,
          unchanged: 12,
          skippedRows: 0,
          blockedMonths: 0,
        },
      }),
    )
    renderWithRouter(<CardImportPanel />)

    await chooseFile()
    await userEvent.click(await screen.findByRole('button', { name: '반영' }))

    expect(await screen.findByText(/반영했습니다/)).toBeInTheDocument()
    expect(screen.getByText(/사라짐 1건/)).toBeInTheDocument()
  })

  it('반영에 쓰는 토큰은 미리보기에서 받은 것이다', async () => {
    vi.mocked(previewCardImport).mockResolvedValue(
      result({ previewToken: 'token-42' }),
    )
    vi.mocked(applyCardImport).mockResolvedValue(result({ dryRun: false }))
    renderWithRouter(<CardImportPanel />)

    const file = xlsx()
    await chooseFile(file)
    await userEvent.click(await screen.findByRole('button', { name: '반영' }))

    await waitFor(() => {
      expect(applyCardImport).toHaveBeenCalledWith(file, 'token-42')
    })
  })

  describe('미리보기가 낡았을 때', () => {
    it('미리보기를 지우고 다시 받으라고 알린다', async () => {
      /*
       * 토스트만 띄우면 사용자는 낡은 표를 보며 다시 누르고, 같은 거절을 반복한다.
       * 표를 치워 파일부터 다시 고르게 한다.
       */
      vi.mocked(previewCardImport).mockResolvedValue(result())
      vi.mocked(applyCardImport).mockRejectedValue(
        new ApiError('CONFLICT', '미리보기 이후 파일이나 저장된 내역이 바뀌었습니다.', {
          code: 'PREVIEW_STALE',
        }),
      )
      renderWithRouter(<CardImportPanel />)

      await chooseFile()
      await userEvent.click(await screen.findByRole('button', { name: '반영' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        /파일을 다시 선택해 미리보기를 받아 주세요/,
      )
      expect(screen.queryByRole('button', { name: '반영' })).not.toBeInTheDocument()
    })

    it('그 밖의 실패는 미리보기를 남겨 두고 사유만 알린다', async () => {
      // 다시 눌러 볼 수 있는 실패다. 표까지 치우면 처음부터 다시 해야 한다
      vi.mocked(previewCardImport).mockResolvedValue(result())
      vi.mocked(applyCardImport).mockRejectedValue(
        new ApiError('SERVER', '서버에 문제가 발생했습니다.'),
      )
      renderWithRouter(<CardImportPanel />)

      await chooseFile()
      await userEvent.click(await screen.findByRole('button', { name: '반영' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        /서버에 문제가 발생했습니다/,
      )
      expect(screen.getByRole('button', { name: '반영' })).toBeInTheDocument()
    })
  })
})
