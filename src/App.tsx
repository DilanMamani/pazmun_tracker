import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import StaffLogin from './pages/StaffLogin'
import StaffDashboard from './pages/StaffDashboard'
import StaffMeals from './pages/StaffMeals'
import StaffSearch from './pages/StaffSearch'
import RequireStaffAuth from './components/RequireStaffAuth'
import StaffLayout from './components/StaffLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/p/:code" element={<Profile />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route
          path="/staff"
          element={
            <RequireStaffAuth>
              <StaffLayout />
            </RequireStaffAuth>
          }
        >
          <Route index element={<StaffDashboard />} />
          <Route path="comidas" element={<StaffMeals />} />
          <Route path="buscar" element={<StaffSearch />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
