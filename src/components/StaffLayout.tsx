import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Icon from './Icon'

export default function StaffLayout() {
  return (
    <div className="staff-shell">
      <div className="staff-shell-header">
        <p className="credential-eyebrow">Panel de staff · PAZMUN 2026</p>
        <button type="button" className="staff-link-button" onClick={() => supabase.auth.signOut()}>
          <Icon name="logout" />
          Cerrar sesión
        </button>
      </div>

      <div className="staff-shell-content">
        <Outlet />
      </div>

      <nav className="staff-tabbar">
        <NavLink to="/staff" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon name="dashboard" />
          Dashboard
        </NavLink>
        <NavLink to="/staff/comidas" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon name="meal" />
          Comidas
        </NavLink>
        <NavLink to="/staff/buscar" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon name="search" />
          Buscar
        </NavLink>
      </nav>
    </div>
  )
}
