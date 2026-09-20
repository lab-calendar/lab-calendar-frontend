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
  /** tokens.css 의 --glass-fill 에서 가장 연한 지점 (아래쪽 65%) */
  const glass = blend('#ffffff', token('color-bg'), 0.65)
  /** 다이얼로그처럼 더 진하게 칠하는 면 */
  const glassStrong = blend('#ffffff', token('color-bg'), 0.82)

  it.each([
    ['본문 글자', 'color-text', TEXT],
    ['보조 글자', 'color-text-muted', TEXT],
    ['힌트 글자', 'color-text-subtle', TEXT],
    ['링크', 'color-primary', TEXT],
    ['오류 글자', 'color-danger', TEXT],
    ['입력 테두리', 'color-border-strong', UI],
  ])('%s / 유리 표면', (_name, foreground, minimum) => {
    expect(contrast(token(foreground), glass)).toBeGreaterThanOrEqual(minimum)
  })

  it('진한 유리는 흰색에 더 가까워 언제나 연한 쪽보다 유리하다', () => {
    // 둘 중 연한 쪽만 통과시키면 나머지는 자동으로 따라온다
    expect(contrast(token('color-text'), glassStrong)).toBeGreaterThanOrEqual(
      contrast(token('color-text'), glass),
    )
  })

  it('임박 일정 칩이 유리 위에 올라가도 큰라지지 않는다', () => {
    // 칩은 불투명이라 유리가 아니지만, 그 테두리가 바탕과 구분되어야 한다
    expect(
      contrast(token('category-project'), glass),
    ).toBeGreaterThanOrEqual(UI)
  })
})

describe('배경 그라데이션', () => {
  it('--color-bg 가 가장 어두운 지점이다', () => {
    /*
     * 유리 표면의 대비를 --color-bg 하나로 계산하는 것이 이 전제 덕분이다.
     * 틴트를 --color-bg 보다 어둡게 바꾸면 그 계산이 최악의 경우가 아니게 되고,
     * 어느 구석에서만 글자가 안 읽히는 상황이 조용히 생긴다.
     */
    const base = luminance(token('color-bg'))

    expect(luminance(token('color-bg-tint-cool'))).toBeGreaterThan(base)
    expect(luminance(token('color-bg-tint-warm'))).toBeGreaterThan(base)
  })
})
