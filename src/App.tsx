import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Profile from './pages/Profile'
import StaffLogin from './pages/StaffLogin'
import StaffHome from './pages/StaffHome'
import RequireStaffAuth from './components/RequireStaffAuth'

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
              <StaffHome />
            </RequireStaffAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
