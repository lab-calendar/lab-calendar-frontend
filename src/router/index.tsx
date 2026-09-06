import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import CalendarPage from '../pages/CalendarPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProjectsPage from '../pages/ProjectsPage'
import { ROUTES } from './routes'

export const router = createBrowserRouter([
  {
    path: ROUTES.calendar,
    element: <AppLayout />,
    children: [
      { index: true, element: <CalendarPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
