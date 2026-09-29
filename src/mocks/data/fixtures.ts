import { addDays } from '../../utils/date'
import type {
  MockCardImport,
  MockEvent,
  MockMember,
  MockProject,
} from './types'

/**
 * 목 서버의 초기 데이터 (KAN-70).
 *
 * 오늘을 받아서 상대적으로 만든다. 날짜를 고정해 두면 며칠만 지나도 달력이 빈 채로
 * 열려서, 화면을 보려고 목을 켠 사람이 "망가졌나" 하고 의심하게 된다.
 *
 * 이름은 전부 가공이다 — 기획서에 쓰인 예시(홍길동, 김철수)를 따른다.
 */

export const MOCK_CATEGORIES = [
  { id: '1', key: 'project', name: '과제/연구 관리' },
  { id: '2', key: 'lab', name: '랩실 주기적 일정' },
  { id: '3', key: 'card', name: '카드/경비 사용' },
] as const

export function seedMembers(): MockMember[] {
  return [
    { id: '1', name: '홍길동', active: true },
    { id: '2', name: '김철수', active: true },
    { id: '3', name: '이영희', active: true },
    { id: '4', name: '박민수', active: true },
    // 떠난 사람도 남는다 — 지난 일정의 참석 기록이 사라지면 안 된다
    { id: '5', name: '최지우', active: false },
  ]
}

export function seedProjects(today: string): MockProject[] {
  return [
    // 마감이 코앞이라 위젯·알림·빨간 강조를 바로 볼 수 있다
    {
      id: '1',
      name: 'BRL 과제',
      submissionStage: '연차보고서',
      endDate: addDays(today, 4),
      leadTimeDays: 21,
      active: true,
    },
    {
      id: '2',
      name: '창의도전 과제',
      submissionStage: '중간보고서',
      endDate: addDays(today, 25),
      leadTimeDays: 14,
      active: true,
    },
    // 제출 단계가 없는 과제 — 달력 문구가 과제명만으로도 되는지 보기 위해
    {
      id: '3',
      name: '산학협력 과제',
      submissionStage: null,
      endDate: addDays(today, 60),
      leadTimeDays: 30,
      active: true,
    },
    // 지난 마감 (D-Day 가 음수인 경우)
    {
      id: '4',
      name: '인공지능 과제',
      submissionStage: '최종보고서',
      endDate: addDays(today, -6),
      leadTimeDays: 21,
      active: true,
    },
    // 캘린더에서 내린 과제 — 준비 기간 막대가 사라지는지 보기 위해
    {
      id: '5',
      name: '소재융합 과제',
      submissionStage: '연차보고서',
      endDate: addDays(today, 40),
      leadTimeDays: 21,
      active: false,
    },
  ]
}

