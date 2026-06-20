import { Navigate, Outlet, type RouteObject, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom'
import AddApplication from './pages/jobApplication/addApplication/AddApplication'
import AddInterview from './pages/interview/addInterview/AddInterview'
import { ConfirmProvider } from 'material-ui-confirm'
import Dashboard from './pages/dashboard/Dashboard'
import InvalidPage from './pages/invalidPage/InvalidPage'
import Navbar from './components/navbar/Navbar'
import ProtectedRoutes from './components/protectedRoutes/ProtectedRoutes'
import SignIn from './pages/authentication/signIn/SignIn'
import SignUp from './pages/authentication/signUp/SignUp'
import UserGuide from './pages/userGuide/UserGuide'
import ViewApplication from './pages/jobApplication/viewApplication/ViewApplication'
import ViewArchivedApplication from './pages/archivedApplication/viewArchivedApplication/ViewArchivedApplication'
import ViewArchivedInterview from './pages/archivedApplication/viewArchivedInterview/ViewArchivedInterview'
import ViewInterview from './pages/interview/viewInterview/ViewInterview'
import { routes } from './routes'

const AppLayout = () => {
  const location = useLocation()
  // Stores all routes except for sign in and sign up
  const navbarRoutes: readonly string[] = [
    routes.addApplication,
    routes.viewApplications,
    routes.addInterview,
    routes.viewInterviews,
    routes.archivedApplications,
    routes.archivedInterviews,
    routes.dashboard,
  ]
  const showNavbar = navbarRoutes.includes(location.pathname)

  return (
    <div>
      {showNavbar && <Navbar />}
      <ConfirmProvider>
        <Outlet />
      </ConfirmProvider>
    </div>
  )
}

export const appRoutes: RouteObject[] = [{
  element: <AppLayout />,
  children: [
    { path: routes.root, element: <Navigate to={routes.signIn} replace /> },
    { path: routes.signIn, element: <SignIn /> },
    { path: routes.signUp, element: <SignUp /> },
    { path: routes.userGuide, element: <UserGuide /> },
    {
      element: <ProtectedRoutes />,
      children: [
        { path: routes.dashboard, element: <Dashboard /> },
        { path: routes.addApplication, element: <AddApplication /> },
        { path: routes.viewApplications, element: <ViewApplication /> },
        { path: routes.addInterview, element: <AddInterview /> },
        { path: routes.viewInterviews, element: <ViewInterview /> },
        { path: routes.archivedApplications, element: <ViewArchivedApplication /> },
        { path: routes.archivedInterviews, element: <ViewArchivedInterview /> },
        { path: '*', element: <InvalidPage /> },
      ],
    },
  ],
}]

const router = createBrowserRouter(appRoutes)

function App() {
  return <RouterProvider router={router} />
}

export default App
