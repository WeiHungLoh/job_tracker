import { type RouteObject, RouterProvider, createBrowserRouter } from 'react-router-dom';
import AddApplication from './pages/application/jobApplication/addApplication/AddApplication';
import AddInterview from './pages/interview/jobInterview/addInterview/AddInterview';
import Dashboard from './pages/dashboard/Dashboard';
import FallbackScreen from './components/fallbackScreen/FallbackScreen';
import InvalidPage from './pages/invalidPage/InvalidPage';
import ProtectedLayout from './components/protectedLayout/ProtectedLayout';
import ProtectedRoutes from './components/protectedRoutes/ProtectedRoutes';
import SignIn from './pages/authentication/signIn/SignIn';
import SignUp from './pages/authentication/signUp/SignUp';
import UserGuide from './pages/userGuide/UserGuide';
import ViewApplication from './pages/application/jobApplication/viewApplication/ViewApplication';
import ViewArchivedApplication from './pages/application/archivedApplication/viewArchivedApplication/ViewArchivedApplication';
import ViewArchivedInterview from './pages/interview/archivedInterview/viewArchivedInterview/ViewArchivedInterview';
import ViewInterview from './pages/interview/jobInterview/viewInterview/ViewInterview';
import { routes } from './routes';

const reloadPage = () => window.location.reload();

export const appRoutes: RouteObject[] = [
    {
        errorElement: <FallbackScreen variant='authenticationError' onAction={reloadPage} />,
        children: [
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
                ],
            },
            { path: '*', element: <InvalidPage /> },
        ],
    },
];

const router = createBrowserRouter(appRoutes);

const App = () => {
    return <RouterProvider router={router} />;
};

export default App;
