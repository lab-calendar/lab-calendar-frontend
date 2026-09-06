import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import CalendarPage from '../pages/CalendarPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProjectsPage from '../pages/ProjectsPage'
import RouteErrorPage from '../pages/RouteErrorPage'
import { ROUTES } from './routes'

export const router = createBrowserRouter([
  {
    path: ROUTES.calendar,
    element: <AppLayout />,
    // 화면을 그리다 터져도 흰 화면 대신 안내를 보여준다 (KAN-63)
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <CalendarPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
