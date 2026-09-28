import { addDays } from '../../utils/date'
import type { MockEvent, MockMember, MockProject } from './types'

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
     */
    {
      id: '4',
      title: '[법인카드 A]',
      detail: '다과비',
      startDate: addDays(today, 2),
      endDate: addDays(today, 2),
      categoryKey: 'card',
      memo: null,
      participants: ['홍길동', '김철수'],
      source: 'GOOGLE_SYNC',
    },
    {
      id: '5',
      title: '[연구비카드 B]',
      detail: '저녁',
      startDate: addDays(today, -2),
      endDate: addDays(today, -2),
      categoryKey: 'card',
      memo: null,
      participants: ['이영희', '박민수', '김철수'],
      source: 'GOOGLE_SYNC',
    },
  ]
}
