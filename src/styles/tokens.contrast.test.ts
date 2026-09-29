/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * 색상 토큰의 명도 대비를 지킨다 (KAN-64).
 *
 * 색을 조금 밝히는 변경은 눈으로는 티가 잘 안 나는데 기준은 쉽게 깨진다.
 * 값을 직접 읽어 계산하므로, 토큰을 되돌리면 여기서 먼저 걸린다.
 *
 * 스타일시트를 그대로 읽는다 — 테스트 환경은 CSS 처리를 꺼 두어서(vite.config.ts
 * `css: false`) `?raw` 로 가져오면 빈 문자열이 온다. node 타입은 이 파일에서만
 * 필요하므로 tsconfig 를 건드리지 않고 참조 지시자로 들인다.
 */
// vitest 는 프로젝트 루트에서 돌아 상대 경로가 그대로 통한다
const css = readFileSync('src/styles/tokens.css', 'utf8')

const TOKENS = new Map<string, string>()
for (const match of css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)) {
  TOKENS.set(match[1], match[2])
}

function token(name: string): string {
  const value = TOKENS.get(name)
  if (!value) throw new Error(`토큰을 찾지 못했습니다: --${name}`)
  return value
}

function channel(value: number): number {
  const ratio = value / 255
  return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((index) =>
    parseInt(hex.slice(index, index + 2), 16),
  )
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  )
  return (lighter + 0.05) / (darker + 0.05)
}

/** 본문 글자 기준 (WCAG AA) */
const TEXT = 4.5
/** 입력 테두리처럼 모양으로 알아봐야 하는 UI 경계 기준 */
const UI = 3

describe('색상 토큰 명도 대비', () => {
  it.each([
    ['본문 글자 / 표면', 'color-text', 'color-surface', TEXT],
    ['본문 글자 / 배경', 'color-text', 'color-bg', TEXT],
    ['보조 글자 / 표면', 'color-text-muted', 'color-surface', TEXT],
    ['보조 글자 / 흐린 표면', 'color-text-muted', 'color-surface-muted', TEXT],
    ['힌트 글자 / 표면', 'color-text-subtle', 'color-surface', TEXT],
    ['힌트 글자 / 흐린 표면', 'color-text-subtle', 'color-surface-muted', TEXT],
    ['버튼 글자 / 주색', 'color-text-inverse', 'color-primary', TEXT],
    ['링크 / 표면', 'color-primary', 'color-surface', TEXT],
    ['오류 글자 / 표면', 'color-danger', 'color-surface', TEXT],
    // 페이지 제목과 설명은 패널 없이 배경 위에 바로 농인다 (KAN-72).
    ['본문 글자 / 배경', 'color-text', 'color-bg', TEXT],
    ['보조 글자 / 배경', 'color-text-muted', 'color-bg', TEXT],
    ['오류 글자 / 배경', 'color-danger', 'color-bg', TEXT],
    // 지난 마감 D-Day 칩 (KAN-52). 과제 카테고리 색이 이미 붉은색이라
    // 글자색만으로는 구별되지 않아, 칠을 뒤집어 구분한다.
    ['지난 마감 칩', 'color-text-inverse', 'color-danger', TEXT],
    // 마감 임박 일정 칩 (KAN-53). 같은 이유로 칠을 뒤집어 강조한다.
    ['마감 임박 칩', 'color-text-inverse', 'category-project', TEXT],
    ['과제 칩 글자', 'category-project', 'category-project-soft', TEXT],
    ['랩실 칩 글자', 'category-lab', 'category-lab-soft', TEXT],
    ['카드 칩 글자', 'category-card', 'category-card-soft', TEXT],
    ['입력 테두리 / 표면', 'color-border-strong', 'color-surface', UI],
    ['과제 표식 / 표면', 'category-project', 'color-surface', UI],
    ['랩실 표식 / 표면', 'category-lab', 'color-surface', UI],
    ['카드 표식 / 표면', 'category-card', 'color-surface', UI],
  ])('%s', (_name, foreground, background, minimum) => {
    expect(
      contrast(token(foreground), token(background)),
    ).toBeGreaterThanOrEqual(minimum)
  })
})

