import { type RouteObject, RouterProvider, createBrowserRouter } from 'react-router-dom';
import AddApplication from './pages/jobApplication/addApplication/AddApplication';
import AddInterview from './pages/interview/addInterview/AddInterview';
import Dashboard from './pages/dashboard/Dashboard';
import InvalidPage from './pages/invalidPage/InvalidPage';
import ProtectedLayout from './components/protectedLayout/ProtectedLayout';
import ProtectedRoutes from './components/protectedRoutes/ProtectedRoutes';
import SignIn from './pages/authentication/signIn/SignIn';
import SignUp from './pages/authentication/signUp/SignUp';
import UserGuide from './pages/userGuide/UserGuide';
import ViewApplication from './pages/jobApplication/viewApplication/ViewApplication';
import ViewArchivedApplication from './pages/archivedApplication/viewArchivedApplication/ViewArchivedApplication';
import ViewArchivedInterview from './pages/archivedApplication/viewArchivedInterview/ViewArchivedInterview';
import ViewInterview from './pages/interview/viewInterview/ViewInterview';
import { routes } from './routes';

export const appRoutes: RouteObject[] = [
    { path: routes.signIn, element: <SignIn /> },
    { path: routes.signUp, element: <SignUp /> },
    { path: routes.userGuide, element: <UserGuide /> },
    {
        element: <ProtectedRoutes />,
        children: [
            {
                element: <ProtectedLayout />,
                children: [
                    { path: routes.dashboard, element: <Dashboard /> },
                    { path: routes.addApplication, element: <AddApplication /> },
                    { path: routes.viewApplications, element: <ViewApplication /> },
                    { path: routes.addInterview, element: <AddInterview /> },
                    { path: routes.viewInterviews, element: <ViewInterview /> },
                    { path: routes.archivedApplications, element: <ViewArchivedApplication /> },
                    { path: routes.archivedInterviews, element: <ViewArchivedInterview /> },
                ],
            },
            { path: '*', element: <InvalidPage /> },
        ],
    },
];

const router = createBrowserRouter(appRoutes);

function App() {
    return <RouterProvider router={router} />;
}

export default App;