export function seedEvents(today: string): MockEvent[] {
  return [
    {
      id: '1',
      title: '정기 주간 랩미팅',
      detail: '홍길동',
      startDate: addDays(today, 1),
      endDate: addDays(today, 1),
      categoryKey: 'lab',
      memo: '주간 진행 공유',
      participants: ['홍길동', '김철수', '이영희'],
      source: 'MANUAL',
    },
    {
      id: '2',
      title: '장비 점검',
      detail: '박민수',
      startDate: addDays(today, 3),
      endDate: addDays(today, 5),
      categoryKey: 'lab',
      memo: null,
      participants: ['박민수'],
      source: 'MANUAL',
    },
    {
      id: '3',
      title: '학회 출장',
      detail: '연차보고서 발표',
      startDate: addDays(today, 8),
      endDate: addDays(today, 10),
      categoryKey: 'project',
      memo: '대전 개최',
      participants: ['홍길동', '이영희'],
      source: 'MANUAL',
    },
    /*
     * 카드 지출은 조회 등급에게 보이면 안 되는 데이터다 (KAN-35). 목에도 넣어 두어야
     * 등급을 바꿔 가며 "정말 빠지는지" 를 눈으로 확인할 수 있다.
     *
     * 출처는 GOOGLE_SYNC 다. 엑셀 업로드로 들어온 카드 내역도 서버가 이 값으로 적는다
     * (KAN-58). CARD_IMPORT 로의 전환은 데이터 마이그레이션이 따르는 후속 작업이다.
     *
     * 제목은 과제(장부 B열), detail 은 구분 원문(D열)이다 — 엑셀에서 들여온 카드
     * 내역을 서버가 그렇게 내려준다 (KAN-54 설계 §5). 파일에 카드 종류 열은 없고,
     * 과제마다 연구비 카드가 따로라 과제명이 곧 카드다. 서버는 대괄호·콜론을 붙이지
     * 않는다. 달력 칩은 이 둘만 보여주고 참석 인원(C열)은 마우스를 올렸을 때 나온다.
     */
    {
      id: '4',
      title: 'BRL',
      detail: '저녁',
      startDate: addDays(today, 2),
      endDate: addDays(today, 2),
      categoryKey: 'card',
      memo: null,
      participants: ['홍길동', '김철수'],
      source: 'GOOGLE_SYNC',
    },
    {
      id: '5',
      title: '과제A',
      detail: '초과',
      startDate: addDays(today, -2),
      endDate: addDays(today, -2),
      categoryKey: 'card',
      memo: null,
      participants: ['이영희', '박민수', '김철수'],
      source: 'GOOGLE_SYNC',
    },
    /*
     * 구분이 빈 행 — 실제 장부에서 318건(12%) 이다. 서버가 detail 을 null 로
     * 내려주므로 칩에는 과제명만 남는다. 콜론만 덩그러니 남지 않는지 여기서 본다.
     */
    {
      id: '6',
      title: '창의도전 과제',
      detail: null,
      startDate: addDays(today, -1),
      endDate: addDays(today, -1),
      categoryKey: 'card',
      memo: null,
      // 명단에 없는 이름도 섞인다 — 장부의 참석자는 외부 인원을 포함한다
      participants: ['홍길동', '이영희', '박민수', '김철수', '김도연'],
      source: 'GOOGLE_SYNC',
    },
  ]
}

/**
 * 카드 내역 업로드 이력 (KAN-60).
 *
 * 한 회차는 일부만 반영된 것으로 둔다 — 오류가 있는 달을 보존했을 때 목록에서
 * 그 사실이 눈에 띄는지, 화면을 눌러 보지 않고는 알 수 없다.
 */
export function seedCardImports(today: string): MockCardImport[] {
  return [
    {
      id: '90',
      fileName: '회의록 인원.xlsx',
      status: 'SUCCESS',
      startedAt: `${today}T09:09:58+09:00`,
      finishedAt: `${today}T09:10:00+09:00`,
      durationMs: 2140,
      processed: 35,
      added: 3,
      updated: 0,
      removed: 0,
      skippedRows: 0,
      errorCode: null,
      problemCount: 0,
      problems: [],
    },
    {
      id: '89',
      fileName: '회의록 인원(수정).xlsx',
      status: 'PARTIAL',
      startedAt: `${addDays(today, -6)}T17:41:57+09:00`,
      finishedAt: `${addDays(today, -6)}T17:42:00+09:00`,
      durationMs: 3010,
      processed: 21,
      added: 2,
      updated: 0,
      removed: 1,
      skippedRows: 1,
      errorCode: null,
      problemCount: 1,
      problems: [
        {
          sheet: '2026년 9월',
          row: 14,
          level: 'ERROR',
          code: 'PROJECT_MISSING',
          message: '과제명이 비어 있어 해당 월 전체를 유지합니다.',
        },
      ],
    },
    /*
     * 실패한 회차도 남는다. 서버는 반영할 달이 하나도 없으면 422 로 거절하면서
     * sync_log 에는 FAILED 로 적는다 — 목록이 사유 코드를 보여주는지 여기서 본다.
     */
    {
      id: '88',
      fileName: '복사용 시트만.xlsx',
      status: 'FAILED',
      startedAt: `${addDays(today, -9)}T11:02:00+09:00`,
      finishedAt: `${addDays(today, -9)}T11:02:01+09:00`,
      durationMs: 980,
      processed: 0,
      added: 0,
      updated: 0,
      removed: 0,
      skippedRows: 0,
      errorCode: 'NO_APPLICABLE_MONTHS',
      problemCount: 0,
      problems: [],
    },
  ]
}
