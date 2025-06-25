import { Route, Routes, useLocation } from 'react-router-dom'
import AddApplication from './JobApplication/AddApplication.js'
import AddInterview from './Interview/AddInterview.js'
import { ConfirmProvider } from 'material-ui-confirm'
import InvalidPage from './InvalidPage.js'
import Navbar from './Navbar.js'
import ProtectedRoutes from './ProtectedRoutes.js'
import SignIn from './Authentication/SignIn.js'
import SignUp from './Authentication/SignUp.js'
import UserGuide from './UserGuide/UserGuide.js'
import ViewApplication from './JobApplication/ViewApplication.js'
import ViewArchivedApplication from './ArchivedApplication/ViewArchivedApplication.js'
import ViewArchivedInterview from './ArchivedApplication/ViewArchivedInterview.js'
import ViewInterview from './Interview/ViewInterview.js'

function App() {
  const location = useLocation()
  // Stores all routes except for sign in and sign up
  const navbarRoutes = ['/addapplication', '/viewapplications', '/addinterview', '/viewinterviews',
    '/viewarchivedapplications', '/viewarchivedinterviews'
  ]
  const showNavbar = navbarRoutes.includes(location.pathname)

  return (
    <div className='App'>
      {showNavbar && <Navbar />}
      <ConfirmProvider>
        <Routes>
          <Route path='/' element={<SignIn />} />
          <Route path='/signup' element={<SignUp />} />
          <Route path='/userguide' element={<UserGuide />} />

          <Route element={<ProtectedRoutes />}>
            <Route path='/addapplication' element={<AddApplication />} />
            <Route path='/viewapplications' element={<ViewApplication />} />
            <Route path='/addinterview' element={<AddInterview />} />
            <Route path='/viewinterviews' element={<ViewInterview />} />
            <Route path='/viewarchivedapplications' element={<ViewArchivedApplication />} />
            <Route path='/viewarchivedinterviews' element={<ViewArchivedInterview />} />
            <Route path='*' element={<InvalidPage />} />
          </Route>
        </Routes>
      </ConfirmProvider>
    </div>
  )
}

export default App
