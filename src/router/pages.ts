import { lazy } from 'react'

/*
 * 화면 코드는 그 화면에 들어갈 때 받는다 (KAN-75).
 *
 * 한 덩어리로 묶여 있을 때는 비밀번호 화면에서도 달력 라이브러리까지 전부 기다려야
 * 했다. 인증이 필수라 모든 첫 방문이 그 화면을 거치는데, 입력칸 하나를 보려고
 * 달력·과제·구성원 코드를 받는 셈이었다.
 *
 * 비밀번호 화면은 그 입구라 나누지 않고 처음부터 함께 받는다 — 나누면 오히려 요청이
 * 한 번 더 늘어 첫 화면이 늦어진다. 로그인 화면은 한가해지면 달력 코드를 미리 받아
 * 둔다 (`LoginPage`).
 */
export const CalendarPage = lazy(() => import('../pages/CalendarPage'))
export const ProjectsPage = lazy(() => import('../pages/ProjectsPage'))
export const MembersPage = lazy(() => import('../pages/MembersPage'))
export const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
