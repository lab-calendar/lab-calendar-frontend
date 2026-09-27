import { createBrowserRouter } from 'react-router-dom'
import RequireAuth from '../components/auth/RequireAuth'
import AppLayout from '../layouts/AppLayout'
import LoginPage from '../pages/LoginPage'
import RouteErrorPage from '../pages/RouteErrorPage'
import {
  CalendarPage,
  MembersPage,
  NotFoundPage,
  ProjectsPage,
} from './pages'
import { ROUTES } from './routes'

export const router = createBrowserRouter([
  {
    // 비밀번호 화면은 가드 밖에 둔다. 안에 두면 서로를 가리켜 리다이렉트가 돈다.
    path: ROUTES.login,
    element: <LoginPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: ROUTES.calendar,
    // 인증된 사용자만 레이아웃 안쪽으로 들어온다 (KAN-36)
    element: <RequireAuth />,
    // 화면을 그리다 터져도 흰 화면 대신 안내를 보여준다 (KAN-63)
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppLayout />,
        // 화면 코드는 들어갈 때 받는다 (KAN-75). 기다리는 자리는 AppLayout 의 Suspense.
        children: [
          { index: true, element: <CalendarPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'members', element: <MembersPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