/**
 * 유리 표면은 반투명이라 실제 색이 뒤에 무엇이 있느냐에 따라 달라진다 (KAN-72).
 *
 * 토큰에는 rgba 가 들어 있어 위의 표를 그대로 쓸 수 없다. 대신 유리가 배경
 * 위에 올라갔을 때의 합성색을 계산해, 그 위에서도 글자가 읽힐지 확인한다.
 *
 * 배경은 그라데이션의 가장 어두운 지점(--color-bg)으로 잡는다 — 거기서 통하면
 * 더 밝은 곳에서도 통한다.
 */
function blend(foreground: string, background: string, alpha: number): string {
  const mix = (index: number) => {
    const top = parseInt(foreground.slice(index, index + 2), 16)
    const bottom = parseInt(background.slice(index, index + 2), 16)
    return Math.round(top * alpha + bottom * (1 - alpha))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${mix(1)}${mix(3)}${mix(5)}`
}

describe('유리 표면 위의 명도 대비', () => {
  /*
   * 유리 뒤에는 배경색과 색 번짐 세 가지가 깔린다 (KAN-73). 번짐 한가운데가 가장
   * 진하므로, 유리가 그 위에 올라간 경우를 모두 계산한다. 어느 하나에서라도 기준을
   * 못 넘기면 그 번짐 위를 지나는 글자는 읽히지 않는다.
   *
   * 유리 농도는 가장 연한 지점(아래쪽 72%)으로 잡는다 — 거기서 통하면 위쪽은 저절로 통한다.
   */
  const GLASS_ALPHA = 0.72
  const GLASS_STRONG_ALPHA = 0.86

  const backdrops = [
    'color-bg',
    'backdrop-blue',
    'backdrop-violet',
    'backdrop-teal',
  ] as const

  const pairs = [
    ['본문 글자', 'color-text', TEXT],
    ['보조 글자', 'color-text-muted', TEXT],
    ['힌트 글자', 'color-text-subtle', TEXT],
    ['링크', 'color-primary', TEXT],
    ['오류 글자', 'color-danger', TEXT],
    ['입력 테두리', 'color-border-strong', UI],
    ['과제 표식', 'category-project', UI],
    ['랩실 표식', 'category-lab', UI],
    ['카드 표식', 'category-card', UI],
  ] as const

  const cases = backdrops.flatMap((backdrop) =>
    pairs.map(([name, foreground, minimum]) => [
      `${name} / 유리 (${backdrop} 위)`,
      foreground,
      backdrop,
      minimum,
    ] as const),
  )

  it.each(cases)('%s', (_name, foreground, backdrop, minimum) => {
    const glass = blend('#ffffff', token(backdrop), GLASS_ALPHA)
    expect(contrast(token(foreground), glass)).toBeGreaterThanOrEqual(minimum)
  })

  it('진한 유리는 연한 유리보다 언제나 유리하다', () => {
    // 다이얼로그처럼 더 진하게 칠하는 면은 따로 검증하지 않아도 된다
    for (const backdrop of backdrops) {
      expect(
        contrast(token('color-text'), blend('#ffffff', token(backdrop), GLASS_STRONG_ALPHA)),
      ).toBeGreaterThanOrEqual(
        contrast(token('color-text'), blend('#ffffff', token(backdrop), GLASS_ALPHA)),
      )
    }
  })

  it('색 번짐이 실제로 색을 띤다', () => {
    /*
     * 대비를 맞추려다 번짐을 배경색만큼 옅게 만들면 유리 너머로 비칠 것이 없어진다.
     * KAN-72 가 그렇게 해서 효과가 보이지 않았다. 번짐은 배경보다 눈에 띄게 진해야 한다.
     */
    const base = luminance(token('color-bg'))
    for (const backdrop of ['backdrop-blue', 'backdrop-violet', 'backdrop-teal']) {
      expect(base - luminance(token(backdrop))).toBeGreaterThan(0.08)
    }
  })
})
