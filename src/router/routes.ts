/** 앱 라우트 경로. 링크와 라우터 정의 모두 이 상수를 참조한다. */
export const ROUTES = {
  calendar: '/',
  projects: '/projects',
  /** 랩실 구성원 명단 (KAN-74) */
  members: '/members',
  /** 카드 내역 엑셀 가져오기 (KAN-61) */
  cardImports: '/card-expenses',
  /** 비밀번호 입력 화면 (KAN-36) */
  login: '/login',
} as const
