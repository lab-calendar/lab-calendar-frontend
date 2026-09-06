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
    ['오류 글자 / 배경', 'color-danger', 'color-bg', TEXT],
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
